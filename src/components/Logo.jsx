export default function Logo({ 
  size = 'md', 
  withText = false, 
  textClassName = '',
  className = '',
  showBadge = true 
}) {
  const sizeMap = {
    xs: { box: 'w-6 h-6', svg: 24, text: 'text-sm' },
    sm: { box: 'w-8 h-8', svg: 32, text: 'text-base' },
    md: { box: 'w-10 h-10', svg: 40, text: 'text-lg sm:text-xl' },
    lg: { box: 'w-14 h-14', svg: 56, text: 'text-2xl sm:text-3xl' },
    xl: { box: 'w-20 h-20', svg: 80, text: 'text-3xl sm:text-4xl' },
    '2xl': { box: 'w-24 h-24', svg: 96, text: 'text-4xl sm:text-5xl' },
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Premium Vector Emblem */}
      <div 
        className={`${selectedSize.box} relative flex items-center justify-center shrink-0 rounded-2xl group transition-transform duration-300 hover:scale-105`}
        title="ExpenseTracker"
      >
        {/* Ambient Subtle Underglow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 to-cyan-500/30 rounded-2xl blur-md -z-10 opacity-70 group-hover:opacity-100 transition-opacity" />

        <svg 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(16,185,129,0.35)]"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="etCardBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="50%" stopColor="#0B1324" />
              <stop offset="100%" stopColor="#050B14" />
            </linearGradient>

            <linearGradient id="etBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#06B6D4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="etEmeraldWing" x1="12" y1="36" x2="36" y2="12">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="60%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>

            <linearGradient id="etCyanWing" x1="36" y1="36" x2="12" y2="12">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>

            <linearGradient id="etCoreGlow" x1="20" y1="20" x2="28" y2="28">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>

            <filter id="etDropShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Squircle Base Frame */}
          <rect 
            x="2.5" 
            y="2.5" 
            width="43" 
            height="43" 
            rx="13" 
            fill="url(#etCardBg)" 
            stroke="url(#etBorder)" 
            strokeWidth="1.5" 
          />

          {/* Subtle Inner Glass Highlight Arc */}
          <path
            d="M5 16C5 9.92487 9.92487 5 16 5H32C38.0751 5 43 9.92487 43 16V20C33 21 15 23 5 20V16Z"
            fill="white"
            fillOpacity="0.04"
          />

          {/* Left Wing / Foundation Ascending Ribbon (Emerald) */}
          <path
            d="M12 32.5L20 32.5L34 16.5L27 16.5L12 32.5Z"
            fill="url(#etEmeraldWing)"
            filter="url(#etDropShadow)"
          />

          {/* Right Wing / Interlocking Growth Arrow Ribbon (Cyan) */}
          <path
            d="M16 16.5H23.5L36 30L31 34.5L16 16.5Z"
            fill="url(#etCyanWing)"
            fillOpacity="0.9"
            filter="url(#etDropShadow)"
          />

          {/* Ascending Trend Arrowhead Tip */}
          <path
            d="M26 13.5H35.5V23L31.5 19L29 21.5L24 16.5L26.5 14L26 13.5Z"
            fill="url(#etEmeraldWing)"
          />

          {/* Center Nexus Wealth Diamond */}
          <path
            d="M24 19.5L27.5 24L24 28.5L20.5 24L24 19.5Z"
            fill="url(#etCoreGlow)"
          />

          {/* Center Inner Dot Spark */}
          <circle cx="24" cy="24" r="1.5" fill="#0B1324" />
        </svg>
      </div>

      {/* Optional Integrated Wordmark */}
      {withText && (
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className={`font-extrabold text-white tracking-tight leading-none ${selectedSize.text} ${textClassName}`}>
              Expense<span className="text-emerald-400">Tracker</span>
            </span>
            {size !== 'xs' && (
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider mt-0.5">
                INTELLIGENT WEALTH SUITE
              </span>
            )}
          </div>
          {showBadge && (
            <span className="text-[10px] font-extrabold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              PRO
            </span>
          )}
        </div>
      )}
    </div>
  );
}
