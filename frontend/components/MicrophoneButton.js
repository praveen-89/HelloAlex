'use client';

export default function MicrophoneButton({ status, onClick, disabled }) {
  const getLabel = () => {
    if (status === 'listening') return 'Stop';
    if (status === 'processing') return 'Wait...';
    if (status === 'speaking') return 'Interrupt';
    return 'Speak';
  };

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Pulse rings (only when listening) */}
      {status === 'listening' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="mic-pulse" />
          <div className="mic-pulse" />
          <div className="mic-pulse" />
        </div>
      )}

      {/* Main mic button */}
      <button
        className={`mic-btn relative z-10 ${status}`}
        onClick={onClick}
        disabled={disabled || status === 'processing'}
        aria-label={getLabel()}
        title={getLabel()}
      >
        {status === 'processing' ? (
          /* Spinner */
          <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : status === 'speaking' ? (
          /* Stop icon */
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : status === 'listening' ? (
          /* Recording dot */
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v3M12 20v3M1 12h3M20 12h3" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          /* Mic icon */
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        )}
      </button>

      {/* Label */}
      <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>
        {getLabel()}
      </span>
    </div>
  );
}
