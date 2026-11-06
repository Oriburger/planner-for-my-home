import { forwardRef, useEffect, useState, type ReactNode } from 'react';

interface GoalRingProps {
  ratio: number;
  size?: number;
  /** 목표를 막 넘었을 때 한 번 빛난다 */
  celebrate?: boolean;
  children?: ReactNode;
}

/** 목표 대비 진행률 링 — 얇은 선, 마운트 시 0 에서 차오른다 */
export const GoalRing = forwardRef<HTMLDivElement, GoalRingProps>(function GoalRing(
  { ratio, size = 112, celebrate = false, children },
  ref,
) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(ratio));
    return () => cancelAnimationFrame(id);
  }, [ratio]);

  const stroke = Math.max(4, size * 0.05);
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const done = ratio >= 1;
  const offset = c * (1 - Math.min(1, shown));

  return (
    <div
      ref={ref}
      className={`relative shrink-0 rounded-full ${celebrate ? 'ring-celebrate' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-ink-900/[0.07] dark:stroke-white/10"
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
          className={done ? 'stroke-accent-500 dark:stroke-accent-400' : 'stroke-ink-900 dark:stroke-white'}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1), stroke 0.4s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
});
