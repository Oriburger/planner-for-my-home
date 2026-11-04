import type { SimulationResult } from '@/types/planner';
import { Icon } from '@/components/ui/Icon';
import { formatKRWShort, formatPercent } from '@/utils/format';

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  caption?: string;
  emphasis?: boolean;
  tone?: 'default' | 'good' | 'critical';
  /** 강조 카드에 그릴 추이 (예: 연도별 순자산) */
  trend?: number[];
}

/** 최소한의 영역 스파크라인 */
function Sparkline({ values }: { values: number[] }) {
  const w = 300;
  const h = 56;
  const rawMin = Math.min(...values);
  const max = Math.max(...values);
  // 하단 여백을 두어 증가 추세가 잘 보이도록 한다
  const min = rawMin - (max - rawMin) * 0.25;
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - 4 - ((v - min) / span) * (h - 8),
  ]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="-mx-5 -mb-5 mt-4 h-14 w-[calc(100%+2.5rem)] text-brand-600 dark:text-brand-400"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="3" fill="currentColor" />
    </svg>
  );
}

function StatTile({
  label,
  value,
  unit,
  caption,
  emphasis,
  tone = 'default',
  trend,
}: StatTileProps) {
  if (emphasis) {
    return (
      <div className="glass flex h-full min-h-[10rem] flex-col justify-between overflow-hidden rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-ink-500 dark:text-slate-400">{label}</p>
          <span className="chip text-ink-500 dark:text-slate-400">핵심 지표</span>
        </div>
        <div>
          <p className="mt-3 break-keep text-[30px] font-semibold leading-none tracking-tight tabular-nums text-ink-900 dark:text-white min-[360px]:text-[34px]">
            {value}
          </p>
          {caption && (
            <p className="mt-2 text-xs text-ink-500 dark:text-slate-400">{caption}</p>
          )}
        </div>
        {trend && trend.length > 1 && <Sparkline values={trend} />}
      </div>
    );
  }

  const valueColor =
    tone === 'good'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'critical'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-ink-900 dark:text-white';

  return (
    <div className="glass flex min-w-0 flex-col rounded-2xl p-4">
      <p className="truncate text-xs font-medium text-ink-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1.5 break-keep text-lg font-semibold leading-tight tracking-tight tabular-nums sm:text-xl ${valueColor}`}
      >
        {value}
        {unit && (
          <span className="ml-0.5 text-sm font-semibold text-ink-500 dark:text-slate-300">
            {unit}
          </span>
        )}
      </p>
      {caption && (
        <p className="mt-auto pt-1.5 text-[11px] leading-snug text-ink-400 dark:text-slate-500">
          {caption}
        </p>
      )}
    </div>
  );
}

export function SummaryCards({
  summary,
  years,
  finalYear,
  firstYear,
  trend,
}: {
  summary: SimulationResult['summary'];
  trend?: number[];
  years: number;
  finalYear: number;
  firstYear: SimulationResult['rows'][number];
}) {
  const shortfallYear = summary.firstContributionShortfallYear;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {shortfallYear !== null && (
        <div
          role="alert"
          className="callout-danger col-span-2 flex items-start gap-2.5 rounded-2xl p-4 lg:col-span-4"
        >
          <Icon name="alert" className="mt-px h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold">
              {shortfallYear}년차부터 자동이체를 감당할 현금이 부족해요
            </p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">
              월 자동이체 합계가 그 해 쓸 수 있는 여유자금을 넘어섭니다. 최대{' '}
              {formatKRWShort(summary.maxContributionShortfall)}원까지 모자라요.
              자동이체 금액을 줄이거나 지출을 조정해 주세요.
            </p>
            <p className="mt-1 text-[11px] opacity-75">
              참고 · 1년차 세후 월 실수령{' '}
              {formatKRWShort(firstYear.netIncome / 12)}원 · 월 자동이체{' '}
              {formatKRWShort(firstYear.contribution / 12)}원
            </p>
          </div>
        </div>
      )}

      <div className="col-span-2 lg:row-span-2">
        <StatTile
          label={`${years}년 후 (${finalYear}년) 예상 순자산`}
          value={`${formatKRWShort(summary.finalNetWorth)}원`}
          caption={`총자산 ${formatKRWShort(summary.finalTotalAssets)}원 · 현재 대비 ${
            summary.totalGrowth >= 0 ? '+' : ''
          }${formatKRWShort(summary.totalGrowth)}원`}
          emphasis
          trend={trend}
        />
      </div>

      <StatTile
        label="누적 저축액"
        value={`${formatKRWShort(summary.totalSaved)}원`}
        caption={`연평균 ${formatKRWShort(summary.averageAnnualSavings)}원`}
        tone={summary.totalSaved >= 0 ? 'default' : 'critical'}
      />

      <StatTile
        label="누적 운용수익"
        value={`${formatKRWShort(summary.totalReturn)}원`}
        caption="복리로 불어난 금액"
        tone="good"
      />

      <StatTile
        label="첫 해 저축률"
        value={formatPercent(summary.savingsRate)}
        caption={`세후 월 ${formatKRWShort(firstYear.netIncome / 12)}원 대비`}
      />

      <StatTile
        label="적자 전환"
        value={
          summary.firstNegativeYear === null
            ? '없음'
            : `${summary.firstNegativeYear}년차`
        }
        caption={
          summary.firstNegativeYear === null
            ? '순자산이 마이너스가 되지 않아요'
            : '순자산이 마이너스가 되는 시점'
        }
        tone={summary.firstNegativeYear === null ? 'good' : 'critical'}
      />

      {summary.pensionMaturities && summary.pensionMaturities.length > 0 && (
        <div className="glass col-span-2 rounded-2xl p-4 sm:p-5 lg:col-span-4">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-900 dark:text-white">
            <Icon name="target" className="h-4 w-4 text-ink-500 dark:text-slate-400" /> 연금저축 · ISA 만기 요약
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {summary.pensionMaturities.map((item) => (
              <div
                key={item.assetId}
                className="glass-tile rounded-2xl p-3.5"
              >
                <div className="flex items-center justify-between gap-2 text-[13px] font-semibold text-ink-900 dark:text-slate-100">
                  <span className="truncate">{item.assetName}</span>
                  <span className="chip shrink-0 text-[10px] text-ink-500 dark:text-slate-400">
                    {item.maturityYearIndex}년 차 ({item.maturityCalendarYear}년
                    {item.maturityAge !== null ? `, 만 ${item.maturityAge}세` : ''})
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="text-ink-500 dark:text-slate-400">만기 예상 평가액</span>
                  <span className="font-semibold text-brand-700 dark:text-brand-400 tabular-nums">
                    {formatKRWShort(item.estimatedAmountAtMaturity)}원
                  </span>
                </div>
                {item.convertedToLiquid && (
                  <p className="mt-1 text-[10px] text-ink-400 dark:text-slate-500">
                    * 만기 시 자동이체 중단 및 유동자산(현금)으로 전환
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
