# Security Specification (`security_spec.md`)

## 1. Data Invariants & Master Gate Relationships
1. **Verified Identity & Anti-Spoofing**: All standard Firestore operations require `request.auth != null && request.auth.token.email_verified == true`.
2. **Super Admin & Stealth Co-Admin Isolation**:
   - Super Admin is strictly bootstrapped to `sunrisezes@gmail.com` (with `email_verified == true`) or `/admins/$(request.auth.uid)`.
   - Stealth Co-Admins are stored in `/coadmins/{userId}`. Only Super Admin can create, update, or delete `/coadmins/{userId}`. Regular users cannot read `/coadmins/{userId}`, ensuring Co-Admins remain 100% undetectable on public profiles.
3. **PII Split-Collection Isolation**: User email addresses are never stored on `/users/{userId}`. They live exclusively in `/users/{userId}/private/{docId}`, readable only by `request.auth.uid == userId` or `isSuperAdmin()`.
4. **Master Gate for Subcollections**:
   - `/rooms/{roomId}/messages/{messageId}` requires `exists(/databases/$(database)/documents/rooms/$(roomId))` and verifies the room is unlocked (`isLocked == false`) unless the sender is a moderator.
   - `/users/{userId}/blocks/{targetUserId}` and `/users/{userId}/private/{docId}` require `exists(/databases/$(database)/documents/users/$(userId))`.
5. **Self-Assigned Privilege Prevention**: Regular users creating `/users/{userId}` must initialize `isBanned == false` and `isMuted == false`. Only moderators (`isSuperAdmin() || isCoAdmin()`) can toggle `isBanned` or `isMuted` via an explicit moderation update action.
6. **Terminal State Locking**: Once a `UserReport` in `/reports/{reportId}` reaches `status == 'resolved'` or `status == 'dismissed'`, non-super-admins cannot reopen or mutate it.
7. **Temporal Integrity**: Every `create` enforces `incoming().createdAt == request.time` (and `updatedAt == request.time` where applicable); every `update` enforces `incoming().updatedAt == request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Shadow Field Injection on Profile)**: Creating `/users/user_1` with an extra field `"isAdmin": true` -> Rejected by `hasOnly()`.
2. **Payload 2 (Self-Unbanning)**: Banned user updating `/users/user_1` to set `"isBanned": false` -> Rejected because user update action only permits `['username', 'bio', 'avatarUrl', 'status', 'updatedAt']`.
3. **Payload 3 (Unverified Admin Email Spoof)**: User with `email: "sunrisezes@gmail.com"` and `email_verified: false` writing to `/coadmins/user_2` -> Rejected by `isSignedIn()` requiring `email_verified == true`.
4. **Payload 4 (PII Leak via Cross-User Get)**: Authenticated `user_2` calling `get` on `/users/user_1/private/info` -> Rejected by owner-only gate.
5. **Payload 5 (Stealth Co-Admin Enumeration)**: Authenticated `user_2` calling `get` or `list` on `/coadmins/user_1` -> Rejected because only `isSuperAdmin()` or `request.auth.uid == userId` can read.
6. **Payload 6 (Co-Admin Privilege Escalation)**: A Stealth Co-Admin attempting to create another Co-Admin in `/coadmins/user_3` -> Rejected because only `isSuperAdmin()` can write to `/coadmins`.
7. **Payload 7 (Orphaned Message in Non-Existent Room)**: Creating `/rooms/ghost_room/messages/msg_1` where `ghost_room` does not exist -> Rejected by Master Gate `exists()`.
8. **Payload 8 (Posting in Locked Room)**: Normal user creating a message in `/rooms/locked_room/messages/msg_1` when `isLocked == true` -> Rejected by parent room `get().data.isLocked == false` check.
9. **Payload 9 (Muted User Posting Message)**: User whose `/users/$(request.auth.uid).data.isMuted == true` attempting to create a message -> Rejected by sender mute check.
10. **Payload 10 (ID Poisoning / Resource Exhaustion)**: Creating a room or message with a 500-character ID or invalid characters (`room$@#`) -> Rejected by `isValidId()`.
11. **Payload 11 (Timestamp Forgery)**: Creating a message with a client-forged past `createdAt` timestamp -> Rejected by `incoming().createdAt == request.time`.
12. **Payload 12 (Terminal Report Re-opening)**: Attempting to update a resolved report (`status: 'resolved'`) as a non-super-admin -> Rejected by terminal state lock.
