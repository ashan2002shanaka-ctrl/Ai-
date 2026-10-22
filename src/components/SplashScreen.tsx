import React, { useEffect, useState } from 'react';
import { GhostLogo } from './GhostLogo';
import { ArrowRight, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onEnterApp: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnterApp }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#06070a] flex flex-col items-center justify-center p-4 sm:p-6 pb-safe pt-safe select-none overflow-hidden">
      {/* Background radial atmosphere */}
      <div
        className="absolute w-[500px] sm:w-[600px] h-[500px] sm:h-[600px] rounded-full blur-[140px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #9333ea 0%, #3b0764 50%, transparent 80%)',
        }}
      />

      {/* Cybernetic grid lines subtle background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Center Branding Content */}
      <div
        className={`relative z-10 flex flex-col items-center text-center max-w-md transition-all duration-700 transform ${
          mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
        }`}
      >
        {/* Ghost Insignia with pulsing neon halo */}
        <div className="relative mb-4 sm:mb-6">
          <GhostLogo size={76} glow={true} className="animate-ghost-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-1 mb-2.5 sm:mb-3">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>BLACK GHOST</span>
            <span className="text-xs sm:text-sm px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-300 font-mono border border-purple-500/30">
              AI
            </span>
          </h1>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] font-semibold text-purple-400">
            Beyond Limits • Beyond Imagination
          </p>
        </div>

        <p className="text-gray-400 text-xs sm:text-sm font-light leading-relaxed mb-6 sm:mb-8 max-w-sm px-2">
          Next-generation personal intelligence engine. Autonomous reasoning, full-stack code synthesis, multimodal document comprehension, and live web exploration.
        </p>

        {/* Enter App Button */}
        <button
          onClick={onEnterApp}
          className="group relative flex items-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 min-h-[48px] rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-purple-900/40 hover:shadow-purple-600/50 active:scale-[0.98] transition-all cursor-pointer border border-purple-400/30"
        >
          <span>Initiate Black Ghost</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Security badge at bottom */}
        <div className="mt-8 flex items-center gap-2 text-[11px] text-gray-500 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Server-Side Google GenAI Active • Verified Safe</span>
        </div>
      </div>
    </div>
  );
};
