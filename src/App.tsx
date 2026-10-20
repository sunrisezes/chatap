import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  Camera,
  EyeOff,
  Film,
  Flag,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Lock,
  LogOut,
  MessageSquare,
  Mic,
  Plus,
  Search,
  Send,
  Shield,
  Shuffle,
  Smile,
  Sparkles,
  Square,
  Unlock,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './lib/firebase';
import {
  canAccessModerationConsole,
  canAssignStealthCoAdmin,
  canModerateTargetUser,
  canPostInRoom,
  filterBlockedMessages,
  getPublicProfileView,
  hashRoomPassword,
  isSuperAdminUser,
  SUPER_ADMIN_EMAIL,
  verifyRoomPassword,
  type AdSenseConfig,
  type ChatMessageModel,
  type ChatRoomModel,
  type GenderOption,
  type ReportStatus,
  type RoomCategory,
  type StealthCoAdminRecord,
  type UserProfile,
  type UserReportModel,
} from './utils/chatLogic';
import {
  INITIAL_SEED_COADMINS,
  INITIAL_SEED_MESSAGES,
  INITIAL_SEED_REPORTS,
  INITIAL_SEED_ROOMS,
  INITIAL_SEED_USERS,
  PRESET_AVATARS,
  SAMPLE_SHARED_IMAGE,
} from './utils/avatarAssets';
import { Prism3DBackdrop } from './components/Prism3DBackdrop';
import { AdSenseSlot } from './components/AdSenseSlot';
import { VoiceNotePlayer } from './components/VoiceNotePlayer';
import { AuthOnboardingModal, type OnboardingSubmitPayload } from './components/AuthOnboardingModal';
import {
  CreateRoomModal,
  InviteUsersModal,
  ReportUserModal,
  RoomPasswordModal,
} from './components/RoomModals';
import { AdminControlPanelModal } from './components/AdminControlPanelModal';

const EMOJI_PALETTE = [
  '😀', '😂', '😍', '🔥', '✨', '🎉', '🎧', '📸',
  '💬', '🙌', '❤️', '😎', '🚀', '🎸', '☕', '🌙',
  '🌈', '💎', '🤝', '⚡', '🥳', '🤩', '🫶', '👋',
];

const QUICK_REACTIONS = ['🔥', '❤️', '😂', '🎧'];

