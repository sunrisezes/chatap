import React, { useState } from 'react';
import { Flag, KeyRound, Lock, PlusCircle, Send, Unlock, X } from 'lucide-react';
import type { ChatRoomModel, RoomCategory, UserProfile } from '../utils/chatLogic';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (payload: {
    name: string;
    topic: string;
    category: RoomCategory;
    password?: string;
    isLocked: boolean;
    themeColor: string;
  }) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
}) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<RoomCategory>('public');
  const [password, setPassword] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [themeColor, setThemeColor] = useState('cobalt');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Room name must be at least 2 characters.');
      return;
    }
    if (category === 'private' && password.trim().length < 2) {
      setError('Please set a passcode (at least 2 characters) for a password-protected PVR room.');
      return;
    }
    onCreateRoom({
      name: name.trim(),
      topic: topic.trim() || 'Welcome to our live chat room!',
      category,
      password: category === 'private' ? password.trim() : '',
      isLocked,
      themeColor,
    });
    setName('');
    setTopic('');
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-room-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="h-5 w-5 text-blue-400" />
            <h2 id="create-room-title" className="font-['Outfit'] text-lg font-bold text-white">
              Create Custom Chat Room
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close create room modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="room-name-input" className="block text-xs font-semibold text-slate-200">
              Room Title
            </label>
            <input
              id="room-name-input"
              type="text"
              required
              maxLength={60}
              placeholder="e.g. Neon Rooftop Lounge"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="room-topic-input" className="block text-xs font-semibold text-slate-200">
              Room Topic / Welcome Note
            </label>
            <input
              id="room-topic-input"
              type="text"
              maxLength={160}
              placeholder="What is everyone chatting about?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCategory('public')}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                category === 'public'
                  ? 'border-blue-500 bg-blue-500/15 text-white'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-semibold">Public Room</span>
              <span className="mt-0.5 text-[11px] text-slate-400">
                Open to everyone in the directory
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCategory('private')}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                category === 'private'
                  ? 'border-amber-500 bg-amber-500/15 text-white'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-semibold">Password PVR Room</span>
              <span className="mt-0.5 text-[11px] text-slate-400">
                Requires passcode or direct invite
              </span>
            </button>
          </div>

          {category === 'private' && (
            <div>
              <label
                htmlFor="room-password-input"
                className="block text-xs font-semibold text-amber-300"
              >
                PVR Room Passcode
              </label>
              <input
                id="room-password-input"
                type="text"
                required
                maxLength={32}
                placeholder="Enter secret passcode (e.g. 7788)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-amber-500/50 bg-slate-950 px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div>
              <span className="block text-xs font-semibold text-slate-200">
                Initial Room Lock State
              </span>
              <span className="text-[11px] text-slate-400">
                When locked, only you (the room host) can post messages.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLocked((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isLocked
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              <span>{isLocked ? 'Locked' : 'Unlocked'}</span>
            </button>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-200">
              3D Spatial Room Accent
            </span>
            <div className="mt-2 flex items-center gap-2">
              {[
                { id: 'cobalt', label: 'Cobalt' },
                { id: 'coral', label: 'Coral' },
                { id: 'emerald', label: 'Emerald' },
                { id: 'amber', label: 'Amber' },
                { id: 'rose', label: 'Rose' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeColor(t.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    themeColor === t.id
                      ? 'border-blue-400 bg-blue-600/25 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              Launch Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RoomPasswordModalProps {
  room: ChatRoomModel | null;
  onClose: () => void;
  onSubmitPassword: (room: ChatRoomModel, password: string) => boolean;
}

export const RoomPasswordModal: React.FC<RoomPasswordModalProps> = ({
  room,
  onClose,
  onSubmitPassword,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!room) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onSubmitPassword(room, password);
    if (!ok) {
      setError('Incorrect room passcode. (Tip: Demo PVR passcode is 2026)');
      return;
    }
    setPassword('');
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pvr-password-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <KeyRound className="h-5 w-5" />
            <h2 id="pvr-password-title" className="font-['Outfit'] text-lg font-bold text-white">
              Unlock Private PVR Room
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close passcode prompt"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-300">
          Enter the room passcode to join <strong className="text-white">{room.name}</strong> hosted
          by {room.ownerName}.
        </p>

        {error && (
          <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="pvr-passcode-field" className="block text-xs font-semibold text-slate-200">
              Passcode
            </label>
            <input
              id="pvr-passcode-field"
              type="password"
              required
              placeholder="Enter room passcode..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-sm text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
            >
              Unlock & Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface InviteUsersModalProps {
  isOpen: boolean;
  room: ChatRoomModel;
  onlineUsers: UserProfile[];
  currentUserId: string;
  onClose: () => void;
  onSendInvite: (targetUser: UserProfile, room: ChatRoomModel) => void;
}

export const InviteUsersModal: React.FC<InviteUsersModalProps> = ({
  isOpen,
  room,
  onlineUsers,
  currentUserId,
  onClose,
  onSendInvite,
}) => {
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const candidates = onlineUsers.filter((u) => u.uid !== currentUserId && !u.isBanned);

  const handleInvite = (user: UserProfile) => {
    onSendInvite(user, room);
    setInvitedIds((prev) => [...prev, user.uid]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-users-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 id="invite-users-title" className="font-['Outfit'] text-lg font-bold text-white">
            Invite Online Users to {room.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invite modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Invited users receive an instant room pass link (automatically unlocking PVR access).
        </p>

        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
          {candidates.map((user) => {
            const isSent = invitedIds.includes(user.uid);
            return (
              <div
                key={user.uid}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    referrerPolicy="no-referrer"
                    className="h-9 w-9 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">{user.username}</p>
                    <p className="text-[11px] text-slate-400">
                      {user.age} · {user.gender}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSent}
                  onClick={() => handleInvite(user)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isSent
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  <Send className="h-3 w-3" />
                  <span>{isSent ? 'Invited' : 'Send Invite'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface ReportUserModalProps {
  targetUser: UserProfile | null;
  roomId: string;
  onClose: () => void;
  onSubmitReport: (payload: {
    targetUser: UserProfile;
    reason: string;
    details: string;
    roomId: string;
  }) => void;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  targetUser,
  roomId,
  onClose,
  onSubmitReport,
}) => {
  const [reason, setReason] = useState('Spam / Unsolicited Links');
  const [details, setDetails] = useState('');

  if (!targetUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport({
      targetUser,
      reason,
      details: details.trim() || 'Reported from live chat directory.',
      roomId,
    });
    setDetails('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-user-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-red-400">
            <Flag className="h-5 w-5" />
            <h2 id="report-user-title" className="font-['Outfit'] text-lg font-bold text-white">
              Report {targetUser.username}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="report-reason-select" className="block text-xs font-semibold text-slate-200">
              Violation Category
            </label>
            <select
              id="report-reason-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
            >
              <option value="Spam / Unsolicited Links">Spam / Unsolicited Links</option>
              <option value="Harassment / Abusive Language">Harassment / Abusive Language</option>
              <option value="Inappropriate Image / Voice Note">Inappropriate Image / Voice Note</option>
              <option value="Impersonation / Fake Profile">Impersonation / Fake Profile</option>
              <option value="Underage / Community Guidelines">Underage / Community Guidelines</option>
            </select>
          </div>

          <div>
            <label htmlFor="report-details-input" className="block text-xs font-semibold text-slate-200">
              Additional Details
            </label>
            <textarea
              id="report-details-input"
              rows={3}
              maxLength={500}
              placeholder="Describe what happened so our safety team can review this..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-500"
            >
              Submit Official Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
