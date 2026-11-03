import { useState } from 'react';
import type { SimulationResult } from '@/types/planner';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatKRWShort } from '@/utils/format';

const COLUMNS: Array<{
  key: keyof SimulationResult['rows'][number];
  label: string;
  tone?: 'negative';
}> = [
  { key: 'netIncome', label: '실수령' },
  { key: 'livingExpense', label: '생활비', tone: 'negative' },
  { key: 'housingCost', label: '주거비', tone: 'negative' },
  { key: 'loanPayment', label: '대출상환', tone: 'negative' },
  { key: 'annualSavings', label: '연 저축' },
  { key: 'contribution', label: '자동이체', tone: 'negative' },
  { key: 'contributionBalance', label: '남은 여유자금' },
  { key: 'investmentReturn', label: '운용수익' },
  { key: 'totalAssets', label: '총자산' },
  { key: 'loanBalance', label: '대출잔액', tone: 'negative' },
  { key: 'netWorth', label: '순자산' },
];

/**
 * 연도별 상세 표 (Liquid Glass)
 */
export function YearTable({ rows }: { rows: SimulationResult['rows'] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, 10);

  return (
    <Card>
      <CardHeader
        title="연도별 상세 데이터"
        action={
          rows.length > 10 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 rounded-xl border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-xs backdrop-blur-md transition-all hover:bg-white dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {expanded ? '접기' : `전체 ${rows.length}년 펼쳐보기`}
            </button>
          ) : undefined
        }
      />

      <div className="overflow-x-auto thin-scrollbar">
        <table className="w-full min-w-[880px] border-collapse text-right text-xs tabular-nums">
          <thead>
            <tr className="border-b border-white/40 text-ink-500 dark:border-white/10 dark:text-slate-400">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-white/90 px-3.5 py-3 text-left font-bold backdrop-blur-md dark:bg-slate-900/90"
              >
                연도
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="whitespace-nowrap px-3 py-3 font-semibold"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visible.map((row) => (
              <tr
                key={row.index}
                className="border-b border-ink-100/50 transition-colors duration-150 hover:bg-brand-50/50 dark:border-white/5 dark:hover:bg-slate-800/50"
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 whitespace-nowrap bg-white/90 px-3.5 py-2.5 text-left font-bold text-ink-800 backdrop-blur-md dark:bg-slate-900/90 dark:text-slate-200"
                >
                  {row.year}
                  <span className="ml-1 text-[11px] font-normal text-ink-400 dark:text-slate-500">
                    {row.age !== null ? `${row.age}세` : `${row.index}년차`}
                  </span>
                </th>

                {COLUMNS.map((col) => {
                  const value = row[col.key] as number;
                  const negative = col.tone === 'negative' || value < 0;
                  return (
                    <td
                      key={col.key}
                      className={`whitespace-nowrap px-3 py-2.5 font-medium ${
                        value < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : negative
                            ? 'text-ink-500 dark:text-slate-400'
                            : 'text-ink-800 dark:text-slate-200'
                      }`}
                    >
                      {col.tone === 'negative' && value > 0 ? '-' : ''}
                      {formatKRWShort(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
