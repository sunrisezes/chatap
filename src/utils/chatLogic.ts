export const SUPER_ADMIN_EMAIL = 'sunrisezes@gmail.com';

export type GenderOption = 'Female' | 'Male' | 'Non-Binary' | 'Prefer not to say';
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
export type RoomCategory = 'public' | 'private' | 'direct';
export type MessageType = 'text' | 'voice' | 'image' | 'video' | 'invite';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface UserProfile {
  uid: string;
  username: string;
  dob: string;
  age: number;
  gender: GenderOption;
  avatarUrl: string;
  bio: string;
  status: PresenceStatus;
  isGuest: boolean;
  isBanned: boolean;
  isMuted: boolean;
  visibility: 'public';
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StealthCoAdminRecord {
  uid: string;
  assignedBy: string;
  canBan: boolean;
  canMute: boolean;
  canResolveReports: boolean;
  createdAt: string;
}

export interface ChatRoomModel {
  id: string;
  name: string;
  topic: string;
  category: RoomCategory;
  ownerId: string;
  ownerName: string;
  isLocked: boolean;
  hasPassword: boolean;
  passwordHash: string;
  themeColor: string;
  isListed: boolean;
  participantIds?: string[];
  onlineCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageModel {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderGender?: GenderOption;
  senderAge?: number;
  type: MessageType;
  text: string;
  mediaUrl: string;
  voiceDuration: number;
  inviteRoomId?: string;
  inviteRoomName?: string;
  reactions?: Record<string, string[]>;
  createdAt: string;
}

export interface UserReportModel {
  id: string;
  reporterId: string;
  reporterName: string;
  targetUserId: string;
  targetUsername: string;
  reason: string;
  details: string;
  roomId: string;
  messageSnippet?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdSenseConfig {
  enabled: boolean;
  publisherId: string;
  sidebarSlotId: string;
  bannerSlotId: string;
  roomInterstitialSlotId: string;
  showTestPlaceholders: boolean;
}

const VALID_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const VALID_GENDERS: GenderOption[] = ['Female', 'Male', 'Non-Binary', 'Prefer not to say'];

export function isValidEntityId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && VALID_ID_REGEX.test(id);
}

export function calculateAgeFromDob(dob: string, referenceDate: Date = new Date('2026-10-20T00:00:00Z')): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return -1;
  }
  const [yearStr, monthStr, dayStr] = dob.split('-');
  const birthYear = Number(yearStr);
  const birthMonth = Number(monthStr);
  const birthDay = Number(dayStr);

  if (
    Number.isNaN(birthYear) ||
    Number.isNaN(birthMonth) ||
    Number.isNaN(birthDay) ||
    birthMonth < 1 ||
    birthMonth > 12 ||
    birthDay < 1 ||
    birthDay > 31
  ) {
    return -1;
  }

  let age = referenceDate.getUTCFullYear() - birthYear;
  const currentMonth = referenceDate.getUTCMonth() + 1;
  const currentDay = referenceDate.getUTCDate();

  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age -= 1;
  }
  return age;
}

export interface ProfileValidationResult {
  valid: boolean;
  error?: string;
  age?: number;
}

