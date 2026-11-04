import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SimulationResult } from '@/types/planner';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatAxis } from '@/utils/format';
import { ChartTooltip } from './ChartTooltip';
import { axisTick, useChartTheme } from './chartTheme';

interface AssetChartProps {
  rows: SimulationResult['rows'];
  start: { year: number; totalAssets: number; netWorth: number };
}

/** 연도별 자산 변화 — 총자산 / 순자산 / 대출 잔액 */
export function AssetChart({ rows, start }: AssetChartProps) {
  const CHART = useChartTheme();
  const data = useMemo(
    () => [
      {
        label: '현재',
        totalAssets: start.totalAssets,
        netWorth: start.netWorth,
        loanBalance: start.totalAssets - start.netWorth,
      },
      ...rows.map((row) => ({
        label: `${row.year}`,
        totalAssets: row.totalAssets,
        netWorth: row.netWorth,
        loanBalance: row.loanBalance,
      })),
    ],
    [rows, start],
  );

  return (
    <Card>
      <CardHeader title="자산 변화" icon="trend" />
      <div className="px-1 pb-3 pt-2 pr-3 sm:px-2 sm:pr-5">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="totalAssetsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="60%" stopColor="#6366F1" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke={CHART.grid}
              strokeDasharray="0"
            />
            <XAxis
              dataKey="label"
              tick={axisTick(CHART)}
              tickLine={false}
              axisLine={{ stroke: CHART.axis }}
              minTickGap={16}
            />
            <YAxis
              tick={axisTick(CHART)}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={formatAxis}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
            />
            <Legend
              verticalAlign="top"
              height={32}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: CHART.textSecondary }}
            />

            <Area
              animationDuration={650}
              type="monotone"
              dataKey="totalAssets"
              name="총자산"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#totalAssetsFill)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: CHART.surface }}
            />
            <Line
              animationDuration={650}
              type="monotone"
              dataKey="netWorth"
              name="순자산"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: CHART.surface }}
            />
            <Line
              animationDuration={650}
              type="monotone"
              dataKey="loanBalance"
              name="대출 잔액"
              stroke="#F43F5E"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: CHART.surface }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
