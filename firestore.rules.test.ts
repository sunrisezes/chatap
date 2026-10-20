import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFirestoreRuleSimulation, SUPER_ADMIN_EMAIL } from './src/utils/chatLogic.ts';

const NOW = '2026-10-20T11:00:00Z';

function createBaseDbState() {
  return {
    users: {
      user_1: {
        uid: 'user_1',
        username: 'Alice',
        dob: '1999-05-10',
        age: 27,
        gender: 'Female',
        avatarUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        bio: 'Hello',
        status: 'online',
        isGuest: false,
        isBanned: false,
        isMuted: false,
        visibility: 'public',
        createdAt: NOW,
        updatedAt: NOW,
      },
      user_muted: {
        uid: 'user_muted',
        username: 'MutedBob',
        dob: '1995-01-01',
        age: 31,
        gender: 'Male',
        avatarUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        bio: '',
        status: 'online',
        isGuest: true,
        isBanned: false,
        isMuted: true,
        visibility: 'public',
        createdAt: NOW,
        updatedAt: NOW,
      },
      coadmin_1: {
        uid: 'coadmin_1',
        username: 'StealthMod',
        dob: '1997-08-15',
        age: 29,
        gender: 'Female',
        avatarUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        bio: '',
        status: 'online',
        isGuest: false,
        isBanned: false,
        isMuted: false,
        visibility: 'public',
        createdAt: NOW,
        updatedAt: NOW,
      },
    },
    coadmins: {
      coadmin_1: {
        uid: 'coadmin_1',
        assignedBy: 'super_admin',
        canBan: true,
        canMute: true,
        canResolveReports: true,
        createdAt: NOW,
      },
    },
    rooms: {
      room_open: {
        id: 'room_open',
        name: 'Global Lounge',
        ownerId: 'user_1',
        isLocked: false,
      },
      room_locked: {
        id: 'room_locked',
        name: 'VIP Locked',
        ownerId: 'user_1',
        isLocked: true,
      },
    },
    reports: {
      rep_resolved: {
        id: 'rep_resolved',
        reporterId: 'user_1',
        targetUserId: 'user_muted',
        roomId: 'room_open',
        status: 'resolved',
        createdAt: NOW,
        updatedAt: NOW,
      },
    },
  };
}

