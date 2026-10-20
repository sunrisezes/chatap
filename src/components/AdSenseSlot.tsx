import React, { useEffect } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import type { AdSenseConfig } from '../utils/chatLogic';

interface AdSenseSlotProps {
  config: AdSenseConfig;
  placement: 'sidebar' | 'banner';
  onOpenAdConfig?: () => void;
  isModerator?: boolean;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  config,
  placement,
  onOpenAdConfig,
  isModerator = false,
}) => {
  const slotId = placement === 'sidebar' ? config.sidebarSlotId : config.bannerSlotId;
  const hasRealPublisher =
    config.enabled &&
    config.publisherId.startsWith('ca-pub-') &&
    config.publisherId !== 'ca-pub-0000000000000000' &&
    Boolean(slotId);

  useEffect(() => {
    if (!hasRealPublisher) return;
    const scriptId = 'google-adsense-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        config.publisherId
      )}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore duplicate push in preview
    }
  }, [hasRealPublisher, config.publisherId, slotId]);

  if (!config.enabled) {
    return null;
  }

  if (hasRealPublisher && !config.showTestPlaceholders) {
    return (
      <div
        className={`overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/70 p-2 ${
          placement === 'sidebar' ? 'min-h-[110px]' : 'min-h-[72px]'
        }`}
        data-testid={`adsense-${placement}`}
      >
        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
          <span>Sponsored · Google AdSense</span>
          <span className="font-mono">{config.publisherId.slice(0, 14)}...</span>
        </div>
        <ins
          className="adsbygoogle block"
          data-ad-client={config.publisherId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-800/90 bg-slate-900/80 p-2.5 sm:p-3 transition-colors ${
        placement === 'sidebar'
          ? 'w-full'
          : 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'
      }`}
      data-testid={`adsense-${placement}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
            <span>Sponsored</span>
            <span aria-hidden="true">·</span>
            <span>Google AdSense</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{slotId || 'slot-88412'}</span>
          </div>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-100">
            Studio Spatial Audio Headsets — 40% Off Creator Bundle
          </p>
          <p className="hidden sm:block mt-0.5 text-[11px] text-slate-400">
            Crystal-clear voice notes and zero-latency room acoustics.
          </p>
        </div>
        {placement === 'sidebar' && (
          <span className="rounded-lg bg-blue-500/15 p-1.5 text-blue-400 shrink-0">
            <Sparkles className="h-4 w-4" />
          </span>
        )}
      </div>

      <div
        className={`flex items-center justify-between gap-3 shrink-0 ${
          placement === 'sidebar' ? 'mt-2 border-t border-slate-800/70 pt-2' : ''
        }`}
      >
        <span className="truncate font-mono text-[10px] text-slate-400 tabular-nums">
          {config.publisherId || 'ca-pub-0000000000000000'}
        </span>
        {isModerator && onOpenAdConfig ? (
          <button
            type="button"
            onClick={onOpenAdConfig}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 whitespace-nowrap shrink-0"
          >
            <span>Configure AdSense</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        ) : (
          <span className="text-[11px] font-medium text-blue-400 whitespace-nowrap shrink-0">
            AdChoices
          </span>
        )}
      </div>
    </div>
  );
};
