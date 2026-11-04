import { useEffect, useRef, useState } from 'react';
import { formatKRWShort } from '@/utils/format';
import { haptic } from '@/utils/feedback';

export interface YearPoint {
  index: number;
  year: number;
  netWorth: number;
}

interface YearBarsProps {
  points: YearPoint[];
  selected: number;
  onSelect: (index: number) => void;
  /** 비교할 목표 금액 (점선) */
  goalAmount?: number | null;
  goalLabel?: string;
}

/**
 * 연도별 순자산 막대 — 그 자체가 스크러버.
 * PC: 호버로 미리보기, 클릭·드래그로 선택 / 모바일: 터치한 채 좌우로 밀어 선택.
 */
export function YearBars({ points, selected, onSelect, goalAmount, goalLabel }: YearBarsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const dragging = useRef(false);
  const lastIdx = useRef(selected);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = Math.max(1, ...points.map((p) => p.netWorth), goalAmount ?? 0) * 1.08;
  const n = points.length;
  const lastIndex = points[n - 1]?.index ?? 0;

  const indexAt = (clientX: number) => {
    const el = ref.current;
    if (!el) return selected;
    const r = el.getBoundingClientRect();
    const i = Math.floor(((clientX - r.left) / r.width) * n);
    return points[Math.max(0, Math.min(n - 1, i))].index;
  };

  const choose = (idx: number, touch: boolean) => {
    if (idx === lastIdx.current) return;
    lastIdx.current = idx;
    onSelect(idx);
    if (touch) haptic(6);
  };

  const shown = hover ?? null;
  const shownPoint = shown !== null ? points.find((p) => p.index === shown) : null;
  const shownPos = shown !== null ? points.findIndex((p) => p.index === shown) : -1;

  return (
    <div data-no-swipe>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="연도 선택"
        aria-valuemin={0}
        aria-valuemax={lastIndex}
        aria-valuenow={selected}
        aria-valuetext={`${points.find((p) => p.index === selected)?.year ?? ''}년`}
        className="relative h-28 cursor-pointer touch-pan-y select-none rounded-lg outline-offset-4 sm:h-32"
        onPointerDown={(e) => {
          dragging.current = true;
          lastIdx.current = selected;
          e.currentTarget.setPointerCapture(e.pointerId);
          choose(indexAt(e.clientX), e.pointerType !== 'mouse');
        }}
        onPointerMove={(e) => {
          const idx = indexAt(e.clientX);
          if (dragging.current) choose(idx, e.pointerType !== 'mouse');
          else if (e.pointerType === 'mouse') setHover(idx);
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        onMouseLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            onSelect(Math.min(lastIndex, selected + 1));
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onSelect(Math.max(0, selected - 1));
          }
        }}
      >
        {/* 목표선 */}
        {goalAmount ? (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-emerald-600/70 transition-[bottom] duration-500 dark:border-emerald-400/70"
            style={{ bottom: `${(goalAmount / max) * 100}%` }}
          >
            <span className="absolute -top-[18px] right-0 rounded bg-emerald-600 px-1.5 py-px text-[10px] font-semibold text-white dark:bg-emerald-500">
              {goalLabel ?? formatKRWShort(goalAmount)}
            </span>
          </div>
        ) : null}

        <div className="flex h-full items-end gap-[3px]">
          {points.map((p, i) => {
            const isSel = p.index === selected;
            const reached = goalAmount ? p.netWorth >= goalAmount : false;
            const past = p.index < selected;
            const h = Math.max(2, (Math.max(0, p.netWorth) / max) * 100);
            return (
              <div
                key={p.index}
                className={`flex-1 rounded-t-[3px] ${
                  isSel
                    ? 'bg-ink-900 dark:bg-white'
                    : reached
                      ? past
                        ? 'bg-emerald-500/70'
                        : 'bg-emerald-500/30'
                      : past
                        ? 'bg-ink-900/35 dark:bg-white/35'
                        : 'bg-ink-900/[0.12] dark:bg-white/[0.12]'
                } ${hover === p.index && !isSel ? 'brightness-90 dark:brightness-125' : ''}`}
                style={{
                  height: mounted ? `${h}%` : '0%',
                  transition: 'height 0.6s cubic-bezier(0.2,0.8,0.2,1), background-color 0.2s',
                  transitionDelay: `${i * 18}ms, 0ms`,
                }}
              />
            );
          })}
        </div>

        {/* 호버 미리보기 */}
        {shownPoint && shownPos >= 0 && (
          <div
            className="pointer-events-none absolute -top-8 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg dark:bg-white dark:text-ink-900"
            style={{ left: `${((shownPos + 0.5) / n) * 100}%` }}
          >
            {shownPoint.year} · {formatKRWShort(shownPoint.netWorth)}
          </div>
        )}
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] font-medium tabular-nums text-ink-500 dark:text-slate-500">
        <span>지금</span>
        <span>{points[n - 1]?.year}</span>
      </div>
    </div>
  );
}
