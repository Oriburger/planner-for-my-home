import type { TooltipProps } from 'recharts';
import { formatKRWShort } from '@/utils/format';

/** 크로스헤어 툴팁 — 값은 텍스트 잉크로, 색은 옆의 점이 담당한다 */
export function ChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="glass glass-strong min-w-[11rem] rounded-2xl px-3.5 py-3">
      <p className="mb-1.5 text-xs font-semibold text-ink-900 dark:text-slate-100">{label}</p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li
            key={String(entry.dataKey)}
            className="flex items-center gap-2 text-xs"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="text-ink-500 dark:text-slate-400">{entry.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-ink-900 dark:text-slate-100">
              {formatKRWShort(Number(entry.value ?? 0))}원
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
