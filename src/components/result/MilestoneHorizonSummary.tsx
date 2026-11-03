import { useMemo } from 'react';
import type { SimulationResult } from '@/types/planner';
import { IconBadge } from '@/components/ui/Card';
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
    <div className="space-y-3">
      {/* 1. 핵심 시점별 순자산 & 가용 자금 */}
      <section className="glass rounded-3xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <IconBadge>🎯</IconBadge>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold tracking-tight text-ink-900 dark:text-white sm:text-base">
                언제 얼마나 모일까?
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-500 dark:text-slate-400">
                시점을 누르면 아래 타임라인이 그 해로 이동해요.
              </p>
            </div>
          </div>
          <span className="chip hidden text-ink-500 dark:text-slate-400 sm:inline-flex">
            복리 운용 · 물가 반영
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {snapshots.map((item) => {
            const isSelected =
              selectedYearIndex === item.yearIndex ||
              (item.yearIndex === 0 && !selectedYearIndex);
            const [title, subtitle] = splitLabel(item.label);

            return (
              <button
                key={item.yearIndex}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectYear(item.yearIndex)}
                className={`group relative flex min-w-0 flex-col rounded-2xl p-3 text-left transition-all duration-300 sm:p-3.5 ${
                  isSelected
                    ? 'bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_14px_30px_-14px_rgba(37,99,235,0.9)]'
                    : 'glass-tile-interactive hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <p
                      className={`truncate text-[13px] font-bold ${
                        isSelected ? 'text-white' : 'text-ink-800 dark:text-slate-100'
                      }`}
                    >
                      {title}
                    </p>
                    {subtitle && (
                      <p
                        className={`truncate text-[11px] ${
                          isSelected ? 'text-white/75' : 'text-ink-400 dark:text-slate-500'
                        }`}
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-ink-900/[0.05] text-ink-500 dark:bg-white/[0.06] dark:text-slate-400'
                    }`}
                  >
                    {item.calendarYear}
                    {item.age !== null ? ` · ${item.age}세` : ''}
                  </span>
                </div>

                <p
                  className={`mt-3 text-[11px] font-medium ${
                    isSelected ? 'text-white/75' : 'text-ink-500 dark:text-slate-400'
                  }`}
                >
                  예상 순자산
                </p>
                <p
                  className={`text-lg font-bold leading-tight tracking-tight tabular-nums sm:text-xl ${
                    isSelected ? 'text-white' : 'text-ink-900 dark:text-white'
                  }`}
                >
                  {formatKRWShort(item.netWorth)}
                  <span
                    className={`ml-0.5 text-xs font-medium ${
                      isSelected ? 'text-white/70' : 'text-ink-400'
                    }`}
                  >
                    원
                  </span>
                </p>

                <div
                  className={`mt-3 space-y-1 border-t pt-2 text-[11px] ${
                    isSelected ? 'border-white/20' : 'hairline'
                  }`}
                >
                  <Row
                    label="가용 현금"
                    value={`${formatKRWShort(item.liquidAssets)}원`}
                    selected={isSelected}
                    tone="brand"
                  />
                  {item.yearIndex > 0 ? (
                    <Row
                      label="현재 대비"
                      value={`+${formatKRWShort(item.growthFromStart)}원`}
                      selected={isSelected}
                      tone="good"
                    />
                  ) : (
                    <Row label="기준 시점" value="지금" selected={isSelected} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. 순자산 마일스톤 달성 시점 */}
      {milestones.length > 0 && (
        <section className="glass rounded-3xl px-4 py-3.5 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink-900 dark:text-white">
              <span aria-hidden="true">🚀</span> 순자산 마일스톤
            </p>
            <span className="text-[11px] font-medium text-ink-400 dark:text-slate-500">
              목표 도달 시점
            </span>
          </div>

          <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {milestones.map((m) => {
              const isSelected = selectedYearIndex === m.reachedYearIndex;
              return (
                <button
                  key={m.target}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectYear(m.reachedYearIndex)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-3 pr-3.5 text-xs transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_18px_-8px_rgba(5,150,105,0.8)]'
                      : 'glass-tile-interactive text-ink-700 dark:text-slate-200'
                  }`}
                >
                  <span className="font-bold">{m.targetLabel}</span>
                  <span
                    className={`tabular-nums ${
                      isSelected ? 'text-emerald-50' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {m.reachedCalendarYear}년 · {m.reachedYearIndex}년차
                    {m.reachedAge !== null ? ` · ${m.reachedAge}세` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/** '5년 후 (내 집 마련)' → ['5년 후', '내 집 마련'] */
function splitLabel(label: string): [string, string | null] {
  const match = label.match(/^(.*?)\s*\((.*)\)$/);
  return match ? [match[1], match[2]] : [label, null];
}

function Row({
  label,
  value,
  selected,
  tone,
}: {
  label: string;
  value: string;
  selected: boolean;
  tone?: 'brand' | 'good';
}) {
  const valueClass = selected
    ? 'text-white'
    : tone === 'brand'
      ? 'text-brand-700 dark:text-brand-300'
      : tone === 'good'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-ink-600 dark:text-slate-300';
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={selected ? 'text-white/70' : 'text-ink-500 dark:text-slate-400'}>
        {label}
      </span>
      <span className={`truncate font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}