export function validateProfileInput(input: {
  username: string;
  dob: string;
  gender: string;
  email?: string;
  requireEmail?: boolean;
}): ProfileValidationResult {
  const trimmedName = (input.username || '').trim();
  if (trimmedName.length < 2 || trimmedName.length > 32) {
    return { valid: false, error: 'Username must be between 2 and 32 characters.' };
  }
  if (!VALID_GENDERS.includes(input.gender as GenderOption)) {
    return { valid: false, error: 'Please select a valid gender option.' };
  }
  const age = calculateAgeFromDob(input.dob);
  if (age < 18) {
    return { valid: false, error: 'You must be at least 18 years old to join the chat lounge.' };
  }
  if (age > 110) {
    return { valid: false, error: 'Please enter a valid date of birth.' };
  }
  if (input.requireEmail) {
    const email = (input.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
  }
  return { valid: true, age };
}

export function hashRoomPassword(password: string): string {
  const clean = (password || '').trim();
  if (!clean) return '';
  let hash = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `pvr_${(hash >>> 0).toString(16)}`;
}

export function verifyRoomPassword(
  room: Pick<ChatRoomModel, 'hasPassword' | 'passwordHash'>,
  candidatePassword: string,
  isModerator = false
): boolean {
  if (!room.hasPassword || !room.passwordHash) return true;
  if (isModerator) return true;
  return hashRoomPassword(candidatePassword) === room.passwordHash;
}

export function isSuperAdminUser(email?: string | null, isExplicitSuperAdmin = false): boolean {
  if (isExplicitSuperAdmin) return true;
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export function canAccessModerationConsole(params: {
  email?: string | null;
  isSuperAdminFlag?: boolean;
  coAdminRecord?: StealthCoAdminRecord | null;
}): boolean {
  if (isSuperAdminUser(params.email, params.isSuperAdminFlag)) return true;
  return Boolean(params.coAdminRecord);
}

export function canAssignStealthCoAdmin(params: {
  email?: string | null;
  isSuperAdminFlag?: boolean;
}): boolean {
  return isSuperAdminUser(params.email, params.isSuperAdminFlag);
}

export function canModerateTargetUser(params: {
  actorUid: string;
  actorEmail?: string | null;
  actorIsSuperAdmin?: boolean;
  actorCoAdmin?: StealthCoAdminRecord | null;
  targetUid: string;
  targetEmail?: string | null;
  targetIsSuperAdmin?: boolean;
  action: 'ban' | 'mute' | 'resolveReport';
}): boolean {
  if (params.actorUid === params.targetUid && params.action !== 'resolveReport') {
    return false;
  }
  if (isSuperAdminUser(params.targetEmail, params.targetIsSuperAdmin)) {
    return false;
  }
  if (isSuperAdminUser(params.actorEmail, params.actorIsSuperAdmin)) {
    return true;
  }
  if (!params.actorCoAdmin) {
    return false;
  }
  if (params.action === 'ban') return params.actorCoAdmin.canBan;
  if (params.action === 'mute') return params.actorCoAdmin.canMute;
  if (params.action === 'resolveReport') return params.actorCoAdmin.canResolveReports;
  return false;
}

/**
 * Strips any hidden administrative or private metadata so regular users inspecting
 * a profile can NEVER notice whether a user is a Super Admin or Stealth Co-Admin.
 */
export function getPublicProfileView(profile: UserProfile): UserProfile {
  return {
    uid: profile.uid,
    username: profile.username,
    dob: profile.dob,
    age: profile.age,
    gender: profile.gender,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    status: profile.status,
    isGuest: profile.isGuest,
    isBanned: profile.isBanned,
    isMuted: profile.isMuted,
    visibility: 'public',
    country: profile.country,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function canPostInRoom(params: {
  room: Pick<ChatRoomModel, 'isLocked' | 'ownerId'>;
  user: Pick<UserProfile, 'uid' | 'isBanned' | 'isMuted'>;
  isModerator: boolean;
}): { allowed: boolean; reason?: string } {
  if (params.user.isBanned) {
    return { allowed: false, reason: 'Your account has been suspended by moderation.' };
  }
  if (params.user.isMuted) {
    return { allowed: false, reason: 'Your account is currently muted from sending messages.' };
  }
  if (params.room.isLocked && params.room.ownerId !== params.user.uid && !params.isModerator) {
    return { allowed: false, reason: 'This room is currently locked by the host.' };
  }
  return { allowed: true };
}

export function filterBlockedMessages(
  messages: ChatMessageModel[],
  blockedUserIds: Set<string> | string[]
): ChatMessageModel[] {
  const blockedSet = blockedUserIds instanceof Set ? blockedUserIds : new Set(blockedUserIds);
  return messages.filter((msg) => !blockedSet.has(msg.senderId));
}

/**
 * Evaluates security rule invariants for Phase 0 / Phase 5 Red Team TDD verification.
 */
export interface SecurityRequestContext {
  auth: {
    uid: string;
    email?: string;
    email_verified?: boolean;
  } | null;
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestTime: string;
  incomingData?: Record<string, unknown>;
  existingData?: Record<string, unknown>;
  dbState: {
    users: Record<string, Record<string, unknown>>;
    coadmins: Record<string, Record<string, unknown>>;
    rooms: Record<string, Record<string, unknown>>;
    reports: Record<string, Record<string, unknown>>;
  };
}

export function evaluateFirestoreRuleSimulation(ctx: SecurityRequestContext): 'ALLOW' | 'PERMISSION_DENIED' {
  const isSignedIn = Boolean(ctx.auth && ctx.auth.uid && ctx.auth.email_verified === true);
  if (!isSignedIn || !ctx.auth) return 'PERMISSION_DENIED';

  const uid = ctx.auth.uid;
  const isSuperAdmin = ctx.auth.email === SUPER_ADMIN_EMAIL;
  const isCoAdmin = Boolean(ctx.dbState.coadmins[uid]);
  const isModerator = isSuperAdmin || isCoAdmin;

  const segments = ctx.path.split('/').filter(Boolean);

  // /users/{userId}
  if (segments[0] === 'users' && segments.length === 2) {
    const userId = segments[1];
    if (!isValidEntityId(userId)) return 'PERMISSION_DENIED';
    const data = ctx.incomingData || {};
    const allowedKeys = [
      'uid', 'username', 'dob', 'age', 'gender', 'avatarUrl', 'bio',
      'status', 'isGuest', 'isBanned', 'isMuted', 'visibility', 'createdAt', 'updatedAt',
    ];
    const hasExactKeys =
      Object.keys(data).length === allowedKeys.length &&
      Object.keys(data).every((k) => allowedKeys.includes(k));

    if (ctx.operation === 'create') {
      if (!hasExactKeys) return 'PERMISSION_DENIED';
      if (data.uid !== userId || data.uid !== uid) return 'PERMISSION_DENIED';
      if (data.isBanned !== false || data.isMuted !== false) return 'PERMISSION_DENIED';
      if (data.createdAt !== ctx.requestTime || data.updatedAt !== ctx.requestTime) return 'PERMISSION_DENIED';
      return 'ALLOW';
    }

    if (ctx.operation === 'update') {
      const existing = ctx.existingData || {};
      if (!hasExactKeys) return 'PERMISSION_DENIED';
      if (data.uid !== existing.uid || data.createdAt !== existing.createdAt) return 'PERMISSION_DENIED';
      if (data.updatedAt !== ctx.requestTime) return 'PERMISSION_DENIED';

      const changedKeys = Object.keys(data).filter((k) => data[k] !== existing[k]);
      const ownerAllowed = ['username', 'bio', 'avatarUrl', 'status', 'updatedAt'];
      const modAllowed = ['isBanned', 'isMuted', 'status', 'updatedAt'];

      if (
        uid === userId &&
        existing.isBanned === false &&
        data.isBanned === existing.isBanned &&
        data.isMuted === existing.isMuted &&
        changedKeys.every((k) => ownerAllowed.includes(k))
      ) {
        return 'ALLOW';
      }
      if (isModerator && changedKeys.every((k) => modAllowed.includes(k))) {
        return 'ALLOW';
      }
      return 'PERMISSION_DENIED';
    }
  }

  // /users/{userId}/private/{docId}
  if (segments[0] === 'users' && segments[2] === 'private' && segments.length === 4) {
    const userId = segments[1];
    const docId = segments[3];
    if (!isValidEntityId(userId) || !isValidEntityId(docId)) return 'PERMISSION_DENIED';
    if (!ctx.dbState.users[userId]) return 'PERMISSION_DENIED';
    if (ctx.operation === 'get') {
      return uid === userId || isSuperAdmin ? 'ALLOW' : 'PERMISSION_DENIED';
    }
  }

  // /coadmins/{userId}
  if (segments[0] === 'coadmins' && segments.length === 2) {
    const targetId = segments[1];
    if (!isValidEntityId(targetId)) return 'PERMISSION_DENIED';
    if (ctx.operation === 'get') {
      return uid === targetId || isSuperAdmin ? 'ALLOW' : 'PERMISSION_DENIED';
    }
    if (ctx.operation === 'list') {
      return isSuperAdmin ? 'ALLOW' : 'PERMISSION_DENIED';
    }
    if (ctx.operation === 'create' || ctx.operation === 'update' || ctx.operation === 'delete') {
      return isSuperAdmin && Boolean(ctx.dbState.users[targetId]) ? 'ALLOW' : 'PERMISSION_DENIED';
    }
  }

  // /rooms/{roomId}/messages/{messageId}
  if (segments[0] === 'rooms' && segments[2] === 'messages' && segments.length === 4) {
    const roomId = segments[1];
    const messageId = segments[3];
    if (!isValidEntityId(roomId) || !isValidEntityId(messageId)) return 'PERMISSION_DENIED';
    const parentRoom = ctx.dbState.rooms[roomId];
    if (!parentRoom) return 'PERMISSION_DENIED';

    if (ctx.operation === 'create') {
      const data = ctx.incomingData || {};
      const senderProfile = ctx.dbState.users[uid];
      if (!senderProfile || senderProfile.isBanned === true || senderProfile.isMuted === true) {
        return 'PERMISSION_DENIED';
      }
      if (data.id !== messageId || data.roomId !== roomId || data.senderId !== uid) {
        return 'PERMISSION_DENIED';
      }
      if (data.createdAt !== ctx.requestTime) {
        return 'PERMISSION_DENIED';
      }
      if (parentRoom.isLocked === true && parentRoom.ownerId !== uid && !isModerator) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOW';
    }
  }

  // /reports/{reportId}
  if (segments[0] === 'reports' && segments.length === 2) {
    const reportId = segments[1];
    if (!isValidEntityId(reportId)) return 'PERMISSION_DENIED';
    if (ctx.operation === 'update') {
      const existing = ctx.existingData || {};
      const incoming = ctx.incomingData || {};
      if (incoming.updatedAt !== ctx.requestTime) return 'PERMISSION_DENIED';
      if (isSuperAdmin) return 'ALLOW';
      if (
        isModerator &&
        existing.status === 'pending' &&
        (incoming.status === 'resolved' || incoming.status === 'dismissed')
      ) {
        return 'ALLOW';
      }
      return 'PERMISSION_DENIED';
    }
  }

  return 'PERMISSION_DENIED';
}
