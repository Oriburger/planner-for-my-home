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
  { key: 'investmentReturn', label: '운용수익' },
  { key: 'totalAssets', label: '총자산' },
  { key: 'loanBalance', label: '대출잔액', tone: 'negative' },
  { key: 'netWorth', label: '순자산' },
];

/**
 * 연도별 상세 표.
 * 차트 색만으로 값을 읽지 않아도 되도록 항상 제공하는 대체 뷰이기도 하다.
 */
export function YearTable({ rows }: { rows: SimulationResult['rows'] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, 10);

  return (
    <Card>
      <CardHeader
        title="연도별 상세"
        description="가로로 스크롤해서 항목별 금액을 확인할 수 있어요."
        action={
          rows.length > 10 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 rounded-lg bg-ink-100 px-2.5 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-200"
            >
              {expanded ? '접기' : `전체 ${rows.length}년 보기`}
            </button>
          ) : undefined
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-right text-xs tabular-nums">
          <thead>
            <tr className="border-b border-ink-200 text-ink-500 dark:border-slate-800 dark:text-slate-400">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-white px-3 py-2.5 text-left font-medium dark:bg-slate-900"
              >
                연도
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="whitespace-nowrap px-3 py-2.5 font-medium"
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
                className="border-b border-ink-100 last:border-0 hover:bg-brand-50/40 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2.5 text-left font-semibold text-ink-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  {row.year}
                  <span className="ml-1 font-normal text-ink-400 dark:text-slate-500">
                    {row.age !== null ? `${row.age}세` : `${row.index}년차`}
                  </span>
                </th>

                {COLUMNS.map((col) => {
                  const value = row[col.key] as number;
                  const negative = col.tone === 'negative' || value < 0;
                  return (
                    <td
                      key={col.key}
                      className={`whitespace-nowrap px-3 py-2.5 ${
                        value < 0
                          ? 'text-[#d03b3b] dark:text-red-400'
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
