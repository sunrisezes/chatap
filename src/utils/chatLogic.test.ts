import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAgeFromDob,
  validateProfileInput,
  hashRoomPassword,
  verifyRoomPassword,
  canAccessModerationConsole,
  canAssignStealthCoAdmin,
  canModerateTargetUser,
  getPublicProfileView,
  canPostInRoom,
  filterBlockedMessages,
  SUPER_ADMIN_EMAIL,
  type UserProfile,
  type ChatMessageModel,
} from './chatLogic.ts';

test('calculateAgeFromDob computes accurate age and rejects malformed dates', () => {
  const refDate = new Date('2026-10-20T00:00:00Z');
  assert.equal(calculateAgeFromDob('2000-10-20', refDate), 26);
  assert.equal(calculateAgeFromDob('2000-10-21', refDate), 25);
  assert.equal(calculateAgeFromDob('invalid-date', refDate), -1);
});

test('validateProfileInput enforces 18+ age requirement, username length, and optional email', () => {
  const validGuest = validateProfileInput({
    username: 'PrismVoyager',
    dob: '1998-04-12',
    gender: 'Female',
    requireEmail: false,
  });
  assert.equal(validGuest.valid, true);
  assert.equal(validGuest.age, 28);

  const underageGuest = validateProfileInput({
    username: 'YoungUser',
    dob: '2014-05-01',
    gender: 'Male',
  });
  assert.equal(underageGuest.valid, false);

  const invalidEmailMember = validateProfileInput({
    username: 'MemberUser',
    dob: '1995-01-10',
    gender: 'Non-Binary',
    email: 'not-an-email',
    requireEmail: true,
  });
  assert.equal(invalidEmailMember.valid, false);
});

test('password-protected (PVR) rooms verify password hashes and allow moderator override', () => {
  const hash = hashRoomPassword('secret777');
  const room = { hasPassword: true, passwordHash: hash };

  assert.equal(verifyRoomPassword(room, 'wrongpass', false), false);
  assert.equal(verifyRoomPassword(room, 'secret777', false), true);
  assert.equal(verifyRoomPassword(room, 'wrongpass', true), true);
});

test('RBAC: only sunrisezes@gmail.com can assign stealth co-admins, while co-admins can moderate regular users', () => {
  assert.equal(canAssignStealthCoAdmin({ email: SUPER_ADMIN_EMAIL }), true);
  assert.equal(canAssignStealthCoAdmin({ email: 'random@example.com' }), false);

  const coAdminRecord = {
    uid: 'coadmin_1',
    assignedBy: 'admin_1',
    canBan: true,
    canMute: true,
    canResolveReports: true,
    createdAt: '2026-10-20T10:00:00Z',
  };

  assert.equal(
    canAccessModerationConsole({ email: 'coadmin@example.com', coAdminRecord }),
    true
  );

  // Co-admin can ban a regular user
  assert.equal(
    canModerateTargetUser({
      actorUid: 'coadmin_1',
      actorEmail: 'coadmin@example.com',
      actorCoAdmin: coAdminRecord,
      targetUid: 'user_99',
      targetEmail: 'user99@example.com',
      action: 'ban',
    }),
    true
  );

  // Co-admin CANNOT ban the Super Admin
  assert.equal(
    canModerateTargetUser({
      actorUid: 'coadmin_1',
      actorEmail: 'coadmin@example.com',
      actorCoAdmin: coAdminRecord,
      targetUid: 'super_admin_uid',
      targetEmail: SUPER_ADMIN_EMAIL,
      action: 'ban',
    }),
    false
  );
});

test('getPublicProfileView strips hidden fields so Stealth Co-Admins look identical to regular users', () => {
  const rawProfile = {
    uid: 'coadmin_1',
    username: 'Aria',
    dob: '1999-03-15',
    age: 27,
    gender: 'Female' as const,
    avatarUrl: 'data:image/svg+xml;utf8,<svg></svg>',
    bio: 'Music & late night chats',
    status: 'online' as const,
    isGuest: false,
    isBanned: false,
    isMuted: false,
    visibility: 'public' as const,
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
    secretRole: 'co-admin',
    email: 'aria@secret.com',
  } as unknown as UserProfile;

  const publicView = getPublicProfileView(rawProfile) as unknown as Record<string, unknown>;
  assert.equal(publicView.secretRole, undefined);
  assert.equal(publicView.email, undefined);
  assert.equal(publicView.username, 'Aria');
});

test('canPostInRoom blocks banned users, muted users, and non-owners in locked rooms', () => {
  const unlockedRoom = { isLocked: false, ownerId: 'host_1' };
  const lockedRoom = { isLocked: true, ownerId: 'host_1' };

  assert.equal(
    canPostInRoom({
      room: unlockedRoom,
      user: { uid: 'u1', isBanned: true, isMuted: false },
      isModerator: false,
    }).allowed,
    false
  );

  assert.equal(
    canPostInRoom({
      room: unlockedRoom,
      user: { uid: 'u1', isBanned: false, isMuted: true },
      isModerator: false,
    }).allowed,
    false
  );

  assert.equal(
    canPostInRoom({
      room: lockedRoom,
      user: { uid: 'u1', isBanned: false, isMuted: false },
      isModerator: false,
    }).allowed,
    false
  );

  assert.equal(
    canPostInRoom({
      room: lockedRoom,
      user: { uid: 'host_1', isBanned: false, isMuted: false },
      isModerator: false,
    }).allowed,
    true
  );
});

test('filterBlockedMessages hides messages from blocked user IDs', () => {
  const messages: ChatMessageModel[] = [
    {
      id: 'm1',
      roomId: 'r1',
      senderId: 'user_good',
      senderName: 'GoodUser',
      senderAvatar: 'avatar1',
      type: 'text',
      text: 'Hello everyone!',
      mediaUrl: '',
      voiceDuration: 0,
      createdAt: '2026-10-20T10:00:00Z',
    },
    {
      id: 'm2',
      roomId: 'r1',
      senderId: 'user_spammer',
      senderName: 'Spammer',
      senderAvatar: 'avatar2',
      type: 'text',
      text: 'Buy spam!',
      mediaUrl: '',
      voiceDuration: 0,
      createdAt: '2026-10-20T10:01:00Z',
    },
  ];

  const filtered = filterBlockedMessages(messages, new Set(['user_spammer']));
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].senderId, 'user_good');
});
