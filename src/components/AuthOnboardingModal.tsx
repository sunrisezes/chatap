import React, { useState } from 'react';
import { Camera, Compass, Flame, Globe, Mail, MessageCircle, Mic, Sparkles, UserCheck } from 'lucide-react';
import {
  calculateAgeFromDob,
  validateProfileInput,
  type GenderOption,
} from '../utils/chatLogic';
import { PRESET_AVATARS } from '../utils/avatarAssets';

export interface OnboardingSubmitPayload {
  mode: 'guest' | 'email' | 'google';
  username: string;
  dob: string;
  age: number;
  gender: GenderOption;
  avatarUrl: string;
  bio: string;
  email?: string;
  password?: string;
}

interface AuthOnboardingModalProps {
  onComplete: (payload: OnboardingSubmitPayload) => Promise<void>;
  isSubmitting?: boolean;
  externalError?: string | null;
}

export const AuthOnboardingModal: React.FC<AuthOnboardingModalProps> = ({
  onComplete,
  isSubmitting = false,
  externalError = null,
}) => {
  const [activeTab, setActiveTab] = useState<'guest' | 'email'>('guest');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('1999-05-14');
  const [gender, setGender] = useState<GenderOption>('Female');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [bio, setBio] = useState('Hey there! Down for great conversations & music.');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const previewAge = calculateAgeFromDob(dob);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 120 * 1024) {
      setFormError('Please choose an image smaller than 120 KB or pick a 3D avatar.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setFormError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = validateProfileInput({
      username,
      dob,
      gender,
      email,
      requireEmail: activeTab === 'email',
    });

    if (!validation.valid || !validation.age) {
      setFormError(validation.error || 'Please check your profile details.');
      return;
    }

    if (activeTab === 'email' && password.trim().length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    await onComplete({
      mode: activeTab,
      username: username.trim(),
      dob,
      age: validation.age,
      gender,
      avatarUrl,
      bio: bio.trim(),
      email: activeTab === 'email' ? email.trim() : undefined,
      password: activeTab === 'email' ? password : undefined,
    });
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    const fallbackName = username.trim() || 'PrismMember';
    const validAge = previewAge >= 18 && previewAge <= 110 ? previewAge : 26;
    await onComplete({
      mode: 'google',
      username: fallbackName,
      dob: previewAge >= 18 ? dob : '2000-01-01',
      age: validAge,
      gender,
      avatarUrl,
      bio: bio.trim(),
    });
  };

  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col justify-between">
      {/* Top Bar Contract: Clean Brand Header */}
      <header className="flex w-full items-center justify-between gap-8 border-b border-white/10 bg-slate-950/70 px-6 py-4 backdrop-blur-xl lg:px-12">
        <a
          href="#top"
          className="font-['Outfit'] text-2xl font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          PrismChat 3D
        </a>

        <nav
          aria-label="Landing Navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300"
        >
          <a href="#join-card" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Live Lounges
          </a>
          <a href="#join-card" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Random Match
          </a>
          <a href="#join-card" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Voice Rooms
          </a>
          <a href="#join-card" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Private PVR
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500 whitespace-nowrap shrink-0"
          >
            Sign In with Google
          </button>
        </div>
      </header>

      {/* Full-Width Hero Section */}
      <section className="flex w-full flex-1 items-center px-6 py-10 sm:px-10 lg:px-16 xl:px-24 lg:py-14">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Hero Column: Large Expressive Display Typography & Live Lounge Status */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-orange-400">
              <Flame className="h-4 w-4" />
              <span>Live Global Chat Community · Online 24/7</span>
            </div>

            <h1
              className="mt-4 font-['Outfit'] text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem]"
              style={{ textWrap: 'balance' }}
            >
              Connect, Talk & Meet New People Around the World.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
              Step into lively public chat rooms, match for instant 1-on-1 conversations, and share
              voice notes, photos, and videos with people worldwide.
            </p>

            {/* Live Active Lounges Strip */}
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-200">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span>Global Plaza 3D</span>
                <span className="font-mono text-xs text-slate-400 tabular-nums">· 42 online</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                <span>Voice & Music Studio</span>
                <span className="font-mono text-xs text-slate-400 tabular-nums">· 28 online</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <span>Visual & Cinema Club</span>
                <span className="font-mono text-xs text-slate-400 tabular-nums">· 19 online</span>
              </div>
            </div>

            {/* Active Community Avatars Strip */}
            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
              <div className="flex -space-x-2.5">
                {PRESET_AVATARS.slice(0, 5).map((av) => (
                  <img
                    key={av.id}
                    src={av.url}
                    alt={av.label}
                    referrerPolicy="no-referrer"
                    className="h-11 w-11 rounded-full border-2 border-slate-950 object-cover"
                  />
                ))}
              </div>
              <div className="text-sm text-slate-300 sm:text-base">
                <span className="font-semibold text-white">98+ members chatting live</span> across
                public lounges & 1-on-1 rooms right now
              </div>
            </div>
          </div>

          {/* Right Hero Column: Clean Guest & Email Entry Card */}
          <div id="join-card" className="lg:col-span-5">
            <div className="rounded-3xl border border-white/15 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="mb-5">
                <h2 className="font-['Outfit'] text-2xl font-bold text-white">
                  Start Chatting Now
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Enter immediately as a guest or sign in with your email account.
                </p>
              </div>

              {/* Segmented Mode Switcher */}
              <div
                className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1.5"
                role="tablist"
                aria-label="Account entry mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'guest'}
                  onClick={() => {
                    setActiveTab('guest');
                    setFormError(null);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'guest'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Join as Guest</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'email'}
                  onClick={() => {
                    setActiveTab('email');
                    setFormError(null);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'email'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span>Email Account</span>
                </button>
              </div>

              {(formError || externalError) && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-200"
                >
                  {formError || externalError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Avatar Picker */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">
                      Profile Picture
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300">
                      <Camera className="h-3.5 w-3.5" />
                      <span>Upload Custom Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="sr-only"
                        aria-label="Upload custom profile picture"
                      />
                    </label>
                  </div>

                  <div className="mt-2.5 flex items-center gap-3 overflow-x-auto pb-1">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-orange-500 bg-slate-800">
                      <img
                        src={avatarUrl}
                        alt="Selected profile avatar"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {PRESET_AVATARS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setAvatarUrl(preset.url)}
                          aria-label={`Select ${preset.label} avatar`}
                          className={`h-11 w-11 shrink-0 overflow-hidden rounded-xl border-2 transition-transform hover:scale-105 ${
                            avatarUrl === preset.url
                              ? 'border-blue-400 ring-2 ring-blue-500/30'
                              : 'border-slate-800 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Username & DOB Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="onboarding-username"
                      className="block text-xs font-semibold text-slate-200"
                    >
                      Username
                    </label>
                    <input
                      id="onboarding-username"
                      type="text"
                      required
                      minLength={2}
                      maxLength={32}
                      placeholder="Choose a username..."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="onboarding-dob"
                        className="block text-xs font-semibold text-slate-200"
                      >
                        Date of Birth
                      </label>
                      {previewAge > 0 && (
                        <span className="font-mono text-xs text-slate-400 tabular-nums">
                          {previewAge} yrs
                        </span>
                      )}
                    </div>
                    <input
                      id="onboarding-dob"
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-sm text-white focus:border-blue-500 focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                {/* Gender Selection */}
                <div>
                  <span className="block text-xs font-semibold text-slate-200">Gender</span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(['Female', 'Male', 'Non-Binary', 'Prefer not to say'] as GenderOption[]).map(
                      (option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setGender(option)}
                          className={`rounded-xl border px-2 py-2 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                            gender === option
                              ? 'border-blue-500 bg-blue-600/20 text-white'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {option}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Email & Password Fields (When in Email tab) */}
                {activeTab === 'email' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="onboarding-email"
                        className="block text-xs font-semibold text-slate-200"
                      >
                        Email Address
                      </label>
                      <input
                        id="onboarding-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="onboarding-password"
                        className="block text-xs font-semibold text-slate-200"
                      >
                        Password
                      </label>
                      <input
                        id="onboarding-password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Short Status / Bio */}
                <div>
                  <label
                    htmlFor="onboarding-bio"
                    className="block text-xs font-semibold text-slate-200"
                  >
                    About / Status
                  </label>
                  <input
                    id="onboarding-bio"
                    type="text"
                    maxLength={240}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Say hello..."
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-400 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {activeTab === 'guest' ? 'Start Chatting Now' : 'Continue with Email'}
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <span>Google Login</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-white/10 bg-slate-950/60 px-6 py-4 text-xs text-slate-400 lg:px-12">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <span>PrismChat 3D · Global Live Chat & Social Rooms</span>
          <span>18+ Community · Respectful Conversations</span>
        </div>
      </footer>
    </div>
  );
};