test('Dirty Dozen #1: Shadow Field Injection on Profile is PERMISSION_DENIED', () => {
  const dbState = createBaseDbState();
  const res = evaluateFirestoreRuleSimulation({
    auth: { uid: 'user_new', email: 'new@example.com', email_verified: true },
    path: '/users/user_new',
    operation: 'create',
    requestTime: NOW,
    incomingData: {
      ...dbState.users.user_1,
      uid: 'user_new',
      isAdmin: true, // Ghost field!
    },
    dbState,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #2: Self-Unbanning by Banned User is PERMISSION_DENIED', () => {
  const dbState = createBaseDbState();
  const bannedExisting = { ...dbState.users.user_1, isBanned: true };
  const res = evaluateFirestoreRuleSimulation({
    auth: { uid: 'user_1', email: 'alice@example.com', email_verified: true },
    path: '/users/user_1',
    operation: 'update',
    requestTime: NOW,
    existingData: bannedExisting,
    incomingData: { ...bannedExisting, isBanned: false, updatedAt: NOW },
    dbState,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #3: Unverified Admin Email Spoof is PERMISSION_DENIED', () => {
  const dbState = createBaseDbState();
  const res = evaluateFirestoreRuleSimulation({
    auth: { uid: 'spoof_uid', email: SUPER_ADMIN_EMAIL, email_verified: false },
    path: '/coadmins/user_1',
    operation: 'create',
    requestTime: NOW,
    incomingData: {
      uid: 'user_1',
      assignedBy: 'spoof_uid',
      canBan: true,
      canMute: true,
      canResolveReports: true,
      createdAt: NOW,
    },
    dbState,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #4: PII Leak via Cross-User Get on /users/{id}/private/info is PERMISSION_DENIED', () => {
  const dbState = createBaseDbState();
  const res = evaluateFirestoreRuleSimulation({
    auth: { uid: 'user_2', email: 'bob@example.com', email_verified: true },
    path: '/users/user_1/private/info',
    operation: 'get',
    requestTime: NOW,
    dbState,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #5: Stealth Co-Admin Enumeration by Regular User is PERMISSION_DENIED', () => {
  const dbState = createBaseDbState();
  const res = evaluateFirestoreRuleSimulation({
    auth: { uid: 'user_1', email: 'alice@example.com', email_verified: true },
    path: '/coadmins/coadmin_1',
    operation: 'get',
    requestTime: NOW,
    dbState,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #6: Co-Admin Privilege Escalation (creating another Co-Admin) is PERMISSION_DENIED', () => {
  const dbState = createBaseDbState();
  const res = evaluateFirestoreRuleSimulation({
    auth: { uid: 'coadmin_1', email: 'mod@example.com', email_verified: true },
    path: '/coadmins/user_1',
    operation: 'create',
    requestTime: NOW,
    incomingData: {
      uid: 'user_1',
      assignedBy: 'coadmin_1',
      canBan: true,
      canMute: true,
      canResolveReports: true,
      createdAt: NOW,
    },
    dbState,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #7: Orphaned Message in Non-Existent Room is PERMISSION_DENIED', () => {
  const dbState = createBaseDbState();
  const res = evaluateFirestoreRuleSimulation({
    auth: { uid: 'user_1', email: 'alice@example.com', email_verified: true },
    path: '/rooms/ghost_room/messages/msg_1',
    operation: 'create',
    requestTime: NOW,
    incomingData: {
      id: 'msg_1',
      roomId: 'ghost_room',
      senderId: 'user_1',
      createdAt: NOW,
    },
    dbState,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #8: Non-owner Posting in Locked Room is PERMISSION_DENIED', () => {
  const dbState = createBaseDbState();
  dbState.users.user_2 = { ...dbState.users.user_1, uid: 'user_2' };
  const res = evaluateFirestoreRuleSimulation({
    auth: { uid: 'user_2', email: 'bob@example.com', email_verified: true },
    path: '/rooms/room_locked/messages/msg_1',
    operation: 'create',
    requestTime: NOW,
    incomingData: {
      id: 'msg_1',
      roomId: 'room_locked',
      senderId: 'user_2',
      createdAt: NOW,
    },
    dbState,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #9: Muted User Posting Message is PERMISSION_DENIED', () => {
  const dbState = createBaseDbState();
  const res = evaluateFirestoreRuleSimulation({
    auth: { uid: 'user_muted', email: 'muted@example.com', email_verified: true },
    path: '/rooms/room_open/messages/msg_1',
    operation: 'create',
    requestTime: NOW,
    incomingData: {
      id: 'msg_1',
      roomId: 'room_open',
      senderId: 'user_muted',
      createdAt: NOW,
    },
    dbState,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #10: ID Poisoning with invalid characters is PERMISSION_DENIED', () => {
  const dbState = createBaseDbState();
  const res = evaluateFirestoreRuleSimulation({
    auth: { uid: 'user_1', email: 'alice@example.com', email_verified: true },
    path: '/rooms/room_open/messages/bad$id!@#',
    operation: 'create',
    requestTime: NOW,
    incomingData: {
      id: 'bad$id!@#',
      roomId: 'room_open',
      senderId: 'user_1',
      createdAt: NOW,
    },
    dbState,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #11: Client-forged past createdAt timestamp is PERMISSION_DENIED', () => {
  const dbState = createBaseDbState();
  const res = evaluateFirestoreRuleSimulation({
    auth: { uid: 'user_1', email: 'alice@example.com', email_verified: true },
    path: '/rooms/room_open/messages/msg_1',
    operation: 'create',
    requestTime: NOW,
    incomingData: {
      id: 'msg_1',
      roomId: 'room_open',
      senderId: 'user_1',
      createdAt: '2020-01-01T00:00:00Z',
    },
    dbState,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #12: Reopening a Terminal Resolved Report by Co-Admin is PERMISSION_DENIED', () => {
  const dbState = createBaseDbState();
  const res = evaluateFirestoreRuleSimulation({
    auth: { uid: 'coadmin_1', email: 'mod@example.com', email_verified: true },
    path: '/reports/rep_resolved',
    operation: 'update',
    requestTime: NOW,
    existingData: dbState.reports.rep_resolved,
    incomingData: {
      ...dbState.reports.rep_resolved,
      status: 'pending',
      updatedAt: NOW,
    },
    dbState,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});
