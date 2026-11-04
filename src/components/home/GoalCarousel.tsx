import { useMemo, useRef } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { useSelectedYear } from '@/hooks/useSelectedYear';
import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore } from '@/store/uiStore';
import { analyzeGoals, goalForYear, type GoalProgress } from '@/utils/goals';
import { formatKRWShort } from '@/utils/format';
import { Icon } from '@/components/ui/Icon';

const STATUS: Record<GoalProgress['status'], { tone: string }> = {
  done: { tone: 'text-accent-700 bg-accent-500/10 dark:text-accent-400' },
  onTrack: { tone: 'text-accent-700 bg-accent-500/10 dark:text-accent-400' },
  late: { tone: 'text-amber-700 bg-amber-500/15 dark:text-amber-400' },
  miss: { tone: 'text-rose-700 bg-rose-500/10 dark:text-rose-400' },
  beyond: { tone: 'text-ink-600 bg-ink-900/[0.06] dark:text-slate-400 dark:bg-white/[0.06]' },
};

function statusLabel(p: GoalProgress) {
  switch (p.status) {
    case 'done':
      return '달성';
    case 'onTrack':
      return p.yearsDiff !== null && p.yearsDiff < 0 ? `${-p.yearsDiff}년 빨리` : '달성 예상';
    case 'late':
      return `${p.yearsDiff}년 늦게`;
    case 'miss':
      return `${formatKRWShort(p.shortfall)} 부족`;
    default:
      return '기간 밖';
  }
}

/** 목표 카드 — 가로로 밀거나(모바일) 끌어서(PC) 넘겨본다 */
export function GoalCarousel({ onEdit }: { onEdit: () => void }) {
  const { rows, start } = useSimulation();
  const goals = usePlannerStore((s) => s.goals);
  const startYear = usePlannerStore((s) => s.settings.startYear);
  const selectYear = useUIStore((s) => s.selectYear);
  const selected = useSelectedYear(rows);
  const trackRef = useRef<HTMLDivElement>(null);

  const progress = useMemo(
    () => analyzeGoals(goals, rows, start.netWorth),
    [goals, rows, start.netWorth],
  );
  const active = goalForYear(progress, Math.max(1, selected));
  const lastIndex = rows[rows.length - 1].index;
  const doneCount = progress.filter((p) => p.status === 'done' || p.status === 'onTrack').length;

  return (
    <section className="glass rounded-2xl py-4">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink-900 dark:text-white">목표</h2>
          {progress.length > 0 && (
            <span className="text-xs font-medium tabular-nums text-ink-500 dark:text-slate-400">
              {doneCount}/{progress.length} 달성 예상
            </span>
          )}
        </div>
        <button type="button" onClick={onEdit} className="btn-glass min-h-[2rem] px-3 text-xs">
          편집
        </button>
      </div>

      {/* 목록이 바뀌면 다시 마운트 — 스냅이 '추가' 카드에 붙어 끝으로 밀리는 것을 막는다 */}
      <div
        key={progress.map((p) => p.goal.id).join('|')}
        ref={trackRef}
        data-no-swipe
        className="no-scrollbar mt-3 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto overscroll-x-contain px-4 pb-1 pt-1 sm:scroll-px-5 sm:px-5 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] lg:overflow-visible"
      >
        {progress.map((p) => {
          const isActive = active?.goal.id === p.goal.id;
          const cur = Math.min(1, p.currentRatio);
          const proj = Math.min(1, p.status === 'beyond' ? 0 : p.projectedRatio);
          return (
            <button
              key={p.goal.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => selectYear(Math.min(lastIndex, p.goal.yearIndex))}
              className={`glass-tile lift flex w-[208px] shrink-0 snap-start flex-col rounded-xl p-3.5 text-left lg:w-auto ${
                isActive ? 'ring-2 ring-ink-900 dark:ring-white' : ''
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-ink-800 dark:text-slate-200">
                  {p.goal.name}
                </span>
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${STATUS[p.status].tone}`}>
                  {statusLabel(p)}
                </span>
              </div>
              <p className="mt-2 text-xl font-semibold tracking-tight tabular-nums text-ink-900 dark:text-white">
                {formatKRWShort(p.goal.amount)}
              </p>
              <p className="text-[11px] font-medium tabular-nums text-ink-500 dark:text-slate-400">
                {startYear + p.goal.yearIndex - 1}년 · {p.goal.yearIndex}년차
              </p>

              {/* 지금(진한) → 목표 연도 예상(연한) */}
              <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-900/[0.08] dark:bg-white/10">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ${
                    proj >= 1 ? 'bg-accent-500/40' : 'bg-ink-900/25 dark:bg-white/30'
                  }`}
                  style={{ width: `${proj * 100}%` }}
                />
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-ink-900 transition-[width] duration-700 dark:bg-white"
                  style={{ width: `${cur * 100}%` }}
                />
              </div>
              <p className="mt-1.5 flex justify-between text-[10px] font-medium tabular-nums text-ink-500 dark:text-slate-400">
                <span>지금 {Math.round(p.currentRatio * 100)}%</span>
                {p.status !== 'beyond' && <span>예상 {Math.round(p.projectedRatio * 100)}%</span>}
              </p>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onEdit}
          className="lift flex min-h-[8.5rem] w-[140px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-xl border border-dashed lg:w-auto border-ink-900/20 text-xs font-medium text-ink-600 hover:border-ink-900/40 dark:border-white/20 dark:text-slate-400"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/[0.06] dark:bg-white/[0.08]">
            <Icon name="plus" className="h-4 w-4" />
          </span>
          목표 추가
        </button>
      </div>
    </section>
  );
}
