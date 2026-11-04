import { forwardRef, useEffect, useState } from 'react';

interface GoalRingProps {
  ratio: number;
  size?: number;
  children?: React.ReactNode;
}

/** 목표 대비 진행률 링 — 마운트 시 0 에서 차오른다 */
export const GoalRing = forwardRef<HTMLDivElement, GoalRingProps>(function GoalRing(
  { ratio, size = 112, children },
  ref,
) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(ratio));
    return () => cancelAnimationFrame(id);
  }, [ratio]);

  const stroke = Math.max(6, size * 0.075);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = ratio >= 1;
  const offset = c * (1 - Math.min(1, shown));

  return (
    <div ref={ref} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-ink-900/[0.08] dark:stroke-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={done ? 'stroke-emerald-500' : 'stroke-ink-900 dark:stroke-white'}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2,0.8,0.2,1), stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
});
