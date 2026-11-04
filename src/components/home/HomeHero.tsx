import { useEffect, useMemo, useRef, useState } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { useSelectedYear } from '@/hooks/useSelectedYear';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore } from '@/store/uiStore';
import { analyzeGoals, goalForYear } from '@/utils/goals';
import { buildYearPoints } from '@/utils/accumulation';
import { haptic } from '@/utils/feedback';
import { formatKRWShort } from '@/utils/format';
import { Icon } from '@/components/ui/Icon';
import { GoalRing } from './GoalRing';
import { GrowthChart, LAYER } from './GrowthChart';

/** 홈 상단 — 시간이 흐르며 내 돈이 차곡차곡 쌓이는 모습 */
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

  const value = useAnimatedNumber(current.netWorth, 800);
  const savedV = useAnimatedNumber(current.saved, 800);
  const grownV = useAnimatedNumber(current.grown, 800);
  const pct = useAnimatedNumber(Math.round(ratio * 100), 700);

  /* 앞으로 나아갈 때 늘어난 만큼을 조용히 보여준다 */
  const [delta, setDelta] = useState<{ id: number; value: number } | null>(null);
  const prevPoint = useRef(current);
  useEffect(() => {
    const prev = prevPoint.current;
    prevPoint.current = current;
    if (current.index <= prev.index) return;
    const d = current.netWorth - prev.netWorth;
    if (d <= 0) return;
    const id = Date.now();
    setDelta({ id, value: d });
    const t = window.setTimeout(() => setDelta((x) => (x?.id === id ? null : x)), 1600);
    return () => window.clearTimeout(t);
  }, [current]);

  /* 목표선을 넘는 순간 — 링이 한 번 은은하게 빛난다 */
  const [celebrate, setCelebrate] = useState(false);
  const prevRatio = useRef<{ id: string; ratio: number } | null>(null);
  useEffect(() => {
    if (!target) return;
    const p = prevRatio.current;
    prevRatio.current = { id: target.goal.id, ratio };
    if (p && p.id === target.goal.id && p.ratio < 1 && ratio >= 1) {
      setCelebrate(true);
      haptic([10, 50, 18]);
      const t = window.setTimeout(() => setCelebrate(false), 1400);
      return () => window.clearTimeout(t);
    }
  }, [target, ratio]);

  /* ▶ 재생 — 지금부터 끝까지 한 해씩 */
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const cur = useUIStore.getState().selectedYearIndex ?? 0;
      if (cur >= last.index) {
        setPlaying(false);
        return;
      }
      selectYear(cur + 1);
    }, 650);
    return () => window.clearInterval(id);
  }, [playing, last.index, selectYear]);

  const togglePlay = () => {
    if (playing) return setPlaying(false);
    selectYear(selected >= last.index ? 0 : selected);
    setPlaying(true);
  };

  const ring = target ? (
    <div className="flex flex-col items-center gap-2 [grid-area:ring]">
      <GoalRing ratio={ratio} size={96} celebrate={celebrate}>
        <span className="text-[19px] font-semibold leading-none tracking-tight tabular-nums text-ink-900 dark:text-white">
          {Math.round(pct)}
          <span className="text-xs font-medium text-ink-500">%</span>
        </span>
        <span className="mt-1 text-[10px] font-medium tabular-nums text-ink-500 dark:text-slate-400">
          {formatKRWShort(target.goal.amount)}
        </span>
      </GoalRing>
      <span className="max-w-[120px] truncate text-[11px] font-medium text-ink-600 dark:text-slate-400">
        {target.goal.name}
      </span>
    </div>
  ) : (
    <button
      type="button"
      onClick={onAddGoal}
      className="btn-glass lift self-start px-3 text-xs [grid-area:ring]"
    >
      목표 세우기
    </button>
  );

  return (
    <section className="glass spotlight hero-surface relative isolate overflow-hidden rounded-2xl">
      <div className="p-5 sm:p-7">
        {/*
          모바일: 금액이 한 줄을 통째로 쓰고 링은 구성 옆으로
          sm 이상: 금액·구성 | 링
        */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-4 [grid-template-areas:'amount_amount''layers_ring'] sm:[grid-template-areas:'amount_ring''layers_ring']">
          <div className="min-w-0 [grid-area:amount]">
            <p className="flex items-center gap-2 text-[13px] font-medium text-ink-500 dark:text-slate-400">
              <span>
                {selected === 0 ? '지금' : `${selected}년 후`} · {current.year}
                {age !== null && ` · ${age}세`}
              </span>
              {delta && (
                <span
                  key={delta.id}
                  className="animate-delta font-semibold tabular-nums text-accent-600 dark:text-accent-400"
                >
                  +{formatKRWShort(delta.value)}
                </span>
              )}
            </p>
            <p className="hero-amount mt-2 whitespace-nowrap font-semibold leading-none tabular-nums text-ink-900 dark:text-white">
              {formatKRWShort(value)}
              <span className="ml-1.5 text-[0.42em] font-medium tracking-normal text-ink-400 dark:text-slate-500">
                원
              </span>
            </p>
          </div>

          <dl className="flex min-w-0 flex-col justify-center gap-1.5 text-[13px] [grid-area:layers] sm:flex-row sm:flex-wrap sm:items-center sm:justify-start sm:gap-x-5">
            <Layer dot={LAYER.base} label="시작" value={formatKRWShort(current.base)} />
            <Layer dot={LAYER.saved} label="모은 돈" value={`+${formatKRWShort(Math.max(0, savedV))}`} />
            <Layer
              dot={LAYER.grown}
              label="불어난 돈"
              value={`+${formatKRWShort(Math.max(0, grownV))}`}
              accent
            />
          </dl>

          {ring}
        </div>

        <div className="mt-3 sm:mt-6">
          <GrowthChart
            points={points}
            selected={selected}
            onSelect={selectYear}
            onInteract={() => setPlaying(false)}
            goalAmount={target?.goal.amount ?? null}
            goalLabel={target ? `목표 ${formatKRWShort(target.goal.amount)}` : undefined}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-pressed={playing}
            className="group inline-flex items-center gap-2.5 text-[13px] font-medium text-ink-700 dark:text-slate-200"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 group-active:scale-90 ${
                playing
                  ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                  : 'bg-ink-900/[0.06] text-ink-800 group-hover:bg-ink-900/[0.1] dark:bg-white/10 dark:text-white'
              }`}
            >
              <Icon name={playing ? 'pause' : 'play'} className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            {playing ? '재생 중' : '시간 흐름 재생'}
          </button>
          <span className="text-[11px] text-ink-500 dark:text-slate-500">그래프를 끌어 연도 이동</span>
        </div>
      </div>
    </section>
  );
}

function Layer({
  dot,
  label,
  value,
  accent,
}: {
  dot: string;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <dt className="flex items-center gap-1.5 text-ink-500 dark:text-slate-400">
        <span className={`h-2 w-2 rounded-full ring-1 ring-inset ring-ink-900/15 dark:ring-white/15 ${dot}`} aria-hidden="true" />
        {label}
      </dt>
      <dd
        className={`font-semibold tabular-nums ${
          accent ? 'text-accent-700 dark:text-accent-400' : 'text-ink-900 dark:text-white'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