const STORAGE_KEYS = {
  CURRENT_USER: 'prismchat_current_user_v1',
  CURRENT_EMAIL: 'prismchat_current_email_v1',
  USERS: 'prismchat_users_v1',
  ROOMS: 'prismchat_rooms_v1',
  MESSAGES: 'prismchat_messages_v1',
  REPORTS: 'prismchat_reports_v1',
  COADMINS: 'prismchat_coadmins_v1',
  BLOCKED: 'prismchat_blocked_v1',
  ADSENSE: 'prismchat_adsense_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const isAutostart = urlParams.get('autostart') === '1';

  // Core Application State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = loadFromStorage<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (saved) return saved;
    if (isAutostart) {
      return {
        uid: 'user_autostart_guest',
        username: 'NovaExplorer',
        dob: '1999-05-14',
        age: 27,
        gender: 'Female',
        avatarUrl: PRESET_AVATARS[0].url,
        bio: 'Exploring 3D chat rooms, voice notes & random matches!',
        status: 'online',
        isGuest: true,
        isBanned: false,
        isMuted: false,
        visibility: 'public',
        country: 'United States',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() =>
    loadFromStorage<string | null>(STORAGE_KEYS.CURRENT_EMAIL, null)
  );

  const [users, setUsers] = useState<UserProfile[]>(() =>
    loadFromStorage<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_SEED_USERS)
  );
  const [rooms, setRooms] = useState<ChatRoomModel[]>(() =>
    loadFromStorage<ChatRoomModel[]>(STORAGE_KEYS.ROOMS, INITIAL_SEED_ROOMS)
  );
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessageModel[]>>(() =>
    loadFromStorage<Record<string, ChatMessageModel[]>>(
      STORAGE_KEYS.MESSAGES,
      INITIAL_SEED_MESSAGES
    )
  );
  const [reports, setReports] = useState<UserReportModel[]>(() =>
    loadFromStorage<UserReportModel[]>(STORAGE_KEYS.REPORTS, INITIAL_SEED_REPORTS)
  );
  const [coAdmins, setCoAdmins] = useState<Record<string, StealthCoAdminRecord>>(() =>
    loadFromStorage<Record<string, StealthCoAdminRecord>>(
      STORAGE_KEYS.COADMINS,
      INITIAL_SEED_COADMINS
    )
  );
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() =>
    loadFromStorage<string[]>(STORAGE_KEYS.BLOCKED, [])
  );
  const [adSenseConfig, setAdSenseConfig] = useState<AdSenseConfig>(() =>
    loadFromStorage<AdSenseConfig>(STORAGE_KEYS.ADSENSE, {
      enabled: true,
      publisherId: 'ca-pub-0000000000000000',
      sidebarSlotId: '8841209901',
      bannerSlotId: '8841209902',
      roomInterstitialSlotId: '8841209903',
      showTestPlaceholders: true,
    })
  );

  // Navigation & UI State
  const [activeRoomId, setActiveRoomId] = useState<string>('room_global_lounge');
  const [unlockedRoomIds, setUnlockedRoomIds] = useState<string[]>(['room_global_lounge']);
  const [roomFilterTab, setRoomFilterTab] = useState<'all' | 'public' | 'private' | 'direct'>('all');
  const [selectedDirectoryUserId, setSelectedDirectoryUserId] = useState<string>('user_elena_99');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryGenderFilter, setDirectoryGenderFilter] = useState<'All' | GenderOption>('All');
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'rooms' | 'directory'>('none');

  // Composer State
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Modals State
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [pendingPasswordRoom, setPendingPasswordRoom] = useState<ChatRoomModel | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [reportingUser, setReportingUser] = useState<UserProfile | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'users' | 'reports' | 'rooms' | 'adsense'>(
    'users'
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const recordingTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Persist state to localStorage and sync across tabs
  useEffect(() => {
    try {
      if (currentUser) {
        window.localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
      if (currentUserEmail) {
        window.localStorage.setItem(STORAGE_KEYS.CURRENT_EMAIL, JSON.stringify(currentUserEmail));
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.CURRENT_EMAIL);
      }
      window.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      window.localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
      window.localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messagesByRoom));
      window.localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      window.localStorage.setItem(STORAGE_KEYS.COADMINS, JSON.stringify(coAdmins));
      window.localStorage.setItem(STORAGE_KEYS.BLOCKED, JSON.stringify(blockedUserIds));
      window.localStorage.setItem(STORAGE_KEYS.ADSENSE, JSON.stringify(adSenseConfig));
    } catch {
      // Ignore storage quota issues
    }
  }, [
    currentUser,
    currentUserEmail,
    users,
    rooms,
    messagesByRoom,
    reports,
    coAdmins,
    blockedUserIds,
    adSenseConfig,
  ]);

  // Cross-tab BroadcastChannel real-time sync
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('prismchat_live_channel');
    broadcastRef.current = channel;

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'NEW_MESSAGE' && data.roomId && data.message) {
        setMessagesByRoom((prev) => {
          const existingList = prev[data.roomId] || [];
          if (existingList.some((m) => m.id === data.message.id)) return prev;
          return { ...prev, [data.roomId]: [...existingList, data.message] };
        });
      } else if (data.type === 'SYNC_USERS' && Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (data.type === 'SYNC_ROOMS' && Array.isArray(data.rooms)) {
        setRooms(data.rooms);
      }
    };

    return () => {
      channel.close();
      broadcastRef.current = null;
    };
  }, []);

  // Firestore Real-Time Listeners when authenticated with Firebase Auth
  useEffect(() => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) return;

    const usersQuery = query(collection(db, 'users'), where('visibility', '==', 'public'));
    const unsubUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        if (snapshot.empty) return;
        const remoteUsers: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          remoteUsers.push({
            uid: String(d.uid || docSnap.id),
            username: String(d.username || 'User'),
            dob: String(d.dob || '2000-01-01'),
            age: Number(d.age || 25),
            gender: (d.gender as GenderOption) || 'Prefer not to say',
            avatarUrl: String(d.avatarUrl || PRESET_AVATARS[0].url),
            bio: String(d.bio || ''),
            status: (d.status as UserProfile['status']) || 'online',
            isGuest: Boolean(d.isGuest),
            isBanned: Boolean(d.isBanned),
            isMuted: Boolean(d.isMuted),
            visibility: 'public',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
        setUsers((prev) => {
          const map = new Map(prev.map((u) => [u.uid, u]));
          remoteUsers.forEach((ru) => map.set(ru.uid, ru));
          return Array.from(map.values());
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    );

    const roomsQuery = query(collection(db, 'rooms'), where('isListed', '==', true));
    const unsubRooms = onSnapshot(
      roomsQuery,
      (snapshot) => {
        if (snapshot.empty) return;
        const remoteRooms: ChatRoomModel[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          remoteRooms.push({
            id: String(d.id || docSnap.id),
            name: String(d.name || 'Chat Room'),
            topic: String(d.topic || ''),
            category: (d.category as RoomCategory) || 'public',
            ownerId: String(d.ownerId || ''),
            ownerName: String(d.ownerName || 'Host'),
            isLocked: Boolean(d.isLocked),
            hasPassword: Boolean(d.hasPassword),
            passwordHash: String(d.passwordHash || ''),
            themeColor: String(d.themeColor || 'cobalt'),
            isListed: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
        setRooms((prev) => {
          const map = new Map(prev.map((r) => [r.id, r]));
          remoteRooms.forEach((rr) => map.set(rr.id, rr));
          return Array.from(map.values());
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'rooms');
      }
    );

    return () => {
      unsubUsers();
      unsubRooms();
    };
  }, [currentUser?.uid]);

  // Strict RBAC Clearance: ONLY sunrisezes@gmail.com or an assigned Stealth Co-Admin has moderation access.
  // Normal users see ZERO admin buttons, links, or text anywhere on the website.
  const effectiveEmail = currentUserEmail;
  const isEffectiveSuperAdmin = isSuperAdminUser(effectiveEmail, false);
  const effectiveCoAdminMap = coAdmins;

  const currentUserCoAdminRecord = currentUser
    ? effectiveCoAdminMap[currentUser.uid] || null
    : null;

  const hasModerationAccess = canAccessModerationConsole({
    email: effectiveEmail,
    isSuperAdminFlag: isEffectiveSuperAdmin,
    coAdminRecord: currentUserCoAdminRecord,
  });

  const canAssignCoAdmins = canAssignStealthCoAdmin({
    email: effectiveEmail,
    isSuperAdminFlag: isEffectiveSuperAdmin,
  });

  // Sync currentUser status from `users` list (so if banned or muted, it reflects immediately)
  const syncedCurrentUser = useMemo(() => {
    if (!currentUser) return null;
    const found = users.find((u) => u.uid === currentUser.uid);
    return found || currentUser;
  }, [currentUser, users]);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) || rooms[0],
    [rooms, activeRoomId]
  );

  const visibleMessages = useMemo(() => {
    const raw = messagesByRoom[activeRoom?.id || 'room_global_lounge'] || [];
    return filterBlockedMessages(raw, blockedUserIds);
  }, [messagesByRoom, activeRoom?.id, blockedUserIds]);

  const filteredRooms = useMemo(() => {
    if (roomFilterTab === 'all') return rooms;
    return rooms.filter((r) => r.category === roomFilterTab);
  }, [rooms, roomFilterTab]);

  const filteredDirectoryUsers = useMemo(() => {
    return users.filter((u) => {
      if (directoryGenderFilter !== 'All' && u.gender !== directoryGenderFilter) {
        return false;
      }
      const q = directorySearch.trim().toLowerCase();
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q)) ||
        (u.country && u.country.toLowerCase().includes(q))
      );
    });
  }, [users, directoryGenderFilter, directorySearch]);

  const inspectedUserRaw = useMemo(() => {
    return (
      users.find((u) => u.uid === selectedDirectoryUserId) ||
      users.find((u) => u.uid !== syncedCurrentUser?.uid) ||
      users[0]
    );
  }, [users, selectedDirectoryUserId, syncedCurrentUser?.uid]);

  // Ensure normal users only ever see the sanitized Public Profile view (zero co-admin leaks)
  const inspectedUser = useMemo(
    () => (inspectedUserRaw ? getPublicProfileView(inspectedUserRaw) : null),
    [inspectedUserRaw]
  );

  const showTransientBanner = (msg: string) => {
    setStatusBanner(msg);
    window.setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Onboarding / Authentication Handler
  const handleCompleteOnboarding = async (payload: OnboardingSubmitPayload) => {
    setIsAuthSubmitting(true);
    setAuthError(null);

    try {
      let uid = `user_${Date.now().toString(36)}`;
      let resolvedEmail: string | null = payload.email || null;
      let resolvedName = payload.username;

      if (payload.mode === 'google') {
        try {
          const cred = await signInWithPopup(auth, googleProvider);
          uid = cred.user.uid;
          resolvedEmail = cred.user.email;
          if (!resolvedName || resolvedName === 'PrismMember') {
            resolvedName = (cred.user.displayName || 'PrismMember').slice(0, 32);
          }
        } catch {
          uid = `google_${Date.now().toString(36)}`;
        }
      }

      // Check if an existing profile in the directory matches this username or email so Co-Admins can log in seamlessly
      const existingMatch = users.find(
        (u) => u.username.toLowerCase() === resolvedName.toLowerCase()
      );
      if (existingMatch) {
        uid = existingMatch.uid;
      }

      const nowIso = new Date().toISOString();
      const newProfile: UserProfile = {
        uid,
        username: resolvedName,
        dob: payload.dob,
        age: payload.age,
        gender: payload.gender,
        avatarUrl: payload.avatarUrl,
        bio: payload.bio || 'Ready to chat!',
        status: 'online',
        isGuest: payload.mode === 'guest',
        isBanned: existingMatch?.isBanned || false,
        isMuted: existingMatch?.isMuted || false,
        visibility: 'public',
        country: 'Global',
        createdAt: existingMatch?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      setCurrentUser(newProfile);
      setCurrentUserEmail(resolvedEmail);
      setUsers((prev) => {
        const filtered = prev.filter((u) => u.uid !== newProfile.uid);
        return [newProfile, ...filtered];
      });

      // If signed into Firebase with verified email, persist public profile & isolated PII
      if (auth.currentUser && auth.currentUser.uid === uid && auth.currentUser.emailVerified) {
        const userPath = `users/${uid}`;
        try {
          await setDoc(doc(db, 'users', uid), {
            uid: newProfile.uid,
            username: newProfile.username,
            dob: newProfile.dob,
            age: newProfile.age,
            gender: newProfile.gender,
            avatarUrl: newProfile.avatarUrl,
            bio: newProfile.bio,
            status: newProfile.status,
            isGuest: newProfile.isGuest,
            isBanned: false,
            isMuted: false,
            visibility: 'public',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          if (resolvedEmail) {
            await setDoc(doc(db, 'users', uid, 'private', 'info'), {
              uid: newProfile.uid,
              email: resolvedEmail,
              createdAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, userPath);
        }
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to complete sign-in.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch {
      // Ignore signout error
    }
    setCurrentUser(null);
    setCurrentUserEmail(null);
  };

  // Room Selection & Password Check
  const handleSelectRoom = (room: ChatRoomModel) => {
    if (
      room.hasPassword &&
      !unlockedRoomIds.includes(room.id) &&
      room.ownerId !== syncedCurrentUser?.uid &&
      !hasModerationAccess
    ) {
      setPendingPasswordRoom(room);
      return;
    }
    setActiveRoomId(room.id);
    setMobileDrawer('none');
  };

  const handleVerifyRoomPassword = (room: ChatRoomModel, candidatePassword: string): boolean => {
    const ok = verifyRoomPassword(room, candidatePassword, hasModerationAccess);
    if (ok) {
      setUnlockedRoomIds((prev) => (prev.includes(room.id) ? prev : [...prev, room.id]));
      setActiveRoomId(room.id);
      setPendingPasswordRoom(null);
      setMobileDrawer('none');
      showTransientBanner(`Unlocked private PVR room: ${room.name}`);
    }
    return ok;
  };

  // Create Custom Room
  const handleCreateRoom = async (payload: {
    name: string;
    topic: string;
    category: RoomCategory;
    password?: string;
    isLocked: boolean;
    themeColor: string;
  }) => {
    if (!syncedCurrentUser) return;
    const roomId = `room_${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();
    const hasPassword = payload.category === 'private' && Boolean(payload.password);
    const passwordHash = hasPassword && payload.password ? hashRoomPassword(payload.password) : '';

    const newRoom: ChatRoomModel = {
      id: roomId,
      name: payload.name,
      topic: payload.topic,
      category: payload.category,
      ownerId: syncedCurrentUser.uid,
      ownerName: syncedCurrentUser.username,
      isLocked: payload.isLocked,
      hasPassword,
      passwordHash,
      themeColor: payload.themeColor,
      isListed: true,
      onlineCount: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setRooms((prev) => [newRoom, ...prev]);
    setUnlockedRoomIds((prev) => [...prev, roomId]);
    setActiveRoomId(roomId);
    setMessagesByRoom((prev) => ({
      ...prev,
      [roomId]: [
        {
          id: `msg_welcome_${Date.now()}`,
          roomId,
          senderId: syncedCurrentUser.uid,
          senderName: syncedCurrentUser.username,
          senderAvatar: syncedCurrentUser.avatarUrl,
          senderGender: syncedCurrentUser.gender,
          senderAge: syncedCurrentUser.age,
          type: 'text',
          text: `Room "${newRoom.name}" created! ${
            hasPassword ? 'Protected by PVR passcode.' : 'Open to everyone.'
          }`,
          mediaUrl: '',
          voiceDuration: 0,
          createdAt: nowIso,
        },
      ],
    }));

    broadcastRef.current?.postMessage({ type: 'SYNC_ROOMS', rooms: [newRoom, ...rooms] });
    showTransientBanner(`Created room "${newRoom.name}"`);

    if (auth.currentUser && auth.currentUser.uid === syncedCurrentUser.uid && auth.currentUser.emailVerified) {
      try {
        await setDoc(doc(db, 'rooms', roomId), {
          id: newRoom.id,
          name: newRoom.name,
          topic: newRoom.topic,
          category: newRoom.category,
          ownerId: newRoom.ownerId,
          ownerName: newRoom.ownerName,
          isLocked: newRoom.isLocked,
          hasPassword: newRoom.hasPassword,
          passwordHash: newRoom.passwordHash,
          themeColor: newRoom.themeColor,
          isListed: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `rooms/${roomId}`);
      }
    }
  };

  // Lock / Unlock Room
  const handleToggleRoomLock = async (roomId: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom || !syncedCurrentUser) return;
    if (targetRoom.ownerId !== syncedCurrentUser.uid && !hasModerationAccess) {
      showTransientBanner('Only the room host can lock or unlock this room.');
      return;
    }

    const nextLocked = !targetRoom.isLocked;
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId ? { ...r, isLocked: nextLocked, updatedAt: new Date().toISOString() } : r
      )
    );
    showTransientBanner(
      `${targetRoom.name} is now ${nextLocked ? 'Locked' : 'Unlocked'}.`
    );

    if (auth.currentUser && auth.currentUser.emailVerified) {
      try {
        await updateDoc(doc(db, 'rooms', roomId), {
          isLocked: nextLocked,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
      }
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (roomId === 'room_global_lounge') return;
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    if (activeRoomId === roomId) {
      setActiveRoomId('room_global_lounge');
    }
    showTransientBanner('Room removed.');

    if (auth.currentUser && auth.currentUser.emailVerified) {
      try {
        await deleteDoc(doc(db, 'rooms', roomId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `rooms/${roomId}`);
      }
    }
  };

  // Send Message Helper (Text, Voice, Image, Video, Invite)
  const appendMessageToRoom = async (params: {
    roomId: string;
    type: ChatMessageModel['type'];
    text: string;
    mediaUrl?: string;
    voiceDuration?: number;
    inviteRoomId?: string;
    inviteRoomName?: string;
  }) => {
    if (!syncedCurrentUser) return;
    const targetRoom = rooms.find((r) => r.id === params.roomId) || activeRoom;
    const postCheck = canPostInRoom({
      room: targetRoom,
      user: syncedCurrentUser,
      isModerator: hasModerationAccess,
    });

    if (!postCheck.allowed) {
      showTransientBanner(postCheck.reason || 'Cannot post in this room.');
      return;
    }

    const msgId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newMsg: ChatMessageModel = {
      id: msgId,
      roomId: params.roomId,
      senderId: syncedCurrentUser.uid,
      senderName: syncedCurrentUser.username,
      senderAvatar: syncedCurrentUser.avatarUrl,
      senderGender: syncedCurrentUser.gender,
      senderAge: syncedCurrentUser.age,
      type: params.type,
      text: params.text.slice(0, 2000),
      mediaUrl: params.mediaUrl || '',
      voiceDuration: params.voiceDuration || 0,
      inviteRoomId: params.inviteRoomId,
      inviteRoomName: params.inviteRoomName,
      reactions: {},
      createdAt: nowIso,
    };

    setMessagesByRoom((prev) => ({
      ...prev,
      [params.roomId]: [...(prev[params.roomId] || []), newMsg],
    }));

    broadcastRef.current?.postMessage({
      type: 'NEW_MESSAGE',
      roomId: params.roomId,
      message: newMsg,
    });

    window.setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);

    if (auth.currentUser && auth.currentUser.uid === syncedCurrentUser.uid && auth.currentUser.emailVerified) {
      const msgPath = `rooms/${params.roomId}/messages/${msgId}`;
      try {
        await setDoc(doc(db, 'rooms', params.roomId, 'messages', msgId), {
          id: newMsg.id,
          roomId: newMsg.roomId,
          senderId: newMsg.senderId,
          senderName: newMsg.senderName,
          senderAvatar: newMsg.senderAvatar,
          type: newMsg.type,
          text: newMsg.text,
          mediaUrl: newMsg.mediaUrl,
          voiceDuration: newMsg.voiceDuration,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, msgPath);
      }
    }
  };

  const handleSendTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeRoom) return;
    const textToSend = messageText.trim();
    setMessageText('');
    setShowEmojiPicker(false);

    await appendMessageToRoom({
      roomId: activeRoom.id,
      type: 'text',
      text: textToSend,
    });
  };

  // Emoji & Reaction Handlers
  const handleInsertEmoji = (emoji: string) => {
    setMessageText((prev) => `${prev}${emoji}`);
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!syncedCurrentUser || !activeRoom) return;
    setMessagesByRoom((prev) => {
      const list = prev[activeRoom.id] || [];
      return {
        ...prev,
        [activeRoom.id]: list.map((m) => {
          if (m.id !== messageId) return m;
          const existingReactions = { ...(m.reactions || {}) };
          const currentUids = existingReactions[emoji] || [];
          const hasReacted = currentUids.includes(syncedCurrentUser.uid);
          existingReactions[emoji] = hasReacted
            ? currentUids.filter((id) => id !== syncedCurrentUser.uid)
            : [...currentUids, syncedCurrentUser.uid];
          return { ...m, reactions: existingReactions };
        }),
      };
    });
  };

  // Voice Note Recording
  const startVoiceRecording = async () => {
    if (isRecordingVoice) return;
    setIsRecordingVoice(true);
    setRecordingSeconds(1);
    recordedChunksRef.current = [];

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.start();
      } catch {
        // Fallback to synthesized voice note in headless/sandboxed environments
      }
    }

    recordingTimerRef.current = window.setInterval(() => {
      setRecordingSeconds((prev) => Math.min(120, prev + 1));
    }, 1000);
  };

  const stopAndSendVoiceRecording = async () => {
    if (!isRecordingVoice || !activeRoom) return;
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const finalDuration = Math.max(2, recordingSeconds);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);

    let audioDataUrl = '';
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } catch {
        // Ignore stop errors
      }
    }

    await appendMessageToRoom({
      roomId: activeRoom.id,
      type: 'voice',
      text: `Voice Note (${finalDuration}s)`,
      mediaUrl: audioDataUrl,
      voiceDuration: finalDuration,
    });
  };

  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } catch {
        // Ignore
      }
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  // Image & Video File Upload + Instant Studio Sample Sharing
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>, mediaKind: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;
    if (file.size > 450 * 1024) {
      showTransientBanner('File exceeds 450 KB limit. Sending optimized studio preview.');
      handleSendInstantMediaSample(mediaKind);
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        await appendMessageToRoom({
          roomId: activeRoom.id,
          type: mediaKind,
          text: `Shared ${mediaKind}: ${file.name}`,
          mediaUrl: reader.result,
        });
        setShowMediaMenu(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendInstantMediaSample = async (mediaKind: 'image' | 'video') => {
    if (!activeRoom) return;
    setShowMediaMenu(false);
    if (mediaKind === 'image') {
      await appendMessageToRoom({
        roomId: activeRoom.id,
        type: 'image',
        text: 'Shared a sunset snapshot from Acoustic Pavilion',
        mediaUrl: SAMPLE_SHARED_IMAGE,
      });
    } else {
      await appendMessageToRoom({
        roomId: activeRoom.id,
        type: 'video',
        text: 'Shared 3D Spatial Lounge Reel (HD Loop)',
        mediaUrl: SAMPLE_SHARED_IMAGE,
        voiceDuration: 12,
      });
    }
  };

  // Random 1-on-1 Match & Direct Chat
  const handleStartDirectChat = (targetUser: UserProfile, isRandomMatch = false) => {
    if (!syncedCurrentUser) return;
    const dmRoomId = `dm_${[syncedCurrentUser.uid, targetUser.uid].sort().join('_').slice(0, 64)}`;
    const existingDm = rooms.find((r) => r.id === dmRoomId);

    if (!existingDm) {
      const nowIso = new Date().toISOString();
      const dmRoom: ChatRoomModel = {
        id: dmRoomId,
        name: `${targetUser.username} (1-on-1)`,
        topic: `Direct conversation with ${targetUser.username} (${targetUser.age} · ${targetUser.gender})`,
        category: 'direct',
        ownerId: syncedCurrentUser.uid,
        ownerName: syncedCurrentUser.username,
        isLocked: false,
        hasPassword: false,
        passwordHash: '',
        themeColor: 'coral',
        isListed: true,
        participantIds: [syncedCurrentUser.uid, targetUser.uid],
        onlineCount: 2,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setRooms((prev) => [dmRoom, ...prev]);
      setMessagesByRoom((prev) => ({
        ...prev,
        [dmRoomId]: [
          {
            id: `msg_dm_intro_${Date.now()}`,
            roomId: dmRoomId,
            senderId: targetUser.uid,
            senderName: targetUser.username,
            senderAvatar: targetUser.avatarUrl,
            senderGender: targetUser.gender,
            senderAge: targetUser.age,
            type: 'text',
            text: isRandomMatch
              ? `Hey ${syncedCurrentUser.username}! We just matched on Random Chat 👋 How's your day going?`
              : `Hey ${syncedCurrentUser.username}! Great to connect 1-on-1.`,
            mediaUrl: '',
            voiceDuration: 0,
            createdAt: nowIso,
          },
        ],
      }));
    }

    setUnlockedRoomIds((prev) => (prev.includes(dmRoomId) ? prev : [...prev, dmRoomId]));
    setActiveRoomId(dmRoomId);
    setSelectedDirectoryUserId(targetUser.uid);
    setMobileDrawer('none');
    if (isRandomMatch) {
      showTransientBanner(`Matched randomly with ${targetUser.username} (${targetUser.age} · ${targetUser.gender})!`);
    }
  };

  const handleRandomMatch = () => {
    if (!syncedCurrentUser) return;
    const candidates = users.filter(
      (u) =>
        u.uid !== syncedCurrentUser.uid &&
        !u.isBanned &&
        !blockedUserIds.includes(u.uid)
    );
    if (candidates.length === 0) {
      showTransientBanner('No eligible online users available for random match right now.');
      return;
    }
    const randomPick = candidates[Math.floor(Math.random() * candidates.length)];
    handleStartDirectChat(randomPick, true);
  };

  // Invite User to Room
  const handleSendRoomInvite = async (targetUser: UserProfile, room: ChatRoomModel) => {
    if (!syncedCurrentUser) return;
    setUnlockedRoomIds((prev) => (prev.includes(room.id) ? prev : [...prev, room.id]));
    await appendMessageToRoom({
      roomId: activeRoom.id,
      type: 'invite',
      text: `Invited ${targetUser.username} to join "${room.name}"`,
      inviteRoomId: room.id,
      inviteRoomName: room.name,
    });
    showTransientBanner(`Invitation sent to ${targetUser.username} for ${room.name}!`);
  };

  // Personal Block / Unblock
  const handleToggleBlockUser = async (targetUid: string) => {
    if (!syncedCurrentUser || targetUid === syncedCurrentUser.uid) return;
    const isBlocked = blockedUserIds.includes(targetUid);
    const targetUser = users.find((u) => u.uid === targetUid);

    setBlockedUserIds((prev) =>
      isBlocked ? prev.filter((id) => id !== targetUid) : [...prev, targetUid]
    );

    showTransientBanner(
      isBlocked
        ? `Unblocked ${targetUser?.username || targetUid}.`
        : `Blocked ${targetUser?.username || targetUid}. Their messages are now hidden.`
    );

    if (auth.currentUser && auth.currentUser.uid === syncedCurrentUser.uid && auth.currentUser.emailVerified) {
      const blockPath = `users/${syncedCurrentUser.uid}/blocks/${targetUid}`;
      try {
        if (isBlocked) {
          await deleteDoc(doc(db, 'users', syncedCurrentUser.uid, 'blocks', targetUid));
        } else {
          await setDoc(doc(db, 'users', syncedCurrentUser.uid, 'blocks', targetUid), {
            blockerId: syncedCurrentUser.uid,
            blockedUserId: targetUid,
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, blockPath);
      }
    }
  };

  // Submit Abuse Report
  const handleSubmitReport = async (payload: {
    targetUser: UserProfile;
    reason: string;
    details: string;
    roomId: string;
  }) => {
    if (!syncedCurrentUser) return;
    const reportId = `rep_${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    const newReport: UserReportModel = {
      id: reportId,
      reporterId: syncedCurrentUser.uid,
      reporterName: syncedCurrentUser.username,
      targetUserId: payload.targetUser.uid,
      targetUsername: payload.targetUser.username,
      reason: payload.reason,
      details: payload.details,
      roomId: payload.roomId,
      status: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setReports((prev) => [newReport, ...prev]);
    showTransientBanner(`Report submitted against ${payload.targetUser.username}.`);

    if (auth.currentUser && auth.currentUser.uid === syncedCurrentUser.uid && auth.currentUser.emailVerified) {
      try {
        await setDoc(doc(db, 'reports', reportId), {
          id: newReport.id,
          reporterId: newReport.reporterId,
          reporterName: newReport.reporterName,
          targetUserId: newReport.targetUserId,
          targetUsername: newReport.targetUsername,
          reason: newReport.reason,
          details: newReport.details,
          roomId: newReport.roomId,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `reports/${reportId}`);
      }
    }
  };

  // Moderation Handlers (Only callable when logged in as sunrisezes@gmail.com or assigned Co-Admin)
  const handleToggleBanUser = async (targetUid: string) => {
    if (!syncedCurrentUser) return;
    const allowed = canModerateTargetUser({
      actorUid: syncedCurrentUser.uid,
      actorEmail: effectiveEmail,
      actorIsSuperAdmin: isEffectiveSuperAdmin,
      actorCoAdmin: currentUserCoAdminRecord,
      targetUid,
      action: 'ban',
    });
    if (!allowed) {
      showTransientBanner('Insufficient permissions to ban this user.');
      return;
    }

    const target = users.find((u) => u.uid === targetUid);
    if (!target) return;
    const nextBanned = !target.isBanned;

    setUsers((prev) =>
      prev.map((u) =>
        u.uid === targetUid
          ? {
              ...u,
              isBanned: nextBanned,
              status: nextBanned ? 'offline' : 'online',
              updatedAt: new Date().toISOString(),
            }
          : u
      )
    );
    showTransientBanner(
      `${target.username} (${target.uid}) has been ${nextBanned ? 'BANNED' : 'UNBANNED'}.`
    );

    if (auth.currentUser && auth.currentUser.emailVerified) {
      try {
        await updateDoc(doc(db, 'users', targetUid), {
          isBanned: nextBanned,
          status: nextBanned ? 'offline' : 'online',
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
      }
    }
  };

  const handleToggleMuteUser = async (targetUid: string) => {
    if (!syncedCurrentUser) return;
    const allowed = canModerateTargetUser({
      actorUid: syncedCurrentUser.uid,
      actorEmail: effectiveEmail,
      actorIsSuperAdmin: isEffectiveSuperAdmin,
      actorCoAdmin: currentUserCoAdminRecord,
      targetUid,
      action: 'mute',
    });
    if (!allowed) {
      showTransientBanner('Insufficient permissions to mute this user.');
      return;
    }

    const target = users.find((u) => u.uid === targetUid);
    if (!target) return;
    const nextMuted = !target.isMuted;

    setUsers((prev) =>
      prev.map((u) =>
        u.uid === targetUid
          ? { ...u, isMuted: nextMuted, updatedAt: new Date().toISOString() }
          : u
      )
    );
    showTransientBanner(
      `${target.username} (${target.uid}) has been ${nextMuted ? 'MUTED' : 'UNMUTED'}.`
    );

    if (auth.currentUser && auth.currentUser.emailVerified) {
      try {
        await updateDoc(doc(db, 'users', targetUid), {
          isMuted: nextMuted,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
      }
    }
  };

  const handleToggleStealthCoAdmin = async (targetUid: string) => {
    if (!canAssignCoAdmins || !syncedCurrentUser) {
      return;
    }
    const target = users.find((u) => u.uid === targetUid);
    const isCurrentlyCoAdmin = Boolean(coAdmins[targetUid]);

    if (isCurrentlyCoAdmin) {
      setCoAdmins((prev) => {
        const copy = { ...prev };
        delete copy[targetUid];
        return copy;
      });
      showTransientBanner(`Revoked Stealth Co-Admin powers from ${target?.username || targetUid}.`);
      if (auth.currentUser && auth.currentUser.emailVerified) {
        try {
          await deleteDoc(doc(db, 'coadmins', targetUid));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `coadmins/${targetUid}`);
        }
      }
    } else {
      const record: StealthCoAdminRecord = {
        uid: targetUid,
        assignedBy: syncedCurrentUser.uid,
        canBan: true,
        canMute: true,
        canResolveReports: true,
        createdAt: new Date().toISOString(),
      };
      setCoAdmins((prev) => ({ ...prev, [targetUid]: record }));
      showTransientBanner(
        `Assigned ${target?.username || targetUid} as a Stealth Co-Admin (Invisible on public profile).`
      );
      if (auth.currentUser && auth.currentUser.emailVerified) {
        try {
          await setDoc(doc(db, 'coadmins', targetUid), {
            uid: targetUid,
            assignedBy: syncedCurrentUser.uid,
            canBan: true,
            canMute: true,
            canResolveReports: true,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `coadmins/${targetUid}`);
        }
      }
    }
  };

  const handleUpdateReportStatus = async (
    reportId: string,
    status: ReportStatus,
    moderationAction?: 'ban' | 'mute'
  ) => {
    const rep = reports.find((r) => r.id === reportId);
    if (!rep) return;

    if (moderationAction === 'ban') {
      const target = users.find((u) => u.uid === rep.targetUserId);
      if (target && !target.isBanned) {
        await handleToggleBanUser(rep.targetUserId);
      }
    } else if (moderationAction === 'mute') {
      const target = users.find((u) => u.uid === rep.targetUserId);
      if (target && !target.isMuted) {
        await handleToggleMuteUser(rep.targetUserId);
      }
    }

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status, updatedAt: new Date().toISOString() } : r
      )
    );
    showTransientBanner(`Report ${reportId} marked as ${status}.`);

    if (auth.currentUser && auth.currentUser.emailVerified) {
      try {
        await updateDoc(doc(db, 'reports', reportId), {
          status,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
      }
    }
  };

  // 1. If not signed in yet, show the Full-Width Hero & Entry Portal
  if (!syncedCurrentUser) {
    return (
      <div className="relative min-h-screen w-full bg-[#090d16] text-slate-100">
        <Prism3DBackdrop accentTheme="cobalt" />
        <AuthOnboardingModal
          onComplete={handleCompleteOnboarding}
          isSubmitting={isAuthSubmitting}
          externalError={authError}
        />
      </div>
    );
  }

  // 2. If the current user has been Banned, enforce full lockout screen
  if (syncedCurrentUser.isBanned) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#090d16] p-6 text-slate-100">
        <Prism3DBackdrop accentTheme="rose" />
        <div className="relative z-10 max-w-md rounded-2xl border border-red-500/40 bg-slate-900/95 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400">
            <Ban className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-['Outfit'] text-2xl font-bold text-white">
            Account ID Suspended
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Your account ID (<code className="font-mono text-red-300">{syncedCurrentUser.uid}</code>)
            has been suspended for violating community safety rules.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#090d16] text-slate-100">
      <Prism3DBackdrop accentTheme={activeRoom?.themeColor || 'cobalt'} />

      {/* Top Bar Contract: Strictly 3 Zones separated by gap-8 */}
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-8 border-b border-slate-800/90 bg-slate-950/90 px-4 py-3.5 backdrop-blur-md sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setRoomFilterTab('all');
            setActiveRoomId('room_global_lounge');
          }}
          className="font-['Outfit'] text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          PrismChat 3D
        </a>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
        >
          <button
            type="button"
            onClick={() => {
              setRoomFilterTab('public');
              const pub = rooms.find((r) => r.category === 'public');
              if (pub) handleSelectRoom(pub);
            }}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Public Rooms
          </button>
          <button
            type="button"
            onClick={() => {
              setRoomFilterTab('private');
            }}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Private PVR
          </button>
          <button
            type="button"
            onClick={handleRandomMatch}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Random Match
          </button>
          <button
            type="button"
            onClick={() => setMobileDrawer((prev) => (prev === 'directory' ? 'none' : 'directory'))}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Online Users ({users.length})
          </button>
          {hasModerationAccess && (
            <button
              type="button"
              onClick={() => {
                setAdminInitialTab('users');
                setIsAdminModalOpen(true);
              }}
              className="text-blue-400 hover:text-blue-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Admin Panel ({pendingReportsCount})
            </button>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="text-slate-400 hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Sign Out
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateRoomOpen(true)}
            className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-orange-400 whitespace-nowrap shrink-0"
          >
            Create Room
          </button>
        </div>
      </header>

      {/* Mobile-Only Quick Navigation Strip (Hidden on Desktop for a cleaner workspace) */}
      <div className="relative z-20 flex shrink-0 items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/80 px-3 py-2 text-xs lg:hidden">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMobileDrawer((prev) => (prev === 'rooms' ? 'none' : 'rooms'))}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0"
          >
            Rooms ({rooms.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileDrawer((prev) => (prev === 'directory' ? 'none' : 'directory'))}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0"
          >
            Online ({users.length})
          </button>
          <button
            type="button"
            onClick={handleRandomMatch}
            className="rounded-lg border border-blue-500/40 bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-300 whitespace-nowrap shrink-0"
          >
            Random Chat
          </button>
          {hasModerationAccess && (
            <button
              type="button"
              onClick={() => {
                setAdminInitialTab('users');
                setIsAdminModalOpen(true);
              }}
              className="rounded-lg border border-blue-500/50 bg-blue-600/20 px-2.5 py-1 text-xs font-semibold text-blue-200 whitespace-nowrap shrink-0"
            >
              Admin ({pendingReportsCount})
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Leave lounge"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Leave</span>
        </button>
      </div>

      {/* Transient Status Notification Bar */}
      {statusBanner && (
        <div
          role="status"
          className="relative z-20 flex items-center justify-between border-b border-blue-500/30 bg-blue-600/20 px-6 py-2 text-xs font-medium text-blue-200"
        >
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            aria-label="Dismiss notification"
            className="text-blue-300 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main 3-Pane Spatial Chat Workspace */}
      <main className="relative z-10 flex w-full flex-1 overflow-hidden">
        {/* LEFT RAIL: Rooms Directory, Random Match CTA & AdSense Sidebar */}
        <aside
          aria-label="Chat Rooms and Random Match"
          className={`${
            mobileDrawer === 'rooms'
              ? 'fixed inset-y-0 left-0 z-40 flex w-80 bg-slate-950'
              : 'hidden lg:flex lg:w-80'
          } flex-col justify-between border-r border-slate-800/90 bg-slate-950/85 p-4 backdrop-blur-xl shrink-0`}
        >
          <div className="flex flex-1 flex-col overflow-hidden">
            {mobileDrawer === 'rooms' && (
              <div className="mb-3 flex items-center justify-between lg:hidden">
                <span className="font-['Outfit'] text-sm font-bold text-white">
                  Rooms & Lounges
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawer('none')}
                  aria-label="Close rooms drawer"
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Random 1-on-1 Match Button */}
            <button
              type="button"
              onClick={handleRandomMatch}
              className="flex w-full items-center justify-between rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-600/25 to-cyan-500/20 px-4 py-3 text-left transition-colors hover:border-blue-400"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Shuffle className="h-4 w-4 text-blue-400" />
                  <span>Instant Random 1-on-1 Chat</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-300">
                  Pair with an online stranger immediately
                </p>
              </div>
              <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
            </button>

            {/* Segmented Room Filter */}
            <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'public', label: 'Public' },
                  { id: 'private', label: 'PVR' },
                  { id: 'direct', label: '1-on-1' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoomFilterTab(tab.id)}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    roomFilterTab === tab.id
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Room List */}
            <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
              {filteredRooms.map((room) => {
                const isSelected = room.id === activeRoom?.id;
                const msgCount = (messagesByRoom[room.id] || []).length;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleSelectRoom(room)}
                    className={`flex w-full flex-col rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-blue-500/70 bg-blue-600/15 text-white'
                        : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-['Outfit'] text-sm font-semibold text-white">
                        {room.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {room.hasPassword && (
                          <KeyRound
                            className="h-3.5 w-3.5 text-amber-400"
                            aria-label="Password protected PVR room"
                          />
                        )}
                        {room.isLocked && (
                          <Lock
                            className="h-3.5 w-3.5 text-red-400"
                            aria-label="Room locked"
                          />
                        )}
                      </div>
                    </div>

                    <p className="mt-1 line-clamp-1 text-xs text-slate-400">{room.topic}</p>

                    <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-slate-400 tabular-nums">
                      <span className="capitalize">{room.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>Host: {room.ownerName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{msgCount} msgs</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Google AdSense Sidebar Unit */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <AdSenseSlot
              config={adSenseConfig}
              placement="sidebar"
              isModerator={isEffectiveSuperAdmin}
              onOpenAdConfig={() => {
                setAdminInitialTab('adsense');
                setIsAdminModalOpen(true);
              }}
            />
          </div>
        </aside>

        {/* CENTER STAGE: Active Chat Room Stream & Rich Media Composer */}
        <section
          aria-label="Live Chat Conversation"
          className="flex flex-1 flex-col overflow-hidden bg-slate-950/60 backdrop-blur-md"
        >
          {/* Room Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 bg-slate-900/80 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate font-['Outfit'] text-lg font-bold text-white">
                  {activeRoom?.name}
                </h1>
                <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                  · {activeRoom?.category.toUpperCase()}
                  {activeRoom?.hasPassword ? ' (PVR Passcode)' : ''}
                  {activeRoom?.isLocked ? ' · Locked' : ''}
                </span>
              </div>
              <p className="truncate text-xs text-slate-400">{activeRoom?.topic}</p>
            </div>

            {/* Room Actions: Invite Users & Lock/Unlock Room */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white whitespace-nowrap shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5 text-blue-400" />
                <span>Invite Users</span>
              </button>

              {(activeRoom?.ownerId === syncedCurrentUser.uid || hasModerationAccess) && (
                <button
                  type="button"
                  onClick={() => activeRoom && handleToggleRoomLock(activeRoom.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeRoom?.isLocked
                      ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                      : 'border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {activeRoom?.isLocked ? (
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
              )}
            </div>
          </div>

          {/* Optional Top AdSense Banner */}
          <div className="px-5 pt-3">
            <AdSenseSlot
              config={adSenseConfig}
              placement="banner"
              isModerator={isEffectiveSuperAdmin}
              onOpenAdConfig={() => {
                setAdminInitialTab('adsense');
                setIsAdminModalOpen(true);
              }}
            />
          </div>

          {/* Live Messages Stream */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {visibleMessages.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 text-center">
                <MessageSquare className="h-8 w-8 text-slate-500" />
                <p className="mt-2 text-sm font-semibold text-white">
                  No messages in {activeRoom?.name} yet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Break the ice with a text message, emoji, voice note, or studio snapshot!
                </p>
              </div>
            ) : (
              visibleMessages.map((msg) => {
                const isOwn = msg.senderId === syncedCurrentUser.uid;
                const senderProfile = users.find((u) => u.uid === msg.senderId);
                const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      isOwn ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (senderProfile) {
                          setSelectedDirectoryUserId(senderProfile.uid);
                        }
                      }}
                      aria-label={`Inspect ${msg.senderName}'s profile`}
                      className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 transition-transform hover:scale-105"
                    >
                      <img
                        src={msg.senderAvatar || PRESET_AVATARS[0].url}
                        alt={msg.senderName}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </button>

                    <div
                      className={`max-w-[78%] sm:max-w-[68%] rounded-2xl border p-3.5 ${
                        isOwn
                          ? 'border-blue-500/40 bg-blue-600/20 text-white'
                          : 'border-slate-800 bg-slate-900/90 text-slate-100'
                      }`}
                    >
                      {/* Message Metadata Header (Zero-Pill clean unboxed text with · separators) */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              senderProfile && setSelectedDirectoryUserId(senderProfile.uid)
                            }
                            className="font-semibold text-white hover:underline"
                          >
                            {msg.senderName}
                          </button>
                          {msg.senderAge && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{msg.senderAge}</span>
                            </>
                          )}
                          {msg.senderGender && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{msg.senderGender}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[11px] tabular-nums">
                            {formattedTime}
                          </span>
                        </div>

                        {/* Quick Block & Report actions on other users' messages */}
                        {!isOwn && senderProfile && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleToggleBlockUser(senderProfile.uid)}
                              aria-label={`Block ${senderProfile.username}`}
                              className="text-slate-400 hover:text-amber-300"
                            >
                              Block
                            </button>
                            <span aria-hidden="true">·</span>
                            <button
                              type="button"
                              onClick={() => setReportingUser(senderProfile)}
                              aria-label={`Report ${senderProfile.username}`}
                              className="text-slate-400 hover:text-red-400"
                            >
                              Report
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Message Body by Type */}
                      {msg.type === 'text' && (
                        <p className="mt-1.5 text-sm leading-relaxed break-words text-slate-100">
                          {msg.text}
                        </p>
                      )}

                      {msg.type === 'voice' && (
                        <VoiceNotePlayer
                          mediaUrl={msg.mediaUrl}
                          durationSeconds={msg.voiceDuration || 10}
                          label={msg.text}
                        />
                      )}

                      {msg.type === 'image' && (
                        <div className="mt-2 space-y-1.5">
                          {msg.text && <p className="text-xs text-slate-300">{msg.text}</p>}
                          <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950">
                            <img
                              src={msg.mediaUrl || SAMPLE_SHARED_IMAGE}
                              alt={msg.text || 'Shared chat image'}
                              referrerPolicy="no-referrer"
                              className="max-h-64 w-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {msg.type === 'video' && (
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-300">
                            <Film className="h-3.5 w-3.5" />
                            <span>{msg.text || 'Shared Video Clip'}</span>
                          </div>
                          {msg.mediaUrl && msg.mediaUrl.startsWith('data:video') ? (
                            <video
                              src={msg.mediaUrl}
                              controls
                              className="max-h-64 w-full rounded-xl border border-slate-700 bg-black"
                            />
                          ) : (
                            <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                              <img
                                src={msg.mediaUrl || SAMPLE_SHARED_IMAGE}
                                alt={msg.text || 'Video preview'}
                                referrerPolicy="no-referrer"
                                className="max-h-56 w-full object-cover opacity-85"
                              />
                              <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-xs text-white">
                                HD Spatial Video Clip · 0:12
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {msg.type === 'invite' && msg.inviteRoomId && (
                        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-blue-500/40 bg-slate-950/90 p-3">
                          <div>
                            <p className="text-xs font-semibold text-white">{msg.text}</p>
                            <p className="text-[11px] text-slate-400">
                              Direct Room Pass · Click to join immediately
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUnlockedRoomIds((prev) =>
                                prev.includes(msg.inviteRoomId!)
                                  ? prev
                                  : [...prev, msg.inviteRoomId!]
                              );
                              setActiveRoomId(msg.inviteRoomId!);
                            }}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 whitespace-nowrap shrink-0"
                          >
                            Join {msg.inviteRoomName || 'Room'}
                          </button>
                        </div>
                      )}

                      {/* Reactions Row */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-1">
                        {QUICK_REACTIONS.map((emoji) => {
                          const count = (msg.reactions?.[emoji] || []).length;
                          const reacted = (msg.reactions?.[emoji] || []).includes(
                            syncedCurrentUser.uid
                          );
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              aria-label={`React with ${emoji}`}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs transition-colors whitespace-nowrap shrink-0 ${
                                reacted
                                  ? 'border-blue-500/50 bg-blue-500/20 text-white'
                                  : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && (
                                <span className="font-mono text-[11px] tabular-nums">{count}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Rich Chat Composer (Emojis, Voice Note Recorder, Image/Video Upload & Text) */}
          <div className="relative border-t border-slate-800/90 bg-slate-900/95 p-3.5 sm:px-5">
            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <div
                className="mb-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-xl"
                role="region"
                aria-label="Emoji picker"
              >
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Insert Emoji</span>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
                  {EMOJI_PALETTE.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleInsertEmoji(emoji)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-lg transition-transform hover:scale-110 hover:bg-slate-800"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Media Attachment Popover (Picture & Video Upload / Instant Studio Sample) */}
            {showMediaMenu && (
              <div
                className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-xl"
                role="region"
                aria-label="Media attachment options"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 whitespace-nowrap shrink-0">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Upload Picture</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileAttachment(e, 'image')}
                      className="sr-only"
                    />
                  </label>

                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-400 whitespace-nowrap shrink-0">
                    <Film className="h-3.5 w-3.5" />
                    <span>Upload Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileAttachment(e, 'video')}
                      className="sr-only"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleSendInstantMediaSample('image')}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    Send Studio Photo Snap
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendInstantMediaSample('video')}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    Send 3D Video Clip
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMediaMenu(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            )}

            {/* Muted or Locked Warning vs Active Composer */}
            {syncedCurrentUser.isMuted ? (
              <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-xs font-medium text-amber-200">
                <span>
                  Your account ID ({syncedCurrentUser.uid}) is currently muted. You can read
                  messages in this room but cannot post right now.
                </span>
              </div>
            ) : activeRoom?.isLocked &&
              activeRoom.ownerId !== syncedCurrentUser.uid &&
              !hasModerationAccess ? (
              <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs font-medium text-slate-300">
                <span>
                  This room is currently locked by {activeRoom.ownerName}. Only the room host can
                  send messages.
                </span>
              </div>
            ) : isRecordingVoice ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-orange-500/50 bg-orange-500/15 px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Mic className="h-4 w-4 text-orange-400" />
                  <span className="text-xs font-semibold text-white">
                    Recording Voice Note...
                  </span>
                  <span className="font-mono text-xs font-bold text-orange-300 tabular-nums">
                    0:{recordingSeconds < 10 ? '0' : ''}
                    {recordingSeconds}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={stopAndSendVoiceRecording}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-orange-400 whitespace-nowrap shrink-0"
                  >
                    <Square className="h-3 w-3" />
                    <span>Send Voice Note</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendTextSubmit} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPicker((prev) => !prev);
                    setShowMediaMenu(false);
                  }}
                  aria-label="Toggle emoji picker"
                  className={`flex h-10 w-9 sm:w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                    showEmojiPicker
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Smile className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMediaMenu((prev) => !prev);
                    setShowEmojiPicker(false);
                  }}
                  aria-label="Send picture or video"
                  className={`flex h-10 w-9 sm:w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                    showMediaMenu
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={startVoiceRecording}
                  aria-label="Record voice note"
                  className="flex h-10 w-9 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-300 transition-colors hover:border-orange-500/50 hover:text-orange-400"
                >
                  <Mic className="h-4 w-4" />
                </button>

                <input
                  type="text"
                  maxLength={2000}
                  placeholder={`Message ${activeRoom?.name || 'room'}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  aria-label="Chat message input"
                  className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 sm:px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />

                <button
                  type="submit"
                  aria-label="Send message"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-3 sm:px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-500 whitespace-nowrap shrink-0"
                >
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        </section>

        {/* RIGHT RAIL: Active Users Directory, Profile Inspector, Block & Report Controls */}
        <aside
          aria-label="Online Users and Profile Inspector"
          className={`${
            mobileDrawer === 'directory'
              ? 'fixed inset-y-0 right-0 z-40 flex w-85 bg-slate-950'
              : 'hidden xl:flex xl:w-85'
          } min-h-0 flex-col justify-between border-l border-slate-800/90 bg-slate-950/85 p-4 backdrop-blur-xl shrink-0`}
        >
          {/* Selected User Profile Inspector Card */}
          {inspectedUser && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={inspectedUser.avatarUrl}
                    alt={inspectedUser.username}
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 rounded-2xl border border-slate-700 object-cover"
                  />
                  <div>
                    <h2 className="font-['Outfit'] text-base font-bold text-white">
                      {inspectedUser.username}
                    </h2>
                    {/* Clean unboxed metadata with · separators (Zero visible admin badge on profile!) */}
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400 tabular-nums">
                      <span>{inspectedUser.age} yrs</span>
                      <span aria-hidden="true">·</span>
                      <span>{inspectedUser.gender}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{inspectedUser.status}</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                      ID: {inspectedUser.uid}
                    </div>
                  </div>
                </div>

                {mobileDrawer === 'directory' && (
                  <button
                    type="button"
                    onClick={() => setMobileDrawer('none')}
                    aria-label="Close directory drawer"
                    className="rounded-lg p-1 text-slate-400 hover:text-white xl:hidden"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                {inspectedUser.bio || 'Hanging out in PrismChat 3D.'}
              </p>

              {/* Standard User Actions on Inspected Profile: Direct Chat, Block, Report */}
              {inspectedUser.uid !== syncedCurrentUser.uid && (
                <div className="mt-3.5 space-y-2 border-t border-slate-800 pt-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartDirectChat(inspectedUser)}
                      className="rounded-xl bg-blue-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 whitespace-nowrap shrink-0"
                    >
                      1-on-1 Chat
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleBlockUser(inspectedUser.uid)}
                      className={`rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        blockedUserIds.includes(inspectedUser.uid)
                          ? 'border-amber-500/50 bg-amber-500/20 text-amber-200'
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {blockedUserIds.includes(inspectedUser.uid) ? 'Unblock User' : 'Block User'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportingUser(inspectedUser)}
                      className="rounded-xl border border-red-500/40 bg-red-500/15 px-2.5 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/25 whitespace-nowrap shrink-0"
                    >
                      Report ID
                    </button>
                  </div>

                  {/* Moderator-Only Inline Controls (Completely hidden from regular users!) */}
                  {hasModerationAccess && (
                    <div className="rounded-xl border border-blue-500/30 bg-slate-950/90 p-2.5">
                      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-blue-400">
                        <span>Moderator Quick Controls</span>
                        {effectiveCoAdminMap[inspectedUser.uid] && (
                          <span className="text-emerald-400">Stealth Co-Admin</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleBanUser(inspectedUser.uid)}
                          className="rounded-lg bg-red-600/20 border border-red-500/40 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-600/30 whitespace-nowrap shrink-0"
                        >
                          {inspectedUser.isBanned ? 'Unban ID' : 'Ban ID'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleMuteUser(inspectedUser.uid)}
                          className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/30 whitespace-nowrap shrink-0"
                        >
                          {inspectedUser.isMuted ? 'Unmute ID' : 'Mute ID'}
                        </button>
                        {canAssignCoAdmins && (
                          <button
                            type="button"
                            onClick={() => handleToggleStealthCoAdmin(inspectedUser.uid)}
                            className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 whitespace-nowrap shrink-0"
                          >
                            {effectiveCoAdminMap[inspectedUser.uid]
                              ? 'Revoke Co-Admin'
                              : 'Make Co-Admin'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Active Users Directory List */}
          <div className="mt-4 flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-['Outfit'] text-sm font-bold text-white">
                Active Users ({filteredDirectoryUsers.length})
              </span>
              <span className="text-[11px] text-slate-400">Click to inspect</span>
            </div>

            <div className="relative mt-2.5">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                aria-label="Search online users"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pr-3 pl-9 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Gender Filter Bar */}
            <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-1">
              {(['All', 'Female', 'Male', 'Non-Binary'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setDirectoryGenderFilter(g as 'All' | GenderOption)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                    directoryGenderFilter === g
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="mt-2.5 flex-1 space-y-1.5 overflow-y-auto pr-1">
              {filteredDirectoryUsers.map((u) => {
                const isSelected = u.uid === inspectedUser?.uid;
                const isBlocked = blockedUserIds.includes(u.uid);
                return (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => setSelectedDirectoryUserId(u.uid)}
                    className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'border-blue-500/60 bg-blue-600/15'
                        : 'border-slate-800/70 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={u.avatarUrl}
                        alt={u.username}
                        referrerPolicy="no-referrer"
                        className="h-9 w-9 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">
                          {u.username} {u.uid === syncedCurrentUser.uid && '(You)'}
                        </p>
                        {/* Notice: Public directory row NEVER exposes Stealth Co-Admin status */}
                        <p className="truncate font-mono text-[11px] text-slate-400 tabular-nums">
                          {u.age} · {u.gender}
                          {isBlocked ? ' · Blocked' : ''}
                          {u.isBanned ? ' · Banned' : ''}
                          {u.isMuted ? ' · Muted' : ''}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-medium text-slate-400 capitalize whitespace-nowrap shrink-0">
                      {u.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      <RoomPasswordModal
        room={pendingPasswordRoom}
        onClose={() => setPendingPasswordRoom(null)}
        onSubmitPassword={handleVerifyRoomPassword}
      />

      {activeRoom && (
        <InviteUsersModal
          isOpen={isInviteModalOpen}
          room={activeRoom}
          onlineUsers={users}
          currentUserId={syncedCurrentUser.uid}
          onClose={() => setIsInviteModalOpen(false)}
          onSendInvite={handleSendRoomInvite}
        />
      )}

      <ReportUserModal
        targetUser={reportingUser}
        roomId={activeRoom?.id || 'room_global_lounge'}
        onClose={() => setReportingUser(null)}
        onSubmitReport={handleSubmitReport}
      />

      {hasModerationAccess && (
        <AdminControlPanelModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          currentUser={syncedCurrentUser}
          currentUserEmail={effectiveEmail}
          isSuperAdmin={isEffectiveSuperAdmin}
          coAdmins={effectiveCoAdminMap}
          users={users}
          reports={reports}
          rooms={rooms}
          adSenseConfig={adSenseConfig}
          onToggleBanUser={handleToggleBanUser}
          onToggleMuteUser={handleToggleMuteUser}
          onToggleStealthCoAdmin={handleToggleStealthCoAdmin}
          onUpdateReportStatus={handleUpdateReportStatus}
          onToggleRoomLock={handleToggleRoomLock}
          onDeleteRoom={handleDeleteRoom}
          onUpdateAdSenseConfig={setAdSenseConfig}
          initialTab={adminInitialTab}
        />
      )}
    </div>
  );
}
