import React from 'react';

interface GhostLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const GhostLogo: React.FC<GhostLogoProps> = ({
  className = '',
  size = 36,
  glow = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background glow halo */}
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-md opacity-70 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(99, 102, 241, 0.15) 60%, transparent 100%)',
            transform: 'scale(1.4)',
          }}
        />
      )}

      {/* Bespoke Black Ghost SVG Insignia */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="ghostGradient" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d8b4fe" />
            <stop offset="40%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>

          <linearGradient id="bodyShade" x1="50" y1="15" x2="50" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#090a0f" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#050508" />
          </linearGradient>

          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Ghost Silhouette outline */}
        <path
          d="M50 12C32 12 20 27 20 45C20 62 23 74 27 86C28 89 31 88 33 85C36 80 40 80 43 85C46 89 50 89 53 85C56 80 60 80 63 85C65 88 68 89 69 86C74 74 77 62 77 45C77 27 68 12 50 12Z"
          fill="url(#bodyShade)"
          stroke="url(#ghostGradient)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Floating internal aura ribs */}
        <path
          d="M32 46C34 56 38 66 43 73"
          stroke="#a855f7"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.3"
        />
        <path
          d="M68 46C66 56 62 66 57 73"
          stroke="#a855f7"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.3"
        />

        {/* Ghost Eyes - Sleek futuristic cybernetic slits */}
        <path
          d="M35 40C38 38 43 39 45 43C42 43 38 42 35 40Z"
          fill="#f3e8ff"
          filter="url(#neonGlow)"
        />
        <path
          d="M65 40C62 38 57 39 55 43C58 43 62 42 65 40Z"
          fill="#f3e8ff"
          filter="url(#neonGlow)"
        />

        {/* Eye pupils / sparks */}
        <circle cx="41" cy="41" r="1.5" fill="#a855f7" />
        <circle cx="59" cy="41" r="1.5" fill="#a855f7" />

        {/* Center core futuristic phantom crest */}
        <path
          d="M50 25L52.5 31L59 31.5L54 35.5L55.5 42L50 38L44.5 42L46 35.5L41 31.5L47.5 31L50 25Z"
          fill="#c084fc"
          fillOpacity="0.4"
          filter="url(#neonGlow)"
        />
      </svg>
    </div>
  );
};
