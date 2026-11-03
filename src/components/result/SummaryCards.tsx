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
  if (emphasis) {
    return (
      <div className="aurora-card aurora-shimmer flex h-full min-h-[9rem] flex-col justify-between rounded-3xl p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-10 -z-10 h-56 w-56 rounded-full bg-fuchsia-300/40 blur-3xl"
        />
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-white/90"><span aria-hidden="true">✨</span>{label}</p>
        <div>
          <p className="mt-3 break-keep text-[30px] drop-shadow-[0_2px_10px_rgba(30,20,90,0.25)] min-[360px]:text-[32px] font-bold leading-none tracking-tight tabular-nums sm:text-[40px]">
            {value}
          </p>
          {caption && <p className="mt-2.5 text-xs font-medium text-white/80">{caption}</p>}
        </div>
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
    <div className="glass flex min-w-0 flex-col rounded-3xl p-4">
      <p className="truncate text-xs font-semibold text-ink-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1.5 break-keep text-lg font-bold leading-tight tracking-tight tabular-nums sm:text-xl ${valueColor}`}
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
}: {
  summary: SimulationResult['summary'];
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
          <span aria-hidden="true" className="text-base leading-none">
            ⚠️
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold">
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
        <div className="glass col-span-2 rounded-3xl p-4 sm:p-5 lg:col-span-4">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink-900 dark:text-white">
            <span aria-hidden="true">🎯</span> 연금저축 · ISA 만기 요약
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {summary.pensionMaturities.map((item) => (
              <div
                key={item.assetId}
                className="glass-tile rounded-2xl p-3.5"
              >
                <div className="flex items-center justify-between gap-2 text-[13px] font-semibold text-ink-900 dark:text-slate-100">
                  <span className="truncate">{item.assetName}</span>
                  <span className="shrink-0 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-400/15 dark:text-brand-300">
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
