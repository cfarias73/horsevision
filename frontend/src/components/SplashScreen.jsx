import React, { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web/build/player/lottie_light';
import horseAnimationData from '../assets/Horselogo.json';

/**
 * SplashScreen:
 * Pure white background splash screen contained strictly within the mobile phone shell.
 * Displays the one-line horse Lottie animation with an authentic native iOS status bar
 * for exactly 3 seconds with a smooth fade-out transition.
 */
export default function SplashScreen({ onFinish }) {
  const containerRef = useRef(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let anim = null;
    if (containerRef.current) {
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: horseAnimationData,
      });

      // Calibrated slower drawing pace: draws the full one-line horse across 2.4s without erasing
      anim.setSpeed(0.85);
      anim.playSegments([0, 61], true);
    }

    // Start smooth fade-out at 2.6s so the full drawing remains visible before seamless handover
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2600);

    // Total duration exactly 3.0 seconds
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      if (anim) anim.destroy();
    };
  }, [onFinish]);

  return (
    <div
      className={`absolute inset-0 z-[100] flex flex-col justify-between bg-white transition-opacity duration-450 ease-out sm:rounded-[42px] overflow-hidden select-none ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Native Status Bar (Dark icons on pure white) */}
      <div className="flex items-center justify-between px-7 pt-[max(12px,env(safe-area-inset-top))] pb-1.5 shrink-0 text-neutral-900">
        <span className="font-mono text-[13px] font-bold tracking-tight tabular-nums">
          9:41
        </span>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
            <rect x="0" y="7" width="2.5" height="4" rx="0.8" />
            <rect x="4" y="5" width="2.5" height="6" rx="0.8" />
            <rect x="8" y="3" width="2.5" height="8" rx="0.8" />
            <rect x="12" y="0.5" width="2.5" height="10.5" rx="0.8" />
          </svg>
          <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1.5 3.8C5 0.8 10 0.8 13.5 3.8" strokeLinecap="round" />
            <path d="M3.8 6.4C6 4.4 9 4.4 11.2 6.4" strokeLinecap="round" />
            <circle cx="7.5" cy="9.2" r="1.1" fill="currentColor" stroke="none" />
          </svg>
          <div className="w-[22px] h-[11px] rounded-[3.5px] border border-neutral-900 p-[1.5px] flex items-center">
            <div className="w-full h-full bg-neutral-900 rounded-[1.5px]" />
          </div>
        </div>
      </div>

      {/* Centered Lottie Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-6">
        <div
          ref={containerRef}
          className="w-[240px] h-[310px] max-w-[75vw] flex items-center justify-center filter drop-shadow-sm"
        />

        <div className="mt-3 flex flex-col items-center gap-1 text-center">
          <h1 className="font-mono text-[19px] font-black tracking-[0.3em] text-neutral-950 uppercase">
            HORSEVISION
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D3F2E] animate-pulse" />
            <p className="font-mono text-[10px] tracking-[0.22em] text-[#0D3F2E]/80 font-bold uppercase">
              Equine Biomechanics AI
            </p>
          </div>
        </div>
      </div>

      {/* Bottom iOS Home Indicator */}
      <div className="pb-[max(14px,env(safe-area-inset-bottom))] flex justify-center shrink-0">
        <div className="w-32 h-1 rounded-full bg-neutral-300" />
      </div>
    </div>
  );
}
