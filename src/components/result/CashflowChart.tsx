import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SimulationResult } from '@/types/planner';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatAxis } from '@/utils/format';
import { ChartTooltip } from './ChartTooltip';
import { CHART, SERIES, axisTick } from './chartTheme';

/** 실수령액이 어디로 흘러가는지 — 연도별 누적 막대 */
export function CashflowChart({ rows }: { rows: SimulationResult['rows'] }) {
  const data = useMemo(
    () =>
      rows.map((row) => ({
        label: `${row.year}`,
        livingExpense: row.livingExpense,
        housingCost: row.housingCost,
        loanPayment: row.loanPayment,
        // 적자인 해는 0으로 눕혀 막대가 뒤집히지 않게 한다 (표에서 실제 값 확인)
        annualSavings: Math.max(0, row.annualSavings),
      })),
    [rows],
  );

  return (
    <Card>
      <CardHeader
        title="연간 현금흐름"
        description="실수령액이 지출·주거비·대출 상환을 거쳐 얼마가 남는지 보여줍니다."
      />
      <div className="px-1 py-4 pr-3 sm:px-2 sm:pr-5">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis
              dataKey="label"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: CHART.axis }}
              minTickGap={16}
            />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={formatAxis}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
            />
            <Legend
              verticalAlign="top"
              height={32}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: CHART.textSecondary }}
            />

            {/* stroke 를 표면색으로 주어 스택 세그먼트 사이 2px 간격을 만든다 */}
            <Bar
              dataKey="livingExpense"
              name="생활비"
              stackId="flow"
              fill={SERIES.slot2}
              stroke={CHART.surface}
              strokeWidth={2}
            />
            <Bar
              dataKey="housingCost"
              name="주거비"
              stackId="flow"
              fill={SERIES.slot3}
              stroke={CHART.surface}
              strokeWidth={2}
            />
            <Bar
              dataKey="loanPayment"
              name="대출 상환"
              stackId="flow"
              fill={SERIES.slot4}
              stroke={CHART.surface}
              strokeWidth={2}
            />
            <Bar
              dataKey="annualSavings"
              name="저축"
              stackId="flow"
              fill={SERIES.slot1}
              stroke={CHART.surface}
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
