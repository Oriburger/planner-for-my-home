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

/** 연도별 상세 표 */
export function YearTable({ rows }: { rows: SimulationResult['rows'] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, 10);

  return (
    <Card>
      <CardHeader
        title="연도별 상세 데이터"
        description="단위: 원 · 가로로 스크롤해 모든 항목을 볼 수 있어요"
        icon="table"
        action={
          rows.length > 10 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="btn-glass shrink-0 px-3 text-xs"
            >
              {expanded ? '접기' : `전체 ${rows.length}년`}
            </button>
          ) : undefined
        }
      />

      <div className="thin-scrollbar mt-3 overflow-x-auto overscroll-x-contain pb-2">
        <table className="w-full min-w-[920px] border-collapse text-right text-xs tabular-nums">
          <thead>
            <tr className="hairline border-y text-ink-500 dark:text-slate-400">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-[#f3f6fb] px-4 py-3 text-left font-semibold dark:bg-[#141c2d] sm:px-5"
              >
                연도
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="whitespace-nowrap px-3 py-3 font-semibold last:pr-5"
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
                className="hairline group border-b transition-colors duration-150 last:border-b-0 hover:bg-brand-500/[0.04] dark:hover:bg-white/[0.03]"
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 whitespace-nowrap bg-[#f3f6fb] px-4 py-2.5 text-left font-bold text-ink-800 dark:bg-[#141c2d] dark:text-slate-200 sm:px-5"
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
                      className={`whitespace-nowrap px-3 py-2.5 font-medium last:pr-5 ${
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
