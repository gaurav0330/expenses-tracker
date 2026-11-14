import Logo from './Logo';

export default function LoadingScreen({ 
  message = 'Synchronizing Financial Workspace...', 
  subtext = 'Intelligent Money & Asset Management',
  fullScreen = true,
  size = 'lg'
}) {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 z-50 min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 overflow-hidden'
    : 'w-full py-16 flex flex-col items-center justify-center p-4 relative overflow-hidden';

  const spinnerDimensions = size === 'sm' 
    ? 'w-16 h-16' 
    : size === 'md' 
    ? 'w-24 h-24' 
    : 'w-32 h-32 sm:w-36 sm:h-36';

  const logoSize = size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'md';

  return (
    <div className={containerClasses}>
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

      <div className="relative flex flex-col items-center justify-center z-10">
        
        {/* Central Logo with Animated Outer Loading Ring */}
        <div className={`relative ${spinnerDimensions} flex items-center justify-center`}>
          
          {/* Outer Track Orbit */}
          <div className="absolute inset-0 rounded-full border border-slate-800/80" />

          {/* Primary High-Speed Glowing Spinner Arc */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-teal-300 animate-spin" />

          {/* Secondary Counter-Rotating Cyan Arc with Slight Inset */}
          <div 
            className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-cyan-400 border-l-sky-300 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1.8s' }}
          />

          {/* Subtle Outer Pulsing Halo */}
          <div className="absolute -inset-2 rounded-full border border-emerald-500/15 animate-ping opacity-25" />

          {/* Centered Logo with Gentle Breathing Pulse */}
          <div className="relative z-10 transition-transform duration-700 animate-pulse-slow">
            <Logo size={logoSize} />
          </div>
        </div>

        {/* Textual Feedback */}
        {message && (
          <div className="mt-6 text-center space-y-1 max-w-xs">
            <h4 className="text-sm sm:text-base font-bold text-white tracking-wide animate-pulse">
              {message}
            </h4>
            {subtext && (
              <p className="text-xs text-slate-400 font-medium">
                {subtext}
              </p>
            )}
          </div>
        )}

        {/* Micro Linear Shimmer Bar */}
        <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden mt-4 relative">
          <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-400 to-cyan-400 rounded-full animate-shimmer" />
        </div>

      </div>
    </div>
  );
}
