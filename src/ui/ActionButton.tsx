import type { ReactNode } from 'react';

type ActionVariant = 'primary' | 'secondary' | 'ghost';

interface ActionButtonProps {
  variant: ActionVariant;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  shortcut?: string;
  testId: string;
  title?: string;
}

export function ActionButton({
  variant,
  icon,
  children,
  onClick,
  disabled = false,
  busy = false,
  shortcut,
  testId,
  title,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`action action--${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy}
      data-testid={testId}
      title={title}
    >
      <span className="action__icon" aria-hidden>
        {busy ? <span className="action__spinner" /> : icon}
      </span>
      <span className="action__label">{children}</span>
      {shortcut && <kbd>{shortcut}</kbd>}
    </button>
  );
}
