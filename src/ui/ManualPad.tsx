import type { CSSProperties } from 'react';
import { FACE_COLORS, FACES } from '../cube';
import type { Face } from '../cube';
import type { TurnModifier } from '../app/runner';
import { KeyboardIcon } from './icons';

const MODIFIERS: readonly {
  value: TurnModifier;
  label: string;
  accessibleName: string;
}[] = [
  { value: 'quarter', label: '90°', accessibleName: 'Quarter turn clockwise' },
  {
    value: 'prime',
    label: '90°′',
    accessibleName: 'Quarter turn counterclockwise',
  },
  { value: 'half', label: '180°', accessibleName: 'Half turn' },
];

interface ManualPadProps {
  disabled: boolean;
  modifier: TurnModifier;
  onModifierChange: (modifier: TurnModifier) => void;
  onTurn: (face: Face) => void;
}

export function ManualPad({
  disabled,
  modifier,
  onModifierChange,
  onTurn,
}: ManualPadProps) {
  return (
    <div className="manual">
      <div className="manual__head">
        <div className="control-label">
          <span>Turn by hand</span>
        </div>
        <div className="segmented segmented--small" role="group" aria-label="Turn amount">
          {MODIFIERS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="segmented__button"
              aria-pressed={modifier === option.value}
              aria-label={option.accessibleName}
              onClick={() => onModifierChange(option.value)}
              disabled={disabled}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="manual__faces">
        {FACES.map((face) => (
          <button
            key={face}
            type="button"
            className="face-button"
            style={{ '--face-color': FACE_COLORS[face] } as CSSProperties}
            onClick={() => onTurn(face)}
            disabled={disabled}
            aria-label={`Turn the ${face} face`}
            data-testid={`manual-${face.toLowerCase()}`}
          >
            <span className="face-button__dot" aria-hidden />
            {face}
          </button>
        ))}
      </div>

      <p className="manual__hint">
        <KeyboardIcon />
        Keys <kbd>U</kbd> <kbd>R</kbd> <kbd>F</kbd> <kbd>D</kbd> <kbd>L</kbd>{' '}
        <kbd>B</kbd> · Shift = prime · <kbd>2</kbd> = 180°
      </p>
    </div>
  );
}
