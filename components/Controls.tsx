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
        ⏮
      </button>
      <button
        className="control-btn control-btn-main"
        onClick={onPlayPause}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>
      <button
        className="control-btn"
        onClick={onSkipNext}
        aria-label="Next track"
      >
        ⏭
      </button>
    </div>
  );
}
