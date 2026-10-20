import type { ChatMessageModel, ChatRoomModel, StealthCoAdminRecord, UserProfile, UserReportModel } from './chatLogic';

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export interface PresetAvatar {
  id: string;
  label: string;
  url: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'prism-coral',
    label: 'Solar Prism',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF5E62"/>
            <stop offset="100%" stop-color="#FF9966"/>
          </linearGradient>
          <radialGradient id="sp1" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#FFF5EB"/>
            <stop offset="55%" stop-color="#FF7A59"/>
            <stop offset="100%" stop-color="#B82543"/>
          </radialGradient>
        </defs>
        <rect width="160" height="160" rx="36" fill="url(#bg1)"/>
        <circle cx="80" cy="64" r="32" fill="url(#sp1)"/>
        <path d="M34 142c6-26 24-40 46-40s40 14 46 40" fill="url(#sp1)" opacity="0.92"/>
        <circle cx="68" cy="54" r="6" fill="#FFFFFF" opacity="0.65"/>
      </svg>
    `),
  },
  {
    id: 'prism-cobalt',
    label: 'Cobalt Sphere',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563EB"/>
            <stop offset="100%" stop-color="#06B6D4"/>
          </linearGradient>
          <radialGradient id="sp2" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#E0F2FE"/>
            <stop offset="55%" stop-color="#38BDF8"/>
            <stop offset="100%" stop-color="#1E3A8A"/>
          </radialGradient>
        </defs>
        <rect width="160" height="160" rx="36" fill="url(#bg2)"/>
        <circle cx="80" cy="64" r="32" fill="url(#sp2)"/>
        <path d="M34 142c6-26 24-40 46-40s40 14 46 40" fill="url(#sp2)" opacity="0.92"/>
        <circle cx="68" cy="54" r="6" fill="#FFFFFF" opacity="0.65"/>
      </svg>
    `),
  },
  {
    id: 'prism-emerald',
    label: 'Jade Tactile',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#059669"/>
            <stop offset="100%" stop-color="#34D399"/>
          </linearGradient>
          <radialGradient id="sp3" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#ECFDF5"/>
            <stop offset="55%" stop-color="#10B981"/>
            <stop offset="100%" stop-color="#064E3B"/>
          </radialGradient>
        </defs>
        <rect width="160" height="160" rx="36" fill="url(#bg3)"/>
        <circle cx="80" cy="64" r="32" fill="url(#sp3)"/>
        <path d="M34 142c6-26 24-40 46-40s40 14 46 40" fill="url(#sp3)" opacity="0.92"/>
        <circle cx="68" cy="54" r="6" fill="#FFFFFF" opacity="0.65"/>
      </svg>
    `),
  },
  {
    id: 'prism-amber',
    label: 'Amber Horizon',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#D97706"/>
            <stop offset="100%" stop-color="#FBBF24"/>
          </linearGradient>
          <radialGradient id="sp4" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#FFFBEB"/>
            <stop offset="55%" stop-color="#F59E0B"/>
            <stop offset="100%" stop-color="#78350F"/>
          </radialGradient>
        </defs>
        <rect width="160" height="160" rx="36" fill="url(#bg4)"/>
        <circle cx="80" cy="64" r="32" fill="url(#sp4)"/>
        <path d="M34 142c6-26 24-40 46-40s40 14 46 40" fill="url(#sp4)" opacity="0.92"/>
        <circle cx="68" cy="54" r="6" fill="#FFFFFF" opacity="0.65"/>
      </svg>
    `),
  },
  {
    id: 'prism-rose',
    label: 'Rose Quartz',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="bg5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E11D48"/>
            <stop offset="100%" stop-color="#FB7185"/>
          </linearGradient>
          <radialGradient id="sp5" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#FFF1F2"/>
            <stop offset="55%" stop-color="#F43F5E"/>
            <stop offset="100%" stop-color="#881337"/>
          </radialGradient>
        </defs>
        <rect width="160" height="160" rx="36" fill="url(#bg5)"/>
        <circle cx="80" cy="64" r="32" fill="url(#sp5)"/>
        <path d="M34 142c6-26 24-40 46-40s40 14 46 40" fill="url(#sp5)" opacity="0.92"/>
        <circle cx="68" cy="54" r="6" fill="#FFFFFF" opacity="0.65"/>
      </svg>
    `),
  },
  {
    id: 'prism-indigo',
    label: 'Obsidian Aero',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="bg6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0F172A"/>
            <stop offset="100%" stop-color="#3B82F6"/>
          </linearGradient>
          <radialGradient id="sp6" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#EFF6FF"/>
            <stop offset="55%" stop-color="#60A5FA"/>
            <stop offset="100%" stop-color="#1E293B"/>
          </radialGradient>
        </defs>
        <rect width="160" height="160" rx="36" fill="url(#bg6)"/>
        <circle cx="80" cy="64" r="32" fill="url(#sp6)"/>
        <path d="M34 142c6-26 24-40 46-40s40 14 46 40" fill="url(#sp6)" opacity="0.92"/>
        <circle cx="68" cy="54" r="6" fill="#FFFFFF" opacity="0.65"/>
      </svg>
    `),
  },
];

