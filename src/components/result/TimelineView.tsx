import { useMemo } from 'react';
import type { PlannerData, SimulationResult, SimulationSummary } from '@/types/planner';
import { formatKRWShort } from '@/utils/format';
import { extractTimelineEvents, type TimelineEvent } from '@/utils/timeline';

interface TimelineViewProps {
  data: PlannerData;
  rows: SimulationResult['rows'];
  summary: SimulationSummary;
  selectedYearIndex: number | null;
  onSelectYear: (yearIndex: number) => void;
}

const BADGE_COLOR_MAP: Record<TimelineEvent['badgeColor'], { badge: string; border: string }> = {
  emerald: {
    badge: 'border border-emerald-300/60 bg-emerald-100/80 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/80 dark:text-emerald-300',
    border: 'border-emerald-300/80 dark:border-emerald-800',
  },
  blue: {
    badge: 'border border-blue-300/60 bg-brand-100/80 text-brand-900 dark:border-blue-700/60 dark:bg-brand-950/80 dark:text-brand-300',
    border: 'border-brand-300/80 dark:border-brand-800',
  },
  amber: {
    badge: 'border border-amber-300/60 bg-amber-100/80 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/80 dark:text-amber-300',
    border: 'border-amber-300/80 dark:border-amber-800',
  },
  purple: {
    badge: 'border border-purple-300/60 bg-purple-100/80 text-purple-900 dark:border-purple-700/60 dark:bg-purple-950/80 dark:text-purple-300',
    border: 'border-purple-300/80 dark:border-purple-800',
  },
  slate: {
    badge: 'border border-slate-300/60 bg-slate-100/80 text-slate-900 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-300',
    border: 'border-ink-200 dark:border-slate-700',
  },
};

