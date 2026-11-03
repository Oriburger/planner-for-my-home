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
      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-4 shadow-glass backdrop-blur-2xl ring-1 ring-inset ring-white/30 dark:border-white/10 dark:bg-slate-900/65 dark:shadow-glass-dark dark:ring-white/5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-slate-100">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300">
                🎯
              </span>
              언제 얼마나 모일까? (핵심 시점별 예상 로드맵)
            </h2>
            <p className="text-xs text-ink-500 dark:text-slate-400">
              시점 카드를 클릭하면 해당 연도의 타임라인과 상세 데이터를 즉시 확인합니다.
            </p>
          </div>
          <span className="self-start rounded-full border border-white/60 bg-white/60 px-2.5 py-0.5 text-[11px] font-semibold text-ink-600 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-300">
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
                className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left backdrop-blur-md transition-all duration-300 ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/80 shadow-glass-glow ring-2 ring-brand-500/40 dark:border-brand-400 dark:bg-brand-950/70 -translate-y-0.5'
                    : isHighlight
                      ? 'border-white/80 bg-white/75 hover:border-brand-300 hover:bg-white hover:-translate-y-0.5 hover:shadow-glass dark:border-white/10 dark:bg-slate-800/60 dark:hover:border-slate-600'
                      : 'border-white/60 bg-white/60 hover:border-white/90 hover:bg-white/80 hover:-translate-y-0.5 hover:shadow-glass-sm dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink-800 dark:text-slate-200">
                      {item.label}
                    </span>
                    <span className="rounded-md bg-ink-100/70 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500 dark:bg-slate-800 dark:text-slate-400">
                      {item.calendarYear}년{item.age !== null ? ` · ${item.age}세` : ''}
                    </span>
                  </div>

                  {/* 순자산 */}
                  <div className="mt-2.5">
                    <p className="text-[11px] font-medium text-ink-500 dark:text-slate-400">예상 순자산</p>
                    <p className="text-xl font-extrabold tracking-tight text-ink-900 dark:text-slate-100 tabular-nums">
                      {formatKRWShort(item.netWorth)}
                      <span className="ml-0.5 text-xs font-normal text-ink-500">원</span>
                    </p>
                  </div>
                </div>

                {/* 가용 현금 및 시작 대비 증가분 */}
                <div className="mt-3 border-t border-ink-100/60 pt-2 text-[11px] dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-500 dark:text-slate-400">즉시 가용 현금</span>
                    <span className="font-bold text-brand-700 dark:text-brand-300 tabular-nums">
                      {formatKRWShort(item.liquidAssets)}원
                    </span>
                  </div>
                  {item.yearIndex > 0 && (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-ink-500 dark:text-slate-400">현재 대비 증가</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
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
        <div className="relative overflow-hidden rounded-2xl border border-emerald-300/60 bg-gradient-to-r from-emerald-50/70 via-white/70 to-slate-50/70 p-4 shadow-glass backdrop-blur-2xl ring-1 ring-inset ring-emerald-200/40 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-slate-900/70 dark:to-slate-900/70 dark:ring-emerald-800/20">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
              <span className="text-sm">🚀</span> 순자산 마일스톤 달성 로드맵
            </p>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
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
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs backdrop-blur-sm transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-600 text-white font-bold shadow-glass-emerald -translate-y-0.5'
                      : 'border-emerald-200/80 bg-white/80 text-emerald-900 hover:bg-emerald-100/70 hover:border-emerald-300 dark:border-emerald-800/80 dark:bg-slate-900/80 dark:text-emerald-300 dark:hover:bg-slate-800'
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
