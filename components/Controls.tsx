"use client";

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
}

export default function Controls({
  isPlaying,
  onPlayPause,
  onSkipNext,
  onSkipPrevious,
}: ControlsProps) {
  return (
    <div className="controls">
      <button
        className="control-btn"
        onClick={onSkipPrevious}
        aria-label="Previous track"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="4" width="2.5" height="16" rx="0.5" />
          <path d="M7 12l10-7v14z" />
        </svg>
      </button>
      <button
        className="control-btn control-btn-main"
        onClick={onPlayPause}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="3" width="4" height="18" rx="0.5" />
            <rect x="15" y="3" width="4" height="18" rx="0.5" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 3l15 9-15 9z" />
          </svg>
        )}
      </button>
      <button
        className="control-btn"
        onClick={onSkipNext}
        aria-label="Next track"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 12L7 5v14z" />
          <rect x="19.5" y="4" width="2.5" height="16" rx="0.5" />
        </svg>
      </button>
    </div>
  );
}