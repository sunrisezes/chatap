import React, { useState } from 'react';
import {
  Ban,
  CheckCircle2,
  EyeOff,
  Flag,
  Lock,
  Megaphone,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Unlock,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  canAssignStealthCoAdmin,
  canModerateTargetUser,
  SUPER_ADMIN_EMAIL,
  type AdSenseConfig,
  type ChatRoomModel,
  type ReportStatus,
  type StealthCoAdminRecord,
  type UserProfile,
  type UserReportModel,
} from '../utils/chatLogic';

interface AdminControlPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  currentUserEmail?: string | null;
  isSuperAdmin: boolean;
  coAdmins: Record<string, StealthCoAdminRecord>;
  users: UserProfile[];
  reports: UserReportModel[];
  rooms: ChatRoomModel[];
  adSenseConfig: AdSenseConfig;
  onToggleBanUser: (targetUid: string) => void;
  onToggleMuteUser: (targetUid: string) => void;
  onToggleStealthCoAdmin: (targetUid: string) => void;
  onUpdateReportStatus: (
    reportId: string,
    status: ReportStatus,
    moderationAction?: 'ban' | 'mute'
  ) => void;
  onToggleRoomLock: (roomId: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onUpdateAdSenseConfig: (config: AdSenseConfig) => void;
  initialTab?: 'users' | 'reports' | 'rooms' | 'adsense';
}

