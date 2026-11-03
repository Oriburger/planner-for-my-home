import type { SimulationResult } from '@/types/planner';
import { formatKRWShort, formatPercent } from '@/utils/format';

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  caption?: string;
  emphasis?: boolean;
  tone?: 'default' | 'good' | 'critical';
}

function StatTile({
  label,
  value,
  unit,
  caption,
  emphasis,
  tone = 'default',
}: StatTileProps) {
  const valueColor =
    tone === 'good'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'critical'
        ? 'text-rose-600 dark:text-rose-400'
        : emphasis
          ? 'text-brand-700 dark:text-blue-300'
          : 'text-ink-900 dark:text-slate-100';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all duration-300 ring-1 ring-inset hover:-translate-y-0.5 hover:shadow-glass-lg ${
        emphasis
          ? 'border-blue-400/60 bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-white/80 shadow-glass-glow ring-blue-300/40 dark:border-blue-500/30 dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-blue-950/60 dark:to-slate-900/80 dark:ring-blue-500/20'
          : 'border-white/60 bg-white/70 shadow-glass ring-white/30 dark:border-white/10 dark:bg-slate-900/65 dark:shadow-glass-dark dark:ring-white/5'
      }`}
    >
      {emphasis && (
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-xl dark:from-blue-400/15 dark:to-indigo-500/15"
          aria-hidden="true"
        />
      )}
      <p
        className={`text-xs font-semibold ${
          emphasis ? 'text-brand-800 dark:text-blue-200' : 'text-ink-500 dark:text-slate-400'
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1.5 break-keep leading-tight ${valueColor} ${
          emphasis
            ? 'text-2xl font-bold sm:text-3xl'
            : 'text-base font-bold sm:text-xl'
        }`}
      >
        {value}
        {unit && (
          <span className="ml-0.5 text-sm font-semibold text-ink-500 dark:text-slate-300">
            {unit}
          </span>
        )}
      </p>
      {caption && (
        <p
          className={`mt-1.5 text-[11px] ${
            emphasis
              ? 'font-medium text-brand-900/70 dark:text-blue-300/80'
              : 'text-ink-400 dark:text-slate-400'
          }`}
        >
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
}: {
  summary: SimulationResult['summary'];
  years: number;
  finalYear: number;
  firstYear: SimulationResult['rows'][number];
}) {
  const shortfallYear = summary.firstContributionShortfallYear;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {shortfallYear !== null && (
        <div
          role="alert"
          className="col-span-2 flex items-start gap-2.5 rounded-2xl border border-rose-300/80 bg-rose-50/75 p-4 shadow-glass backdrop-blur-xl ring-1 ring-inset ring-rose-200/50 lg:col-span-4 dark:border-rose-900/60 dark:bg-rose-950/40 dark:ring-rose-800/20"
        >
          <span aria-hidden="true" className="text-base leading-none">
            ⚠️
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
              {shortfallYear}년차부터 자동이체를 감당할 현금이 부족해요
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-rose-700 dark:text-rose-400">
              월 자동이체 합계가 그 해 쓸 수 있는 여유자금을 넘어섭니다. 최대{' '}
              {formatKRWShort(summary.maxContributionShortfall)}원까지 모자라요.
              자동이체 금액을 줄이거나 지출을 조정해 주세요.
            </p>
            <p className="mt-1 text-[11px] text-rose-700/80 dark:text-rose-400/80">
              참고 · 1년차 세후 월 실수령{' '}
              {formatKRWShort(firstYear.netIncome / 12)}원 · 월 자동이체{' '}
              {formatKRWShort(firstYear.contribution / 12)}원
            </p>
          </div>
        </div>
      )}

      <div className="col-span-2">
        <StatTile
          label={`${years}년 후 (${finalYear}년) 예상 순자산`}
          value={`${formatKRWShort(summary.finalNetWorth)}원`}
          caption={`총자산 ${formatKRWShort(summary.finalTotalAssets)}원 · 현재 대비 ${
            summary.totalGrowth >= 0 ? '+' : ''
          }${formatKRWShort(summary.totalGrowth)}원`}
          emphasis
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
        <div className="col-span-2 lg:col-span-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-glass backdrop-blur-xl ring-1 ring-inset ring-white/30 dark:border-white/10 dark:bg-slate-900/65 dark:shadow-glass-dark dark:ring-white/5">
          <p className="text-xs font-bold text-brand-800 dark:text-brand-300 flex items-center gap-1.5">
            <span>🎯</span> 연금저축 · ISA 만기 요약
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {summary.pensionMaturities.map((item) => (
              <div
                key={item.assetId}
                className="rounded-xl border border-white/80 bg-white/70 p-3 shadow-xs backdrop-blur-md transition-all hover:border-brand-200 dark:border-white/10 dark:bg-slate-800/60 dark:hover:border-slate-700"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-ink-900 dark:text-slate-100">
                  <span className="truncate pr-2">{item.assetName}</span>
                  <span className="shrink-0 rounded-full border border-brand-200/60 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/80 dark:text-brand-300">
                    {item.maturityYearIndex}년 차 ({item.maturityCalendarYear}년
                    {item.maturityAge !== null ? `, 만 ${item.maturityAge}세` : ''})
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="text-ink-500 dark:text-slate-400">만기 예상 평가액</span>
                  <span className="font-bold text-brand-700 dark:text-brand-400 tabular-nums">
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
