import type { SimulationResult } from '@/types/planner';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { Icon } from '@/components/ui/Icon';
import { formatKRWShort } from '@/utils/format';
import type { YearPoint } from '@/utils/accumulation';

type Tone = 'default' | 'good' | 'critical';

const TONE: Record<Tone, string> = {
  default: 'text-ink-900 dark:text-white',
  good: 'text-accent-700 dark:text-accent-400',
  critical: 'text-rose-600 dark:text-rose-400',
};

function Kpi({
  label,
  value,
  format,
  tone = 'default',
  sub,
  tag,
}: {
  label: string;
  /** 기준 시점 꼬리표 (예: ~2027) */
  tag?: string;
  value: number;
  format: (v: number) => string;
  tone?: Tone;
  /** 비교 기준 (예: 전체 기간 합계) */
  sub?: string;
}) {
  const v = useAnimatedNumber(value, 400);
  return (
    <div className="glass spotlight lift min-w-0 rounded-2xl px-3 py-3 sm:px-4 sm:py-3.5">
      <div className="flex items-center justify-between gap-1.5">
        <p className="truncate text-xs font-medium text-ink-600 dark:text-slate-400">{label}</p>
        {tag && (
          <span className="shrink-0 rounded bg-ink-900/[0.06] px-1.5 py-px text-[10px] font-medium tabular-nums text-ink-600 dark:bg-white/[0.08] dark:text-slate-400">
            {tag}
          </span>
        )}
      </div>
      <p className={`mt-1 truncate text-base font-semibold tracking-tight tabular-nums sm:text-xl ${TONE[tone]}`}>
        {format(v)}
      </p>
      {sub && (
        <p className="mt-0.5 truncate text-[10px] font-medium tabular-nums text-ink-500 dark:text-slate-400 sm:text-[11px]">
          {sub}
        </p>
      )}
    </div>
  );
}

/**
 * 핵심 지표 — 홈에서 고른 연도 기준 값을 크게, 전체 기간 값을 함께 보여준다.
 */
export function SummaryCards({
  summary,
  firstYear,
  point,
  years,
}: {
  summary: SimulationResult['summary'];
  firstYear: SimulationResult['rows'][number];
  /** 선택한 연도의 누적값 */
  point: YearPoint;
  years: number;
}) {
  const tag = point.index === 0 ? '지금' : `~${point.year}`;
  const shortfallYear = summary.firstContributionShortfallYear;
  const won = (v: number) => `${formatKRWShort(v)}원`;

  return (
    <div className="space-y-2.5">
      {shortfallYear !== null && (
        <div role="alert" className="callout-danger flex items-start gap-2">
          <Icon name="alert" className="mt-px h-4 w-4 shrink-0" />
          <p className="break-keep">
            <strong className="font-semibold">{shortfallYear}년차</strong>부터 여유자금 부족 발생
            (최대 -{formatKRWShort(summary.maxContributionShortfall)}원 · 월 이체{' '}
            {formatKRWShort(firstYear.contribution / 12)}원)
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <Kpi
          label="누적 저축"
          tag={tag}
          value={point.savingsCum}
          format={won}
          tone={point.savingsCum >= 0 ? 'default' : 'critical'}
          sub={`${years}년 합계 ${formatKRWShort(summary.totalSaved)}`}
        />
        <Kpi
          label="운용 수익"
          tag={tag}
          value={point.grown}
          format={won}
          tone="good"
          sub={`${years}년 합계 ${formatKRWShort(summary.totalReturn)}`}
        />
        <Kpi
          label="저축률"
          tag={point.index === 0 ? '첫 해' : `${point.year}`}
          value={point.savingsRate ?? summary.savingsRate}
          format={(v) => `${v.toFixed(1)}%`}
          sub={`첫 해 ${summary.savingsRate.toFixed(1)}%`}
        />
        <Kpi
          label="적자 전환"
          value={summary.firstNegativeYear ?? 0}
          format={(v) => (summary.firstNegativeYear === null ? '없음' : `${Math.round(v)}년차`)}
          tone={summary.firstNegativeYear === null ? 'good' : 'critical'}
          sub={`${years}년 동안`}
        />
      </div>
    </div>
  );
}
