import { useEffect, useMemo, useRef } from 'react';
import { useDragScroll } from '@/hooks/useDragScroll';
import type { PlannerData, SimulationResult, SimulationSummary } from '@/types/planner';
import { IconBadge } from '@/components/ui/Card';
import { formatKRWShort } from '@/utils/format';
import { extractTimelineEvents, type TimelineEvent } from '@/utils/timeline';

interface TimelineViewProps {
  data: PlannerData;
  rows: SimulationResult['rows'];
  summary: SimulationSummary;
  selectedYearIndex: number | null;
  onSelectYear: (yearIndex: number) => void;
}

const BADGE_COLOR_MAP: Record<TimelineEvent['badgeColor'], { badge: string; dot: string }> = {
  emerald: {
    badge: 'bg-accent-500/10 text-accent-700 ring-1 ring-inset ring-accent-500/20 dark:bg-accent-400/10 dark:text-accent-300 dark:ring-accent-400/20',
    dot: 'bg-accent-500',
  },
  blue: {
    badge: 'bg-brand-500/10 text-brand-700 ring-1 ring-inset ring-brand-500/20 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20',
    dot: 'bg-brand-500',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/25 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
    dot: 'bg-amber-500',
  },
  purple: {
    badge: 'bg-violet-500/10 text-violet-700 ring-1 ring-inset ring-violet-500/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20',
    dot: 'bg-violet-500',
  },
  slate: {
    badge: 'bg-ink-900/[0.05] text-ink-700 ring-1 ring-inset ring-ink-900/10 dark:bg-white/[0.06] dark:text-slate-300 dark:ring-white/10',
    dot: 'bg-ink-400',
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

  // 선택된 연도 카드가 트랙 밖에 있으면 보이도록 가로로만 스크롤한다
  const trackRef = useRef<HTMLDivElement>(null);
  useDragScroll(trackRef);
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !activeRow) return;
    const card = track.querySelector<HTMLElement>(`[data-year="${activeRow.index}"]`);
    if (!card) return;
    const offset = card.getBoundingClientRect().left - track.getBoundingClientRect().left;
    const left = track.scrollLeft + offset - track.clientWidth / 2 + card.clientWidth / 2;
    track.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [activeRow]);

  return (
    <div className="space-y-3">
      <section className="glass rounded-2xl py-4 sm:py-5">
        {/* 헤더 */}
        <div className="flex flex-col gap-2 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-start gap-3">
            <IconBadge name="timeline" />
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold tracking-tight text-ink-900 dark:text-white sm:text-base">
                타임라인
              </h3>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 pl-11 text-[11px] font-medium text-ink-600 dark:text-slate-400 sm:pl-0 sm:pt-2">
            <Legend dot="bg-accent-500" label="목표/완납" />
            <Legend dot="bg-brand-500" label="만기/현금화" />
            <Legend dot="bg-violet-500" label="주거 갱신" />
          </div>
        </div>

        {/* 가로 스크롤 타임라인 트랙 */}
        <div
          ref={trackRef}
          data-no-swipe
          className="thin-scrollbar mt-4 snap-x snap-mandatory data-[dragging=true]:snap-none lg:cursor-grab data-[dragging=true]:cursor-grabbing scroll-px-4 overflow-x-auto overscroll-x-contain pb-2 sm:scroll-px-5"
        >
          <div className="flex w-max gap-2.5 px-4 pb-1 pt-1 sm:gap-3 sm:px-5">
            {rows.map((row) => {
              const yearEvents = eventsByYear.get(row.index) ?? [];
              const isSelected = activeRow?.index === row.index;

              return (
                <button
                  key={row.index}
                  type="button"
                  data-year={row.index}
                  aria-pressed={isSelected}
                  onClick={() => onSelectYear(row.index)}
                  className={`relative flex w-[188px] shrink-0 snap-start flex-col rounded-2xl p-3.5 text-left transition-all duration-300 sm:w-[208px] ${
                    isSelected
                      ? 'selected'
                      : 'glass-tile-interactive lift'
                  }`}
                >
                  {/* 연도 & 나이 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span
                        className={`text-[15px] font-semibold tracking-tight ${
                          isSelected ? 'text-selected' : 'text-ink-900 dark:text-white'
                        }`}
                      >
                        {row.year}
                      </span>
                      <span
                        className={`ml-1.5 text-[11px] font-medium ${
                          isSelected ? 'text-selected-muted' : 'text-ink-500 dark:text-slate-500'
                        }`}
                      >
                        {row.index}년차{row.age !== null ? ` · ${row.age}세` : ''}
                      </span>
                    </div>
                    {yearEvents.length > 0 && (
                      <span className="flex shrink-0 gap-0.5" aria-label={`이벤트 ${yearEvents.length}개`}>
                        {yearEvents.slice(0, 3).map((e) => (
                          <span
                            key={e.id}
                            className={`h-1.5 w-1.5 rounded-full ${
                              isSelected ? 'bg-current' : BADGE_COLOR_MAP[e.badgeColor].dot
                            }`}
                          />
                        ))}
                      </span>
                    )}
                  </div>

                  {/* 핵심 지표 */}
                  <p
                    className={`mt-3 text-[11px] font-medium ${
                      isSelected ? 'text-selected-muted' : 'text-ink-600 dark:text-slate-400'
                    }`}
                  >
                    순자산
                  </p>
                  <p
                    className={`text-lg font-semibold leading-tight tracking-tight tabular-nums ${
                      isSelected ? 'text-selected' : 'text-ink-900 dark:text-white'
                    }`}
                  >
                    {formatKRWShort(row.netWorth)}
                    <span className={`ml-0.5 text-xs font-medium ${isSelected ? 'text-selected-muted' : 'text-ink-500'}`}>
                      원
                    </span>
                  </p>

                  <div className={`mt-2.5 space-y-1 text-[11px] ${isSelected ? 'text-selected-muted' : ''}`}>
                    <MiniRow
                      label="가용 현금"
                      value={`${formatKRWShort(row.liquidAssets)}원`}
                      selected={isSelected}
                      valueClass="text-brand-700 dark:text-brand-300"
                    />
                    <MiniRow
                      label="연간 저축"
                      value={`${row.annualSavings >= 0 ? '+' : ''}${formatKRWShort(row.annualSavings)}원`}
                      selected={isSelected}
                      valueClass={
                        row.annualSavings >= 0
                          ? 'text-accent-600 dark:text-accent-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    />
                  </div>

                  {/* 이벤트 */}
                  <div
                    className={`mt-3 min-h-[3.25rem] space-y-1 border-t pt-2.5 ${
                      isSelected ? 'border-selected-soft' : 'hairline'
                    }`}
                  >
                    {yearEvents.length === 0 ? (
                      <span
                        aria-hidden="true"
                        className={`block text-[11px] ${
                          isSelected ? 'text-selected-muted' : 'text-ink-400 dark:text-slate-600'
                        }`}
                      >
                        —
                      </span>
                    ) : (
                      yearEvents.slice(0, 2).map((e) => (
                        <p
                          key={e.id}
                          className={`truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                            isSelected ? 'bg-selected-soft text-selected' : BADGE_COLOR_MAP[e.badgeColor].badge
                          }`}
                          title={`${e.title}: ${e.description}`}
                        >
                          <span className="font-semibold">{e.badge}</span> · {e.title}
                        </p>
                      ))
                    )}
                    {yearEvents.length > 2 && (
                      <p
                        className={`text-[10px] font-semibold ${
                          isSelected ? 'text-selected-muted' : 'text-ink-500 dark:text-slate-500'
                        }`}
                      >
                        외 {yearEvents.length - 2}개
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 선택된 연도 상세 */}
      {activeRow && (
        <section className="glass rounded-2xl p-4 sm:p-5">
          {/* 한 줄 머리: 연도 · 나이 | 순자산 */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-500 dark:text-slate-400">
                {activeRow.index}년차{activeRow.age !== null && ` · ${activeRow.age}세`}
              </p>
              <h4 className="mt-0.5 text-lg font-semibold tracking-tight text-ink-900 dark:text-white">
                {activeRow.year}년
              </h4>
            </div>
            <div className="min-w-0 text-right">
              <p className="text-xs font-medium text-ink-500 dark:text-slate-400">순자산</p>
              <p className="mt-0.5 truncate text-xl font-semibold leading-tight tracking-tight tabular-nums text-ink-900 dark:text-white sm:text-[26px]">
                {formatKRWShort(activeRow.netWorth)}원
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 min-[340px]:grid-cols-2 sm:gap-3 md:grid-cols-4">
            <Metric
              label="즉시 가용 현금"
              value={`${formatKRWShort(activeRow.liquidAssets)}원`}
              caption="매매·계약 시 바로 사용"
              valueClass="text-brand-700 dark:text-brand-300"
            />
            <Metric
              label="묶인 자산"
              value={`${formatKRWShort(activeRow.lockedAssets)}원`}
              caption={`총자산 ${formatKRWShort(activeRow.totalAssets)}원`}
            />
            <Metric
              label="연간 순저축"
              value={`${activeRow.annualSavings >= 0 ? '+' : ''}${formatKRWShort(activeRow.annualSavings)}원`}
              caption={`실수령 ${formatKRWShort(activeRow.netIncome)}원`}
              valueClass={
                activeRow.annualSavings >= 0
                  ? 'text-accent-600 dark:text-accent-400'
                  : 'text-rose-600 dark:text-rose-400'
              }
            />
            <Metric
              label="남은 대출"
              value={`${formatKRWShort(activeRow.loanBalance)}원`}
              caption={`연 상환 ${formatKRWShort(activeRow.loanPayment)}원`}
              valueClass="text-rose-600 dark:text-rose-400"
            />
          </div>

          <div className="mt-5">
            <h5 className="eyebrow px-0.5">이벤트</h5>
            {activeEvents.length === 0 ? (
              <p className="callout-muted mt-2">
                이 해에는 특별한 이벤트가 없어요.
              </p>
            ) : (
              <ul className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                {activeEvents.map((e) => (
                  <li key={e.id} className="glass-tile flex items-start gap-3 rounded-2xl p-3">
                    <span
                      className={`mt-px shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        BADGE_COLOR_MAP[e.badgeColor].badge
                      }`}
                    >
                      {e.badge}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink-900 dark:text-white">{e.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-600 dark:text-slate-400">
                        {e.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function MiniRow({
  label,
  value,
  selected,
  valueClass,
}: {
  label: string;
  value: string;
  selected: boolean;
  valueClass: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={selected ? 'text-selected-muted' : 'text-ink-600 dark:text-slate-400'}>{label}</span>
      <span className={`truncate font-semibold tabular-nums ${selected ? 'text-selected' : valueClass}`}>
        {value}
      </span>
    </div>
  );
}

function Metric({
  label,
  value,
  caption,
  valueClass = 'text-ink-900 dark:text-white',
}: {
  label: string;
  value: string;
  caption: string;
  valueClass?: string;
}) {
  return (
    <div className="glass-tile min-w-0 rounded-2xl p-3 sm:p-3.5">
      <p className="truncate text-[11px] font-medium text-ink-600 dark:text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-base font-semibold tracking-tight tabular-nums sm:text-lg ${valueClass}`}>
        {value}
      </p>
      <p className="mt-0.5 truncate text-[10px] text-ink-500 dark:text-slate-500 sm:text-[11px]">
        {caption}
      </p>
    </div>
  );
}
