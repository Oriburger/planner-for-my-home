import { useEffect, useMemo, useRef } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { useSelectedYear } from '@/hooks/useSelectedYear';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore } from '@/store/uiStore';
import { analyzeGoals, goalForYear } from '@/utils/goals';
import { confetti, haptic } from '@/utils/feedback';
import { formatKRWShort } from '@/utils/format';
import { GoalRing } from './GoalRing';
import { YearBars, type YearPoint } from './YearBars';

/** 홈 상단 — 연도를 끌어 보며 순자산이 불어나는 모습을 본다 */
export function HomeHero({ onAddGoal }: { onAddGoal: () => void }) {
  const { rows, start } = useSimulation();
  const goals = usePlannerStore((s) => s.goals);
  const selectYear = useUIStore((s) => s.selectYear);
  const selected = useSelectedYear(rows);

  const points: YearPoint[] = useMemo(
    () => [
      { index: 0, year: start.year, netWorth: start.netWorth },
      ...rows.map((r) => ({ index: r.index, year: r.year, netWorth: r.netWorth })),
    ],
    [rows, start],
  );
  const current = points.find((p) => p.index === selected) ?? points[points.length - 1];
  const age = selected > 0 ? rows.find((r) => r.index === selected)?.age ?? null : null;

  const progress = useMemo(
    () => analyzeGoals(goals, rows, start.netWorth),
    [goals, rows, start.netWorth],
  );
  const target = goalForYear(progress, Math.max(1, selected));
  const ratio = target ? current.netWorth / Math.max(1, target.goal.amount) : 0;

  const value = useAnimatedNumber(current.netWorth);
  const pct = useAnimatedNumber(Math.round(ratio * 100), 600);
  const growth = current.netWorth - start.netWorth;

  // 사용자가 연도를 옮겨 목표선을 넘는 순간 축하
  const ringRef = useRef<HTMLDivElement>(null);
  const prev = useRef<{ id: string; ratio: number } | null>(null);
  useEffect(() => {
    if (!target) return;
    const p = prev.current;
    if (p && p.id === target.goal.id && p.ratio < 1 && ratio >= 1 && ringRef.current) {
      const r = ringRef.current.getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top + r.height / 2);
      haptic([12, 40, 12]);
    }
    prev.current = { id: target.goal.id, ratio };
  }, [target, ratio]);

  return (
    <section className="glass spotlight rounded-2xl p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-600 dark:text-slate-400">
            {selected === 0 ? '지금' : `${selected}년 후`} · {current.year}
            {age !== null && ` · ${age}세`}
          </p>
          <p className="mt-1.5 whitespace-nowrap text-[26px] font-semibold leading-none tracking-tight tabular-nums text-ink-900 dark:text-white min-[360px]:text-[32px] min-[400px]:text-[38px] sm:text-[48px]">
            {formatKRWShort(value)}
            <span className="ml-1 text-base font-medium text-ink-500 min-[360px]:text-lg sm:text-2xl">원</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="chip text-ink-600 dark:text-slate-300">예상 순자산</span>
            {selected > 0 && growth !== 0 && (
              <span
                className={`chip tabular-nums ${
                  growth > 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {growth > 0 ? '+' : ''}
                {formatKRWShort(growth)}
              </span>
            )}
          </div>
        </div>

        {target ? (
          <div className="-mr-1 -mt-1 flex origin-top-right flex-col items-center gap-1.5 max-[359px]:scale-[0.78]">
            <GoalRing ref={ringRef} ratio={ratio} size={96}>
              <span className="text-lg font-semibold leading-none tabular-nums text-ink-900 dark:text-white sm:text-xl">
                {Math.round(pct)}%
              </span>
              <span className="mt-1 text-[10px] font-medium text-ink-500 dark:text-slate-400">
                {formatKRWShort(target.goal.amount)}
              </span>
            </GoalRing>
            <span className="max-w-[112px] truncate text-[11px] font-medium text-ink-600 dark:text-slate-400">
              {target.goal.name}
            </span>
          </div>
        ) : (
          <button type="button" onClick={onAddGoal} className="btn-glass lift shrink-0 px-3 text-xs">
            목표 세우기
          </button>
        )}
      </div>

      <div className="mt-6">
        <YearBars
          points={points}
          selected={selected}
          onSelect={selectYear}
          goalAmount={target?.goal.amount ?? null}
          goalLabel={target ? `목표 ${formatKRWShort(target.goal.amount)}` : undefined}
        />
      </div>
    </section>
  );
}
