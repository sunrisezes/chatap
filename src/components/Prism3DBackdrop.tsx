import React, { useEffect, useRef } from 'react';

interface Prism3DBackdropProps {
  accentTheme?: string;
}

export const Prism3DBackdrop: React.FC<Prism3DBackdropProps> = ({ accentTheme = 'cobalt' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId = 0;
    let angle = 0;

    const paletteMap: Record<string, [string, string, string]> = {
      cobalt: ['#3B82F6', '#06B6D4', '#F97316'],
      coral: ['#F97316', '#F43F5E', '#38BDF8'],
      emerald: ['#10B981', '#06B6D4', '#F59E0B'],
      amber: ['#F59E0B', '#F97316', '#38BDF8'],
      rose: ['#F43F5E', '#FB7185', '#3B82F6'],
    };

    const colors = paletteMap[accentTheme] || paletteMap.cobalt;

    const renderFrame = (t: number) => {
      const width = (canvas.width = canvas.parentElement?.clientWidth || 1200);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 800);

      ctx.clearRect(0, 0, width, height);

      // Tactile 3D light-emitting spheres with studio rim shading
      const orbs = [
        {
          x: width * 0.16 + Math.cos(t * 0.6) * 28,
          y: height * 0.22 + Math.sin(t * 0.5) * 20,
          r: Math.min(width, height) * 0.22,
          color: colors[0],
        },
        {
          x: width * 0.82 + Math.sin(t * 0.4) * 32,
          y: height * 0.68 + Math.cos(t * 0.5) * 24,
          r: Math.min(width, height) * 0.26,
          color: colors[1],
        },
        {
          x: width * 0.52 + Math.cos(t * 0.35) * 22,
          y: height * 0.14 + Math.sin(t * 0.45) * 18,
          r: Math.min(width, height) * 0.16,
          color: colors[2],
        },
      ];

      orbs.forEach((orb) => {
        const grad = ctx.createRadialGradient(
          orb.x - orb.r * 0.25,
          orb.y - orb.r * 0.25,
          orb.r * 0.05,
          orb.x,
          orb.y,
          orb.r
        );
        grad.addColorStop(0, `${orb.color}30`);
        grad.addColorStop(0.55, `${orb.color}14`);
        grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Architectural isometric grid lines for spatial depth
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
      ctx.lineWidth = 1;
      const step = 72;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    renderFrame(0.5);

    if (!isHeadless && !prefersReducedMotion) {
      let lastRender = 0;
      const loop = (now: number) => {
        if (now - lastRender >= 66) {
          angle += 0.025;
          renderFrame(angle);
          lastRender = now;
        }
        animationFrameId = window.requestAnimationFrame(loop);
      };
      animationFrameId = window.requestAnimationFrame(loop);
    }

    const handleResize = () => renderFrame(angle);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [accentTheme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
};