export const SAMPLE_SHARED_IMAGE = svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F172A"/>
        <stop offset="50%" stop-color="#1E3A8A"/>
        <stop offset="100%" stop-color="#F97316"/>
      </linearGradient>
      <radialGradient id="orb" cx="50%" cy="45%" r="40%">
        <stop offset="0%" stop-color="#FDE68A"/>
        <stop offset="60%" stop-color="#FB923C"/>
        <stop offset="100%" stop-color="#EA580C" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="450" rx="24" fill="url(#sky)"/>
    <circle cx="400" cy="210" r="140" fill="url(#orb)"/>
    <path d="M0 340 Q200 280 400 330 T800 310 L800 450 L0 450 Z" fill="#0F172A" opacity="0.85"/>
    <path d="M0 375 Q260 330 520 370 T800 355 L800 450 L0 450 Z" fill="#020617" opacity="0.95"/>
    <text x="40" y="410" fill="#F8FAFC" font-family="sans-serif" font-size="20" font-weight="600">Sunset over Acoustic Pavilion · Shared in Lounge</text>
  </svg>
`);

export const INITIAL_SEED_USERS: UserProfile[] = [
  {
    uid: 'user_elena_99',
    username: 'ElenaVance',
    dob: '1999-04-18',
    age: 27,
    gender: 'Female',
    avatarUrl: PRESET_AVATARS[0].url,
    bio: 'Architectural lighting designer in Milan. Love music, travel & photography.',
    status: 'online',
    isGuest: false,
    isBanned: false,
    isMuted: false,
    visibility: 'public',
    country: 'Italy',
    createdAt: '2026-10-20T09:00:00Z',
    updatedAt: '2026-10-20T10:40:00Z',
  },
  {
    uid: 'user_marcus_96',
    username: 'MarcusK',
    dob: '1996-11-03',
    age: 29,
    gender: 'Male',
    avatarUrl: PRESET_AVATARS[1].url,
    bio: 'Sound engineer & synth collector. Always down for random trivia or coffee talk.',
    status: 'online',
    isGuest: false,
    isBanned: false,
    isMuted: false,
    visibility: 'public',
    country: 'Canada',
    createdAt: '2026-10-20T09:10:00Z',
    updatedAt: '2026-10-20T10:45:00Z',
  },
  {
    uid: 'user_sora_01',
    username: 'SoraTakahashi',
    dob: '2001-07-22',
    age: 25,
    gender: 'Female',
    avatarUrl: PRESET_AVATARS[2].url,
    bio: '3D motion artist in Tokyo. Exploring new creative lounges!',
    status: 'online',
    isGuest: true,
    isBanned: false,
    isMuted: false,
    visibility: 'public',
    country: 'Japan',
    createdAt: '2026-10-20T09:20:00Z',
    updatedAt: '2026-10-20T10:46:00Z',
  },
  {
    uid: 'user_liam_98',
    username: 'Liam_Guest',
    dob: '1998-02-14',
    age: 28,
    gender: 'Male',
    avatarUrl: PRESET_AVATARS[3].url,
    bio: 'Here for late night random chats and chill playlists.',
    status: 'away',
    isGuest: true,
    isBanned: false,
    isMuted: false,
    visibility: 'public',
    country: 'United Kingdom',
    createdAt: '2026-10-20T09:30:00Z',
    updatedAt: '2026-10-20T10:42:00Z',
  },
  {
    uid: 'user_zara_00',
    username: 'ZaraNoor',
    dob: '2000-09-09',
    age: 26,
    gender: 'Female',
    avatarUrl: PRESET_AVATARS[4].url,
    bio: 'Bookworm, indie cinema fan & espresso enthusiast.',
    status: 'online',
    isGuest: false,
    isBanned: false,
    isMuted: false,
    visibility: 'public',
    country: 'United States',
    createdAt: '2026-10-20T09:35:00Z',
    updatedAt: '2026-10-20T10:47:00Z',
  },
  {
    uid: 'user_troll_77',
    username: 'CryptoSpammer77',
    dob: '1994-06-12',
    age: 32,
    gender: 'Male',
    avatarUrl: PRESET_AVATARS[5].url,
    bio: 'DM me for 100x token drops right now!',
    status: 'online',
    isGuest: true,
    isBanned: false,
    isMuted: false,
    visibility: 'public',
    country: 'Germany',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:48:00Z',
  },
];

export const INITIAL_SEED_COADMINS: Record<string, StealthCoAdminRecord> = {
  user_elena_99: {
    uid: 'user_elena_99',
    assignedBy: 'sunrisezes@gmail.com',
    canBan: true,
    canMute: true,
    canResolveReports: true,
    createdAt: '2026-10-20T09:05:00Z',
  },
};

export const INITIAL_SEED_ROOMS: ChatRoomModel[] = [
  {
    id: 'room_global_lounge',
    name: 'Global Plaza 3D',
    topic: 'Open international hangout — meet randoms, share voice notes, photos & good vibes.',
    category: 'public',
    ownerId: 'user_elena_99',
    ownerName: 'ElenaVance',
    isLocked: false,
    hasPassword: false,
    passwordHash: '',
    themeColor: 'cobalt',
    isListed: true,
    onlineCount: 42,
    createdAt: '2026-10-20T08:00:00Z',
    updatedAt: '2026-10-20T10:45:00Z',
  },
  {
    id: 'room_music_voice',
    name: 'Voice & Music Studio',
    topic: 'Drop voice notes, freestyles, acoustic clips, and rate each other’s playlists!',
    category: 'public',
    ownerId: 'user_marcus_96',
    ownerName: 'MarcusK',
    isLocked: false,
    hasPassword: false,
    passwordHash: '',
    themeColor: 'coral',
    isListed: true,
    onlineCount: 28,
    createdAt: '2026-10-20T08:15:00Z',
    updatedAt: '2026-10-20T10:40:00Z',
  },
  {
    id: 'room_photography_club',
    name: 'Visual & Cinema Club',
    topic: 'Share travel snaps, short video clips, and weekend stories.',
    category: 'public',
    ownerId: 'user_sora_01',
    ownerName: 'SoraTakahashi',
    isLocked: false,
    hasPassword: false,
    passwordHash: '',
    themeColor: 'emerald',
    isListed: true,
    onlineCount: 19,
    createdAt: '2026-10-20T08:30:00Z',
    updatedAt: '2026-10-20T10:42:00Z',
  },
  {
    id: 'room_vip_pvr',
    name: 'Midnight Velvet PVR',
    topic: 'Password-protected private room (Demo passcode: 2026). Invite-only or passcode entry.',
    category: 'private',
    ownerId: 'user_zara_00',
    ownerName: 'ZaraNoor',
    isLocked: false,
    hasPassword: true,
    passwordHash: 'pvr_14231b1d', // hashRoomPassword('2026')
    themeColor: 'amber',
    isListed: true,
    onlineCount: 9,
    createdAt: '2026-10-20T09:00:00Z',
    updatedAt: '2026-10-20T10:44:00Z',
  },
];

export const INITIAL_SEED_MESSAGES: Record<string, ChatMessageModel[]> = {
  room_global_lounge: [
    {
      id: 'msg_seed_1',
      roomId: 'room_global_lounge',
      senderId: 'user_elena_99',
      senderName: 'ElenaVance',
      senderAvatar: PRESET_AVATARS[0].url,
      senderGender: 'Female',
      senderAge: 27,
      type: 'text',
      text: 'Welcome to Global Plaza! Feel free to jump into a random 1-on-1 match or share a voice note 👋✨',
      mediaUrl: '',
      voiceDuration: 0,
      reactions: { '🔥': ['user_marcus_96', 'user_sora_01'], '👋': ['user_zara_00'] },
      createdAt: '2026-10-20T10:41:00Z',
    },
    {
      id: 'msg_seed_2',
      roomId: 'room_global_lounge',
      senderId: 'user_marcus_96',
      senderName: 'MarcusK',
      senderAvatar: PRESET_AVATARS[1].url,
      senderGender: 'Male',
      senderAge: 29,
      type: 'voice',
      text: 'Voice Note · Studio synth check from Toronto',
      mediaUrl: '',
      voiceDuration: 14,
      reactions: { '🎧': ['user_elena_99'] },
      createdAt: '2026-10-20T10:43:00Z',
    },
    {
      id: 'msg_seed_3',
      roomId: 'room_global_lounge',
      senderId: 'user_sora_01',
      senderName: 'SoraTakahashi',
      senderAvatar: PRESET_AVATARS[2].url,
      senderGender: 'Female',
      senderAge: 25,
      type: 'image',
      text: 'Just rendered this lighting study for our lounge concept!',
      mediaUrl: SAMPLE_SHARED_IMAGE,
      voiceDuration: 0,
      reactions: { '❤️': ['user_elena_99', 'user_marcus_96', 'user_zara_00'] },
      createdAt: '2026-10-20T10:45:00Z',
    },
  ],
  room_music_voice: [
    {
      id: 'msg_music_1',
      roomId: 'room_music_voice',
      senderId: 'user_marcus_96',
      senderName: 'MarcusK',
      senderAvatar: PRESET_AVATARS[1].url,
      senderGender: 'Male',
      senderAge: 29,
      type: 'text',
      text: 'Drop your favorite late-night track or record a quick voice intro!',
      mediaUrl: '',
      voiceDuration: 0,
      createdAt: '2026-10-20T10:30:00Z',
    },
  ],
  room_photography_club: [
    {
      id: 'msg_photo_1',
      roomId: 'room_photography_club',
      senderId: 'user_sora_01',
      senderName: 'SoraTakahashi',
      senderAvatar: PRESET_AVATARS[2].url,
      senderGender: 'Female',
      senderAge: 25,
      type: 'image',
      text: 'Evening reflections from Shibuya sky deck.',
      mediaUrl: SAMPLE_SHARED_IMAGE,
      voiceDuration: 0,
      createdAt: '2026-10-20T10:35:00Z',
    },
  ],
  room_vip_pvr: [
    {
      id: 'msg_vip_1',
      roomId: 'room_vip_pvr',
      senderId: 'user_zara_00',
      senderName: 'ZaraNoor',
      senderAvatar: PRESET_AVATARS[4].url,
      senderGender: 'Female',
      senderAge: 26,
      type: 'text',
      text: 'Welcome inside Midnight Velvet PVR! You unlocked the private room.',
      mediaUrl: '',
      voiceDuration: 0,
      createdAt: '2026-10-20T10:38:00Z',
    },
  ],
};

export const INITIAL_SEED_REPORTS: UserReportModel[] = [
  {
    id: 'report_seed_1',
    reporterId: 'user_zara_00',
    reporterName: 'ZaraNoor',
    targetUserId: 'user_troll_77',
    targetUsername: 'CryptoSpammer77',
    reason: 'Spam / Unsolicited Links',
    details: 'Repeatedly spamming token promotion messages in Global Plaza and DMs.',
    roomId: 'room_global_lounge',
    messageSnippet: 'DM me for 100x token drops right now!',
    status: 'pending',
    createdAt: '2026-10-20T10:46:00Z',
    updatedAt: '2026-10-20T10:46:00Z',
  },
];
