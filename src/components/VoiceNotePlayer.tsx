import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';

interface VoiceNotePlayerProps {
  mediaUrl?: string;
  durationSeconds: number;
  label?: string;
}

const WAVEFORM_BARS = [35, 65, 45, 85, 95, 55, 75, 40, 90, 60, 80, 50, 70, 95, 60, 40, 75, 55, 45, 30];

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  mediaUrl,
  durationSeconds,
  label,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const totalDuration = Math.max(1, durationSeconds || 8);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const stopPlayback = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setElapsed(0);
  };

  const triggerSynthTone = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Ignore Web Audio errors in headless environments
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    setIsPlaying(true);

    if (mediaUrl && mediaUrl.startsWith('data:audio')) {
      const audio = new Audio(mediaUrl);
      audioRef.current = audio;
      audio.onended = () => stopPlayback();
      audio.play().catch(() => {});
    } else {
      triggerSynthTone();
    }

    timerRef.current = window.setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= totalDuration) {
          stopPlayback();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const progressRatio = Math.min(1, elapsed / totalDuration);

  return (
    <div className="mt-1.5 flex w-full max-w-full flex-col gap-1.5 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/90 p-2.5 sm:p-3">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
          className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform hover:bg-blue-500 active:scale-95"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-0.5 sm:gap-1 overflow-hidden" aria-hidden="true">
          {WAVEFORM_BARS.map((heightPct, idx) => {
            const barProgress = idx / WAVEFORM_BARS.length;
            const isActiveBar = isPlaying && barProgress <= progressRatio;
            return (
              <div
                key={idx}
                className={`flex-1 min-w-[2px] max-w-[6px] rounded-full transition-colors ${
                  isActiveBar ? 'bg-amber-400' : 'bg-slate-600'
                }`}
                style={{ height: `${Math.max(8, Math.round((heightPct / 100) * 26))}px` }}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs text-slate-300 tabular-nums whitespace-nowrap shrink-0">
          <Volume2 className="hidden sm:inline h-3.5 w-3.5 text-blue-400" />
          <span>
            {formatTime(elapsed)} / {formatTime(totalDuration)}
          </span>
        </div>
      </div>
      {label && <p className="truncate text-xs text-slate-400">{label}</p>}
    </div>
  );
};
