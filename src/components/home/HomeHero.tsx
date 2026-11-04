import { useEffect, useMemo, useRef, useState } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { useSelectedYear } from '@/hooks/useSelectedYear';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore } from '@/store/uiStore';
import { analyzeGoals, goalForYear } from '@/utils/goals';
import { buildYearPoints } from '@/utils/accumulation';
import { confetti, haptic } from '@/utils/feedback';
import { formatKRWShort } from '@/utils/format';
import { Icon } from '@/components/ui/Icon';
import { GoalRing } from './GoalRing';
import { LAYER, YearBars } from './YearBars';

/** 홈 상단 — 내 돈이 쌓이는 모습을 크게 보여준다 */
export function HomeHero({ onAddGoal }: { onAddGoal: () => void }) {
  const { rows, start } = useSimulation();
  const goals = usePlannerStore((s) => s.goals);
  const selectYear = useUIStore((s) => s.selectYear);
  const selected = useSelectedYear(rows);

  const points = useMemo(() => buildYearPoints(rows, start), [rows, start]);
  const last = points[points.length - 1];
  const current = points.find((p) => p.index === selected) ?? last;
  const age = selected > 0 ? rows.find((r) => r.index === selected)?.age ?? null : null;

  const progress = useMemo(
    () => analyzeGoals(goals, rows, start.netWorth),
    [goals, rows, start.netWorth],
  );
  const target = goalForYear(progress, Math.max(1, selected));
  const ratio = target ? current.netWorth / Math.max(1, target.goal.amount) : 0;

  const value = useAnimatedNumber(current.netWorth);
  const savedV = useAnimatedNumber(current.saved);
  const grownV = useAnimatedNumber(current.grown);
  const pct = useAnimatedNumber(Math.round(ratio * 100), 600);

  // 물 높이 — 최종 순자산(또는 가장 큰 목표) 대비
  const scale = Math.max(last.netWorth, ...goals.map((g) => g.amount), 1);
  const level = Math.min(88, Math.max(10, (Math.max(0, current.netWorth) / scale) * 82 + 6));

  /* ---------- 앞으로 갈 때 '+금액'이 떠오른다 ---------- */
  const [bubbles, setBubbles] = useState<Array<{ id: number; text: string }>>([]);
  const prevPoint = useRef(current);
  useEffect(() => {
    const prev = prevPoint.current;
    prevPoint.current = current;
    if (current.index <= prev.index) return;
    const delta = current.netWorth - prev.netWorth;
    if (delta <= 0) return;
    const id = Date.now() + Math.random();
    setBubbles((b) => [...b.slice(-2), { id, text: `+${formatKRWShort(delta)}` }]);
    const t = window.setTimeout(() => setBubbles((b) => b.filter((x) => x.id !== id)), 1100);
    return () => window.clearTimeout(t);
  }, [current]);

  /* ---------- 목표선을 넘는 순간 축하 ---------- */
  const ringRef = useRef<HTMLDivElement>(null);
  const prevRatio = useRef<{ id: string; ratio: number } | null>(null);
  useEffect(() => {
    if (!target) return;
    const p = prevRatio.current;
    if (p && p.id === target.goal.id && p.ratio < 1 && ratio >= 1 && ringRef.current) {
      const r = ringRef.current.getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top + r.height / 2);
      haptic([12, 40, 12]);
    }
    prevRatio.current = { id: target.goal.id, ratio };
  }, [target, ratio]);

  /* ---------- ▶ 재생: 지금부터 끝까지 한 해씩 ---------- */
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const cur = useUIStore.getState().selectedYearIndex ?? selected;
      if (cur >= last.index) {
        setPlaying(false);
        return;
      }
      selectYear(cur + 1);
      haptic(4);
    }, 420);
    return () => window.clearInterval(id);
  }, [playing, last.index, selectYear, selected]);

  const togglePlay = () => {
    if (playing) return setPlaying(false);
    if (selected >= last.index) selectYear(0);
    else selectYear(selected);
    setPlaying(true);
  };

  return (
    <section className="glass spotlight relative isolate overflow-hidden rounded-2xl">
      {/* 차오르는 물 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10"
        style={{ height: `${level}%`, transition: 'height 0.8s cubic-bezier(0.2,0.8,0.2,1)' }}
      >
        <svg className="wave-a absolute -top-[14px] left-0 h-[15px] w-[200%]" viewBox="0 0 1200 30" preserveAspectRatio="none">
          <path d="M0 15 Q75 0 150 15 T300 15 T450 15 T600 15 T750 15 T900 15 T1050 15 T1200 15 V30 H0Z" className="fill-emerald-500/[0.08] dark:fill-emerald-400/[0.08]" />
        </svg>
        <svg className="wave-b absolute -top-[10px] left-0 h-[11px] w-[200%]" viewBox="0 0 1200 30" preserveAspectRatio="none">
          <path d="M0 15 Q100 30 200 15 T400 15 T600 15 T800 15 T1000 15 T1200 15 V30 H0Z" className="fill-emerald-500/[0.06] dark:fill-emerald-400/[0.06]" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.08] to-emerald-500/[0.16] dark:from-emerald-400/[0.07] dark:to-emerald-400/[0.14]" />
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="relative min-w-0">
            <p className="text-[13px] font-medium text-ink-600 dark:text-slate-400">
              {selected === 0 ? '지금' : `${selected}년 후`} · {current.year}
              {age !== null && ` · ${age}세`}
            </p>
            <p className="mt-1.5 whitespace-nowrap text-[30px] font-semibold leading-none tracking-tight tabular-nums text-ink-900 dark:text-white min-[360px]:text-[36px] min-[400px]:text-[42px] sm:text-[56px]">
              {formatKRWShort(value)}
              <span className="ml-1 text-base font-medium text-ink-500 min-[360px]:text-lg sm:text-2xl">원</span>
            </p>
            {bubbles.map((b) => (
              <span
                key={b.id}
                className="animate-float-up pointer-events-none absolute -top-2 right-0 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold tabular-nums text-white shadow-lg"
              >
                {b.text}
              </span>
            ))}

            {/* 어디서 온 돈인지 */}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              <Layer dot={LAYER.base} label="시작" value={formatKRWShort(current.base)} />
              <Layer dot={LAYER.saved} label="모은 돈" value={`+${formatKRWShort(Math.max(0, savedV))}`} />
              <Layer dot={LAYER.grown} label="불어난 돈" value={`+${formatKRWShort(Math.max(0, grownV))}`} strong />
              {target && (
                <span className="chip text-ink-700 min-[360px]:hidden dark:text-slate-300">
                  {target.goal.name} {Math.round(pct)}%
                </span>
              )}
            </div>
          </div>

          {target ? (
            <div className="-mr-1 -mt-1 flex flex-col items-center gap-1.5 max-[359px]:hidden">
              <GoalRing ref={ringRef} ratio={ratio} size={100}>
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

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={togglePlay}
            aria-pressed={playing}
            className={`${playing ? 'btn-primary' : 'btn-glass'} min-h-[2.25rem] gap-1.5 rounded-full px-3.5 text-xs`}
          >
            <Icon name={playing ? 'pause' : 'play'} className="h-3.5 w-3.5" strokeWidth={2} />
            {playing ? '멈춤' : '쌓이는 모습 보기'}
          </button>
          <span className="text-[11px] font-medium text-ink-500 dark:text-slate-500 max-[359px]:hidden">
            막대를 끌어보세요
          </span>
        </div>

        <div className="mt-6">
          <YearBars
            points={points}
            selected={selected}
            onSelect={selectYear}
            onInteract={() => setPlaying(false)}
            goalAmount={target?.goal.amount ?? null}
            goalLabel={target ? `목표 ${formatKRWShort(target.goal.amount)}` : undefined}
          />
        </div>
      </div>
    </section>
  );
}

function Layer({
  dot,
  label,
  value,
  strong,
}: {
  dot: string;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-sm ${dot}`} aria-hidden="true" />
      <span className="text-ink-600 dark:text-slate-400">{label}</span>
      <span
        className={`font-semibold tabular-nums ${
          strong ? 'text-emerald-700 dark:text-emerald-400' : 'text-ink-900 dark:text-white'
        }`}
      >
        {value}
      </span>
    </span>
  );
}
