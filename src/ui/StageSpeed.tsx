import type { Speed } from '../app/runner';

const SPEEDS: readonly { value: Speed; label: string }[] = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
];

interface StageSpeedProps {
  speed: Speed;
  onChange: (speed: Speed) => void;
  reducedMotion: boolean;
}

export function StageSpeed({
  speed,
  onChange,
  reducedMotion,
}: StageSpeedProps) {
  return (
    <div
      className="stage__speed"
      role="group"
      aria-label="Turn speed"
      data-reduced={reducedMotion}
    >
      <span className="stage__speed-label">
        {reducedMotion ? 'Reduced motion' : 'Speed'}
      </span>
      <div className="stage__speed-options">
        {SPEEDS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={speed === option.value}
            onClick={() => onChange(option.value)}
            disabled={reducedMotion}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
