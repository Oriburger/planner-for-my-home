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
      ? 'text-[#006300]'
      : tone === 'critical'
        ? 'text-[#d03b3b]'
        : emphasis
          ? 'text-brand-700'
          : 'text-ink-900';

  return (
    <div
      className={`rounded-2xl border p-4 shadow-card ${
        emphasis
          ? 'border-brand-200 bg-gradient-to-br from-brand-50 to-white'
          : 'border-ink-200 bg-white'
      }`}
    >
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p
        className={`mt-1.5 break-keep leading-tight ${valueColor} ${
          emphasis
            ? 'text-2xl font-bold sm:text-3xl'
            : 'text-base font-bold sm:text-xl'
        }`}
      >
        {value}
        {unit && (
          <span className="ml-0.5 text-sm font-semibold text-ink-500">
            {unit}
          </span>
        )}
      </p>
      {caption && <p className="mt-1 text-[11px] text-ink-400">{caption}</p>}
    </div>
  );
}

export function SummaryCards({
  summary,
  years,
  finalYear,
}: {
  summary: SimulationResult['summary'];
  years: number;
  finalYear: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        caption="실수령액 대비"
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
    </div>
  );
}
