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
    <div className="rounded-xl border border-ink-200 bg-white/95 px-3 py-2 shadow-card backdrop-blur">
      <p className="mb-1.5 text-xs font-semibold text-ink-900">{label}</p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li
            key={String(entry.dataKey)}
            className="flex items-center gap-2 text-xs"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="text-ink-500">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums text-ink-900">
              {formatKRWShort(Number(entry.value ?? 0))}원
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
