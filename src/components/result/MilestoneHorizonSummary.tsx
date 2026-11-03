import { useMemo } from 'react';
import type { SimulationResult } from '@/types/planner';
import { formatKRWShort } from '@/utils/format';
import {
  extractAssetMilestones,
  extractHorizonSnapshots,
} from '@/utils/timeline';

interface MilestoneHorizonSummaryProps {
  rows: SimulationResult['rows'];
  start: { totalAssets: number; netWorth: number; year: number };
  selectedYearIndex: number | null;
  onSelectYear: (yearIndex: number) => void;
}

export function MilestoneHorizonSummary({
  rows,
  start,
  selectedYearIndex,
  onSelectYear,
}: MilestoneHorizonSummaryProps) {
  const milestones = useMemo(
    () => extractAssetMilestones(rows, start.netWorth),
    [rows, start.netWorth],
  );

  const snapshots = useMemo(
    () => extractHorizonSnapshots(rows, start),
    [rows, start],
  );

  return (
    <div className="space-y-3.5">
      {/* 1. 언제 얼마나 모이는지: 3대 시점별 가용 자금 & 순자산 로드맵 */}
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>🎯</span> 언제 얼마나 모일까? (핵심 시점별 예상)
            </h2>
            <p className="text-xs text-ink-500 dark:text-slate-400">
              시점 카드를 클릭하면 해당 연도의 타임라인과 상세 데이터를 바로 확인합니다.
            </p>
          </div>
          <span className="self-start rounded-full bg-ink-100 px-2.5 py-0.5 text-[11px] font-medium text-ink-600 dark:bg-slate-800 dark:text-slate-300">
            복리 운용 및 물가 반영
          </span>
        </div>

        {/* 시점 카드 그리드 */}
        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {snapshots.map((item) => {
            const isSelected = selectedYearIndex === item.yearIndex;
            const isHighlight = item.yearIndex === 5 || item.yearIndex === 3;

            return (
              <button
                key={item.yearIndex}
                type="button"
                onClick={() => onSelectYear(item.yearIndex)}
                className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-150 ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/30 dark:border-brand-400 dark:bg-brand-950/50'
                    : isHighlight
                      ? 'border-brand-200 bg-slate-50/80 hover:border-brand-300 hover:bg-brand-50/30 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600'
                      : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink-700 dark:text-slate-300">
                      {item.label}
                    </span>
                    <span className="text-[11px] font-medium text-ink-500 dark:text-slate-400">
                      {item.calendarYear}년{item.age !== null ? ` (${item.age}세)` : ''}
                    </span>
                  </div>

                  {/* 순자산 */}
                  <div className="mt-2.5">
                    <p className="text-[11px] text-ink-500 dark:text-slate-400">예상 순자산</p>
                    <p className="text-xl font-bold tracking-tight text-ink-900 dark:text-slate-100 tabular-nums">
                      {formatKRWShort(item.netWorth)}
                      <span className="ml-0.5 text-xs font-normal text-ink-500">원</span>
                    </p>
                  </div>
                </div>

                {/* 가용 현금 및 시작 대비 증가분 */}
                <div className="mt-3 border-t border-ink-100 pt-2 text-[11px] dark:border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-500 dark:text-slate-400">즉시 가용 현금</span>
                    <span className="font-semibold text-brand-700 dark:text-brand-300 tabular-nums">
                      {formatKRWShort(item.liquidAssets)}원
                    </span>
                  </div>
                  {item.yearIndex > 0 && (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-ink-500 dark:text-slate-400">현재 대비 증가</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +{formatKRWShort(item.growthFromStart)}원
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 자산 마일스톤 달성 로드맵 */}
      {milestones.length > 0 && (
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/50 via-white to-slate-50 p-4 shadow-card dark:border-emerald-950 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <span>🚀</span> 순자산 마일스톤 달성 로드맵
            </p>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              목표 도달 시점
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            {milestones.map((m) => {
              const isSelected = selectedYearIndex === m.reachedYearIndex;
              return (
                <button
                  key={m.target}
                  type="button"
                  onClick={() => onSelectYear(m.reachedYearIndex)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-xs'
                      : 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-100/60 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="font-extrabold">{m.targetLabel} 달성</span>
                  <span
                    className={`text-[11px] ${
                      isSelected
                        ? 'text-emerald-100'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    👉 {m.reachedCalendarYear}년 ({m.reachedYearIndex}년차
                    {m.reachedAge !== null ? `, ${m.reachedAge}세` : ''})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