export const AdminControlPanelModal: React.FC<AdminControlPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentUserEmail,
  isSuperAdmin,
  coAdmins,
  users,
  reports,
  rooms,
  adSenseConfig,
  onToggleBanUser,
  onToggleMuteUser,
  onToggleStealthCoAdmin,
  onUpdateReportStatus,
  onToggleRoomLock,
  onDeleteRoom,
  onUpdateAdSenseConfig,
  initialTab = 'users',
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'rooms' | 'adsense'>(initialTab);
  const [userSearch, setUserSearch] = useState('');
  const [reportFilter, setReportFilter] = useState<'all' | ReportStatus>('all');
  const [draftAdConfig, setDraftAdConfig] = useState<AdSenseConfig>(adSenseConfig);
  const [adSavedToast, setAdSavedToast] = useState(false);

  if (!isOpen) return null;

  const actorCoAdmin = coAdmins[currentUser.uid] || null;
  const allowAssignCoAdmin = canAssignStealthCoAdmin({
    email: currentUserEmail,
    isSuperAdminFlag: isSuperAdmin,
  });

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q) ||
      u.gender.toLowerCase().includes(q)
    );
  });

  const filteredReports = reports.filter((r) =>
    reportFilter === 'all' ? true : r.status === reportFilter
  );

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;
  const bannedUsersCount = users.filter((u) => u.isBanned).length;
  const mutedUsersCount = users.filter((u) => u.isMuted).length;
  const stealthCoAdminCount = Object.keys(coAdmins).length;

  const handleSaveAdConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAdSenseConfig(draftAdConfig);
    setAdSavedToast(true);
    window.setTimeout(() => setAdSavedToast(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-console-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Console Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 id="admin-console-title" className="font-['Outfit'] text-lg font-bold text-white">
                High-Security Moderation & Admin Control Panel
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>
                   Clearance: {isSuperAdmin ? `Owner Super Admin (${SUPER_ADMIN_EMAIL})` : 'Stealth Co-Admin'}
                </span>
                <span aria-hidden="true">·</span>
                <span>Zero Public Badge Leakage Active</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin control panel"
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary Metrics Bar */}
        <div className="grid grid-cols-2 gap-px bg-slate-800 sm:grid-cols-4">
          <div className="bg-slate-950 px-5 py-3">
            <span className="text-xs text-slate-400">Active Directory Users</span>
            <p className="mt-0.5 font-mono text-xl font-bold text-white tabular-nums">
              {users.length}
            </p>
          </div>
          <div className="bg-slate-950 px-5 py-3">
            <span className="text-xs text-slate-400">Pending Abuse Reports</span>
            <p className="mt-0.5 font-mono text-xl font-bold text-amber-400 tabular-nums">
              {pendingReportsCount}
            </p>
          </div>
          <div className="bg-slate-950 px-5 py-3">
            <span className="text-xs text-slate-400">Banned / Muted IDs</span>
            <p className="mt-0.5 font-mono text-xl font-bold text-red-400 tabular-nums">
              {bannedUsersCount} / {mutedUsersCount}
            </p>
          </div>
          <div className="bg-slate-950 px-5 py-3">
            <span className="text-xs text-slate-400">Stealth Co-Admins</span>
            <p className="mt-0.5 font-mono text-xl font-bold text-emerald-400 tabular-nums">
              {stealthCoAdminCount}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 bg-slate-900/50 px-6 py-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Active Users & Stealth Co-Admins ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            <span>Reported Users Queue ({reports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'rooms'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Rooms & PVR Governance ({rooms.length})</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('adsense')}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'adsense'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Megaphone className="h-3.5 w-3.5" />
              <span>Google AdSense Monetization</span>
            </button>
          )}
        </div>

        {/* Main Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: ACTIVE USERS & STEALTH CO-ADMINS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="relative max-w-md flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by username, UID, or gender..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    aria-label="Search users in admin panel"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pr-4 pl-10 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <EyeOff className="h-4 w-4 text-emerald-400" />
                  <span>
                    Stealth Co-Admins appear as normal users on public profiles; only you can see or
                    assign them here.
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                      <th className="px-4 py-3 font-semibold">User & UID</th>
                      <th className="px-4 py-3 font-semibold">Profile Details</th>
                      <th className="px-4 py-3 font-semibold">Account State</th>
                      <th className="px-4 py-3 font-semibold">Stealth Co-Admin Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950">
                    {filteredUsers.map((u) => {
                      const isTargetCoAdmin = Boolean(coAdmins[u.uid]);
                      const isTargetSelf = u.uid === currentUser.uid;
                      const canBanThisUser = canModerateTargetUser({
                        actorUid: currentUser.uid,
                        actorEmail: currentUserEmail,
                        actorIsSuperAdmin: isSuperAdmin,
                        actorCoAdmin,
                        targetUid: u.uid,
                        action: 'ban',
                      });
                      const canMuteThisUser = canModerateTargetUser({
                        actorUid: currentUser.uid,
                        actorEmail: currentUserEmail,
                        actorIsSuperAdmin: isSuperAdmin,
                        actorCoAdmin,
                        targetUid: u.uid,
                        action: 'mute',
                      });

                      return (
                        <tr key={u.uid} className="hover:bg-slate-900/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatarUrl}
                                alt={u.username}
                                referrerPolicy="no-referrer"
                                className="h-9 w-9 rounded-xl object-cover"
                              />
                              <div>
                                <div className="font-semibold text-white">
                                  {u.username} {isTargetSelf && '(You)'}
                                </div>
                                <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                                  ID: {u.uid}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300 tabular-nums">
                            <span>{u.age} yrs</span>
                            <span aria-hidden="true"> · </span>
                            <span>{u.gender}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{u.isGuest ? 'Guest' : 'Verified Email'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-xs">
                              {u.isBanned ? (
                                <span className="font-semibold text-red-400">Banned ID</span>
                              ) : u.isMuted ? (
                                <span className="font-semibold text-amber-400">Muted ID</span>
                              ) : (
                                <span className="text-emerald-400">Active ({u.status})</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isTargetCoAdmin ? (
                              <span className="font-semibold text-emerald-400">
                                Stealth Co-Admin (Hidden from Public)
                              </span>
                            ) : (
                              <span className="text-slate-500">Standard User</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              {allowAssignCoAdmin && !isTargetSelf && (
                                <button
                                  type="button"
                                  onClick={() => onToggleStealthCoAdmin(u.uid)}
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                                    isTargetCoAdmin
                                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-blue-500/50 hover:text-white'
                                  }`}
                                >
                                  <EyeOff className="h-3.5 w-3.5" />
                                  <span>
                                    {isTargetCoAdmin ? 'Revoke Co-Admin' : 'Make Stealth Co-Admin'}
                                  </span>
                                </button>
                              )}

                              {canMuteThisUser && (
                                <button
                                  type="button"
                                  onClick={() => onToggleMuteUser(u.uid)}
                                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                                    u.isMuted
                                      ? 'border-amber-500/50 bg-amber-500/20 text-amber-200'
                                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                                  }`}
                                >
                                  {u.isMuted ? (
                                    <>
                                      <Volume2 className="h-3.5 w-3.5" />
                                      <span>Unmute ID</span>
                                    </>
                                  ) : (
                                    <>
                                      <VolumeX className="h-3.5 w-3.5" />
                                      <span>Mute ID</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {canBanThisUser && (
                                <button
                                  type="button"
                                  onClick={() => onToggleBanUser(u.uid)}
                                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                                    u.isBanned
                                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
                                      : 'border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25'
                                  }`}
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                  <span>{u.isBanned ? 'Unban ID' : 'Ban ID'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: REPORTED USERS QUEUE */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1">
                  {(['all', 'pending', 'resolved', 'dismissed'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setReportFilter(status)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors whitespace-nowrap shrink-0 ${
                        reportFilter === status
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400">
                  Both Owner Super Admin and Stealth Co-Admins can resolve reports & sanction IDs.
                </span>
              </div>

              {filteredReports.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                  <p className="mt-2 text-sm font-semibold text-white">
                    No reports matching "{reportFilter}"
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    All community abuse reports in this queue have been processed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map((rep) => {
                    const targetProfile = users.find((u) => u.uid === rep.targetUserId);
                    return (
                      <div
                        key={rep.id}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 lg:flex-row lg:items-center"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-red-400">
                              Reported Target: {rep.targetUsername}
                            </span>
                            <span className="font-mono text-slate-500">({rep.targetUserId})</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-400">
                              Reported by {rep.reporterName}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-amber-300">{rep.reason}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize text-slate-300">Status: {rep.status}</span>
                          </div>
                          <p className="text-xs text-slate-200">{rep.details}</p>
                          {rep.messageSnippet && (
                            <p className="font-mono text-[11px] text-slate-400">
                              Flagged message: "{rep.messageSnippet}"
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {rep.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateReportStatus(rep.id, 'resolved', 'ban')
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 whitespace-nowrap shrink-0"
                              >
                                <Ban className="h-3.5 w-3.5" />
                                <span>
                                  {targetProfile?.isBanned ? 'Resolve (Already Banned)' : 'Ban ID & Resolve'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateReportStatus(rep.id, 'resolved', 'mute')
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 whitespace-nowrap shrink-0"
                              >
                                <VolumeX className="h-3.5 w-3.5" />
                                <span>Mute ID & Resolve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateReportStatus(rep.id, 'dismissed')}
                                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 whitespace-nowrap shrink-0"
                              >
                                Dismiss Report
                              </button>
                            </>
                          ) : (
                            <span className="font-mono text-xs text-emerald-400">
                              Processed ({rep.status})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROOM GOVERNANCE */}
          {activeTab === 'rooms' && (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span>{room.name}</span>
                      <span className="text-xs font-normal text-slate-400">
                        · {room.category.toUpperCase()} · Host: {room.ownerName}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{room.topic}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleRoomLock(room.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        room.isLocked
                          ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                          : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {room.isLocked ? (
                        <>
                          <Unlock className="h-3.5 w-3.5" />
                          <span>Unlock Room</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          <span>Lock Room</span>
                        </>
                      )}
                    </button>

                    {room.id !== 'room_global_lounge' && (
                      <button
                        type="button"
                        onClick={() => onDeleteRoom(room.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/25 whitespace-nowrap shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Room</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: GOOGLE ADSENSE MONETIZATION */}
          {activeTab === 'adsense' && isSuperAdmin && (
            <form onSubmit={handleSaveAdConfig} className="max-w-2xl space-y-4">
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Google AdSense Monetization Engine</span>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Enter your official Google AdSense Publisher ID (<code>ca-pub-...</code>) and Ad
                  Unit Slot IDs to serve live AdSense ads in the Left Directory Sidebar and Chat
                  Header Banner.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div>
                  <span className="block text-xs font-semibold text-white">
                    Enable Google AdSense Placements
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Show AdSense units in the chat sidebar and lounge header
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={draftAdConfig.enabled}
                  onChange={(e) =>
                    setDraftAdConfig({ ...draftAdConfig, enabled: e.target.checked })
                  }
                  aria-label="Enable Google AdSense placements"
                  className="h-4 w-4 rounded border-slate-700 text-blue-600"
                />
              </div>

              <div>
                <label htmlFor="adsense-pub-id" className="block text-xs font-semibold text-slate-200">
                  Google AdSense Publisher ID
                </label>
                <input
                  id="adsense-pub-id"
                  type="text"
                  placeholder="ca-pub-1234567890123456"
                  value={draftAdConfig.publisherId}
                  onChange={(e) =>
                    setDraftAdConfig({ ...draftAdConfig, publisherId: e.target.value.trim() })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 font-mono text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="adsense-sidebar-slot"
                    className="block text-xs font-semibold text-slate-200"
                  >
                    Sidebar Ad Unit Slot ID
                  </label>
                  <input
                    id="adsense-sidebar-slot"
                    type="text"
                    placeholder="8841209901"
                    value={draftAdConfig.sidebarSlotId}
                    onChange={(e) =>
                      setDraftAdConfig({ ...draftAdConfig, sidebarSlotId: e.target.value.trim() })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 font-mono text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="adsense-banner-slot"
                    className="block text-xs font-semibold text-slate-200"
                  >
                    Chat Banner Ad Unit Slot ID
                  </label>
                  <input
                    id="adsense-banner-slot"
                    type="text"
                    placeholder="8841209902"
                    value={draftAdConfig.bannerSlotId}
                    onChange={(e) =>
                      setDraftAdConfig({ ...draftAdConfig, bannerSlotId: e.target.value.trim() })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 font-mono text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div>
                  <span className="block text-xs font-semibold text-white">
                    Display Sponsored Preview Card When AdSense Script Is Unfilled
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Keeps layout geometry consistent during staging/preview before domain approval
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={draftAdConfig.showTestPlaceholders}
                  onChange={(e) =>
                    setDraftAdConfig({
                      ...draftAdConfig,
                      showTestPlaceholders: e.target.checked,
                    })
                  }
                  aria-label="Show test ad placeholders"
                  className="h-4 w-4 rounded border-slate-700 text-blue-600"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  Save AdSense Configuration
                </button>
                {adSavedToast && (
                  <span className="text-xs font-medium text-emerald-400">
                    AdSense settings saved and applied!
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
