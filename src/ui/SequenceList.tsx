import { useEffect, useRef } from 'react';
import { formatMove } from '../cube';
import type { Move } from '../cube';

interface SequenceListProps {
  title: string;
  moves: Move[];
  activeIndex: number;
  empty: string;
  testId: string;
}

export function SequenceList({
  title,
  moves,
  activeIndex,
  empty,
  testId,
}: SequenceListProps) {
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeIndex]);

  return (
    <section className="sequence" data-testid={testId}>
      <header className="sequence__head">
        <h2>{title}</h2>
        <span className="sequence__count">
          {moves.length > 0 ? `${moves.length} moves` : 'empty'}
        </span>
      </header>

      {moves.length === 0 ? (
        <p className="sequence__empty">{empty}</p>
      ) : (
        <ol className="sequence__moves" aria-label={`${title} moves`}>
          {moves.map((move, index) => {
            const active = index === activeIndex;
            return (
              <li
                key={`${index}-${move.face}-${move.amount}`}
                ref={active ? activeRef : undefined}
                className="move-chip"
                data-active={active}
                aria-current={active ? 'step' : undefined}
              >
                {formatMove(move)}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
