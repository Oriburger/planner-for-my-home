import type { SimulationResult } from '@/types/planner';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { Icon } from '@/components/ui/Icon';
import { formatKRWShort } from '@/utils/format';

type Tone = 'default' | 'good' | 'critical';

const TONE: Record<Tone, string> = {
  default: 'text-ink-900 dark:text-white',
  good: 'text-emerald-700 dark:text-emerald-400',
  critical: 'text-rose-600 dark:text-rose-400',
};

function Kpi({
  label,
  value,
  format,
  tone = 'default',
}: {
  label: string;
  value: number;
  format: (v: number) => string;
  tone?: Tone;
}) {
  const v = useAnimatedNumber(value);
  return (
    <div className="glass spotlight lift min-w-0 rounded-2xl px-4 py-3.5">
      <p className="truncate text-xs font-medium text-ink-600 dark:text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-lg font-semibold tracking-tight tabular-nums sm:text-xl ${TONE[tone]}`}>
        {format(v)}
      </p>
    </div>
  );
}

/** 핵심 지표 4개 — 숫자만 간결하게 */
export function SummaryCards({
  summary,
  firstYear,
}: {
  summary: SimulationResult['summary'];
  firstYear: SimulationResult['rows'][number];
}) {
  const shortfallYear = summary.firstContributionShortfallYear;
  const won = (v: number) => `${formatKRWShort(v)}원`;

  return (
    <div className="space-y-2.5">
      {shortfallYear !== null && (
        <div role="alert" className="callout-danger flex items-start gap-2">
          <Icon name="alert" className="mt-px h-4 w-4 shrink-0" />
          <p>
            <strong className="font-semibold">{shortfallYear}년차</strong>부터 자동이체가 여유자금보다
            많아요 (최대 {formatKRWShort(summary.maxContributionShortfall)}원 부족 · 월 이체{' '}
            {formatKRWShort(firstYear.contribution / 12)}원)
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Kpi
          label="누적 저축"
          value={summary.totalSaved}
          format={won}
          tone={summary.totalSaved >= 0 ? 'default' : 'critical'}
        />
        <Kpi label="운용 수익" value={summary.totalReturn} format={won} tone="good" />
        <Kpi label="첫 해 저축률" value={summary.savingsRate} format={(v) => `${v.toFixed(1)}%`} />
        <Kpi
          label="적자 전환"
          value={summary.firstNegativeYear ?? 0}
          format={(v) => (summary.firstNegativeYear === null ? '없음' : `${Math.round(v)}년차`)}
          tone={summary.firstNegativeYear === null ? 'good' : 'critical'}
        />
      </div>
    </div>
  );
}