export function TimelineView({
  data,
  rows,
  summary,
  selectedYearIndex,
  onSelectYear,
}: TimelineViewProps) {
  const events = useMemo(
    () => extractTimelineEvents(data, rows, summary),
    [data, rows, summary],
  );

  // 연도별로 이벤트 그룹화
  const eventsByYear = useMemo(() => {
    const map = new Map<number, TimelineEvent[]>();
    for (const e of events) {
      const list = map.get(e.yearIndex) ?? [];
      list.push(e);
      map.set(e.yearIndex, list);
    }
    return map;
  }, [events]);

  const activeRow = useMemo(() => {
    if (!selectedYearIndex) return rows[0] ?? null;
    return rows.find((r) => r.index === selectedYearIndex) ?? rows[0] ?? null;
  }, [rows, selectedYearIndex]);

  const activeEvents = useMemo(() => {
    if (!activeRow) return [];
    return eventsByYear.get(activeRow.index) ?? [];
  }, [activeRow, eventsByYear]);

  return (
    <div className="space-y-4">
      {/* 타임라인 헤더 안내 */}
      <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-slate-100">
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300">
              🗺️
            </span>
            라이프 & 머니 타임라인
          </h3>
          <p className="text-xs text-ink-500 dark:text-slate-400">
            만기, 주거 갱신, 대출 완납 및 목표 달성 이벤트를 시간 순서로 한눈에 확인합니다.
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] font-medium text-ink-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs" /> 목표/완납
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-500 shadow-xs" /> 만기/현금화
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500 shadow-xs" /> 주거 갱신
          </span>
        </div>
      </div>

      {/* 가로 스크롤 타임라인 트랙 */}
      <div className="overflow-x-auto pb-3 pt-1 thin-scrollbar">
        <div className="flex min-w-max gap-3.5 px-0.5">
          {rows.map((row) => {
            const yearEvents = eventsByYear.get(row.index) ?? [];
            const isSelected = activeRow?.index === row.index;
            const hasMilestone = yearEvents.some((e) => e.category === 'milestone');
            const hasMaturity = yearEvents.some((e) => e.category === 'maturity');

            return (
              <button
                key={row.index}
                type="button"
                onClick={() => onSelectYear(row.index)}
                className={`group relative flex w-[220px] flex-col justify-between rounded-2xl border p-4 text-left backdrop-blur-xl transition-all duration-300 ring-1 ring-inset ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/85 shadow-glass-glow ring-brand-500/40 -translate-y-1 dark:border-brand-400 dark:bg-brand-950/70'
                    : hasMilestone || hasMaturity
                      ? 'border-emerald-300/80 bg-white/75 shadow-glass ring-emerald-200/40 hover:-translate-y-1 hover:border-brand-400 dark:border-emerald-800/80 dark:bg-slate-900/65 dark:ring-emerald-900/20'
                      : 'border-white/60 bg-white/65 shadow-glass-sm ring-white/30 hover:-translate-y-1 hover:border-white/90 hover:bg-white/80 dark:border-white/10 dark:bg-slate-900/55 dark:ring-white/5'
                }`}
              >
                <div>
                  {/* 상단 연도 & 나이 */}
                  <div className="flex items-center justify-between border-b border-ink-100/60 pb-2.5 dark:border-white/10">
                    <div>
                      <span className="text-sm font-extrabold text-ink-900 dark:text-slate-100">
                        {row.year}년
                      </span>
                      <span className="ml-1 text-xs font-semibold text-ink-500 dark:text-slate-400">
                        ({row.index}년차{row.age !== null ? ` · ${row.age}세` : ''})
                      </span>
                    </div>
                    {yearEvents.length > 0 && (
                      <span className="rounded-full border border-brand-200/60 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:border-brand-800/60 dark:bg-brand-950 dark:text-brand-300">
                        {yearEvents.length}개
                      </span>
                    )}
                  </div>

                  {/* 그 해의 핵심 머니 지표 */}
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-ink-500 dark:text-slate-400">순자산</span>
                      <span className="font-extrabold text-ink-900 dark:text-slate-100 tabular-nums">
                        {formatKRWShort(row.netWorth)}원
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="text-ink-500 dark:text-slate-400">가용 현금</span>
                      <span className="font-bold text-brand-700 dark:text-brand-400 tabular-nums">
                        {formatKRWShort(row.liquidAssets)}원
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="text-ink-500 dark:text-slate-400">연간 저축</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +{formatKRWShort(row.annualSavings)}원
                      </span>
                    </div>
                  </div>
                </div>

                {/* 해당 연도 이벤트 태그 목록 */}
                <div className="mt-3 min-h-[54px] space-y-1.5 border-t border-ink-100/60 pt-2.5 dark:border-white/10">
                  {yearEvents.length === 0 ? (
                    <p className="text-[11px] italic text-ink-400 dark:text-slate-500">
                      정기 저축 및 복리 운용
                    </p>
                  ) : (
                    yearEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className={`truncate rounded-lg px-2 py-1 text-[11px] font-medium backdrop-blur-xs ${
                          BADGE_COLOR_MAP[e.badgeColor].badge
                        }`}
                        title={`${e.title}: ${e.description}`}
                      >
                        <span className="font-bold">[{e.badge}]</span> {e.title}
                      </div>
                    ))
                  )}
                  {yearEvents.length > 2 && (
                    <p className="text-[10px] font-semibold text-ink-500 dark:text-slate-400">
                      외 {yearEvents.length - 2}개 이벤트...
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 연도 인터랙티브 상세 인스펙터 */}
      {activeRow && (
        <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-4 shadow-glass backdrop-blur-2xl ring-1 ring-inset ring-white/30 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-glass-dark dark:ring-white/5">
          <div className="flex flex-col gap-2 border-b border-ink-100/60 pb-3.5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                  {activeRow.index}년차 포커스
                </span>
                <h4 className="text-base font-bold text-ink-900 dark:text-slate-100">
                  {activeRow.year}년 자산 및 이벤트 심층 브리핑
                  {activeRow.age !== null ? ` (만 ${activeRow.age}세)` : ''}
                </h4>
              </div>
              <p className="mt-1 text-xs text-ink-500 dark:text-slate-400">
                해당 시점에 모인 자산 구성과 발생할 주요 금융 이벤트를 요약합니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[11px] font-medium text-ink-500 dark:text-slate-400">예상 순자산</p>
                <p className="text-xl font-extrabold text-brand-700 dark:text-brand-300 tabular-nums">
                  {formatKRWShort(activeRow.netWorth)}원
                </p>
              </div>
            </div>
          </div>

          {/* 지표 그리드 (Liquid Glass Chips) */}
          <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/70 bg-white/70 p-3 shadow-xs backdrop-blur-md transition-all hover:border-brand-200 dark:border-white/10 dark:bg-slate-800/60">
              <p className="text-[11px] font-medium text-ink-500 dark:text-slate-400">즉시 가용 현금</p>
              <p className="mt-1 text-base font-extrabold text-brand-700 dark:text-brand-400 tabular-nums">
                {formatKRWShort(activeRow.liquidAssets)}원
              </p>
              <p className="mt-0.5 text-[10px] text-ink-400 dark:text-slate-500">
                집 매매/계약 시 바로 사용 가능
              </p>
            </div>

            <div className="rounded-xl border border-white/70 bg-white/70 p-3 shadow-xs backdrop-blur-md transition-all hover:border-brand-200 dark:border-white/10 dark:bg-slate-800/60">
              <p className="text-[11px] font-medium text-ink-500 dark:text-slate-400">묶인 자산(보증금/연금)</p>
              <p className="mt-1 text-base font-extrabold text-ink-900 dark:text-slate-100 tabular-nums">
                {formatKRWShort(activeRow.lockedAssets)}원
              </p>
              <p className="mt-0.5 text-[10px] text-ink-400 dark:text-slate-500">
                총자산 {formatKRWShort(activeRow.totalAssets)}원
              </p>
            </div>

            <div className="rounded-xl border border-white/70 bg-white/70 p-3 shadow-xs backdrop-blur-md transition-all hover:border-brand-200 dark:border-white/10 dark:bg-slate-800/60">
              <p className="text-[11px] font-medium text-ink-500 dark:text-slate-400">연간 순수 저축액</p>
              <p className="mt-1 text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{formatKRWShort(activeRow.annualSavings)}원
              </p>
              <p className="mt-0.5 text-[10px] text-ink-400 dark:text-slate-500">
                실수령 {formatKRWShort(activeRow.netIncome)}원 중 저축
              </p>
            </div>

            <div className="rounded-xl border border-white/70 bg-white/70 p-3 shadow-xs backdrop-blur-md transition-all hover:border-brand-200 dark:border-white/10 dark:bg-slate-800/60">
              <p className="text-[11px] font-medium text-ink-500 dark:text-slate-400">남은 대출 잔액</p>
              <p className="mt-1 text-base font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                {formatKRWShort(activeRow.loanBalance)}원
              </p>
              <p className="mt-0.5 text-[10px] text-ink-400 dark:text-slate-500">
                연 상환액 {formatKRWShort(activeRow.loanPayment)}원
              </p>
            </div>
          </div>

          {/* 그 해에 일어나는 이벤트 목록 */}
          <div className="mt-3.5">
            <h5 className="text-xs font-bold text-ink-800 dark:text-slate-200">
              📌 {activeRow.year}년에 일어나는 주요 이벤트
            </h5>
            {activeEvents.length === 0 ? (
              <div className="mt-2 rounded-xl border border-white/60 bg-white/50 p-3 text-xs text-ink-500 backdrop-blur-xs dark:border-white/10 dark:bg-slate-800/40 dark:text-slate-400">
                특별한 만기나 대출 변동 없이 정기적인 저축과 복리 증식이 진행되는 해입니다.
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {activeEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-2.5 rounded-xl border border-white/80 bg-white/70 p-3 shadow-xs backdrop-blur-md transition-all hover:border-brand-300 dark:border-white/10 dark:bg-slate-800/70"
                  >
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        BADGE_COLOR_MAP[e.badgeColor].badge
                      }`}
                    >
                      {e.badge}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-ink-900 dark:text-slate-100">
                        {e.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-600 dark:text-slate-400">
                        {e.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
