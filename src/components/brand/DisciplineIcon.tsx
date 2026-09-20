import type { CSSProperties } from 'react';

/** Original pictograms from the identity sheet supplied by the studio. */
export function DisciplineIcon({ name, size = 64, className = '' }: {
  name: 'hybrid' | 'train' | 'running' | 'competition'; size?: number; className?: string;
}) {
  return <img src={`/brand/studio/${name}.svg`} alt="" aria-hidden="true"
    className={`alt-official-discipline ${className}`} width={size} height={size}
    style={{ '--discipline-size': `${size}px` } as CSSProperties} />;
}

export function disciplineForName(name: string): 'hybrid' | 'train' | 'running' | undefined {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (normalized === 'train') return 'train';
  if (normalized.includes('running') || normalized === 'run' || normalized === 'carrera') return 'running';
  if (normalized.includes('hibrido') || normalized.includes('funcional')) return 'hybrid';
  return undefined;
}
