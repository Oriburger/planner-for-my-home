import { useEffect, useRef, useState } from 'react';
import { formatKRWShort } from '@/utils/format';
import { haptic } from '@/utils/feedback';
import { stackLayers, type YearPoint } from '@/utils/accumulation';

interface YearBarsProps {
  points: YearPoint[];
  selected: number;
  onSelect: (index: number) => void;
  /** 사용자가 직접 고르기 시작할 때 (재생 중지 등) */
  onInteract?: () => void;
  goalAmount?: number | null;
  goalLabel?: string;
}

/** 층 색 — 시작 자산 / 내가 모은 돈 / 불어난 돈 (범례용 = 선택 상태) */
export const LAYER = {
  base: 'bg-ink-400 dark:bg-slate-500',
  saved: 'bg-ink-900 dark:bg-white',
  grown: 'bg-emerald-500',
};

/** 막대 상태별 단색 — 투명도를 쓰지 않아 배경과 섞여 탁해지지 않는다 */
const TONES = {
  selected: LAYER,
  past: {
    base: 'bg-ink-300 dark:bg-slate-600',
    saved: 'bg-ink-600 dark:bg-slate-300',
    grown: 'bg-emerald-400 dark:bg-emerald-500/80',
  },
  future: {
    base: 'bg-ink-200 dark:bg-slate-700',
    saved: 'bg-ink-400 dark:bg-slate-500',
    grown: 'bg-emerald-200 dark:bg-emerald-800',
  },
};

/**
 * 연도별 순자산을 세 층으로 쌓은 막대 — 그 자체가 스크러버.
 * PC: 호버 미리보기·클릭·드래그·방향키 / 모바일: 터치한 채 좌우로 밀기.
 */
export function YearBars({
  points,
  selected,
  onSelect,
  onInteract,
  goalAmount,
  goalLabel,
}: YearBarsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const dragging = useRef(false);
  const lastIdx = useRef(selected);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = Math.max(1, ...points.map((p) => p.netWorth), goalAmount ?? 0) * 1.06;
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

  const hoverPos = hover !== null ? points.findIndex((p) => p.index === hover) : -1;
  const hoverPoint = hoverPos >= 0 ? points[hoverPos] : null;

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
        className="relative h-36 cursor-pointer touch-pan-y select-none rounded-lg outline-offset-4 sm:h-44"
        onPointerDown={(e) => {
          onInteract?.();
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
            onInteract?.();
            onSelect(Math.min(lastIndex, selected + 1));
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onInteract?.();
            onSelect(Math.max(0, selected - 1));
          }
        }}
      >
        {goalAmount ? (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-emerald-600 transition-[bottom] duration-500 dark:border-emerald-400"
            style={{ bottom: `${(goalAmount / max) * 100}%` }}
          >
            <span className="absolute -top-[18px] right-0 rounded bg-emerald-600 px-1.5 py-px text-[10px] font-semibold text-white dark:bg-emerald-500">
              {goalLabel ?? formatKRWShort(goalAmount)}
            </span>
          </div>
        ) : null}

        <div className="flex h-full items-end gap-[3px] sm:gap-1">
          {points.map((p, i) => {
            const isSel = p.index === selected;
            const l = stackLayers(p);
            const h = Math.max(2, (l.total / max) * 100);
            const tone = isSel ? TONES.selected : p.index < selected ? TONES.past : TONES.future;
            return (
              <div
                key={p.index}
                className={`relative flex flex-1 flex-col-reverse overflow-hidden rounded-t-[4px] ${
                  hover === p.index && !isSel ? 'brightness-95 dark:brightness-125' : ''
                }`}
                style={{
                  height: mounted ? `${h}%` : '0%',
                  transition: 'height 0.7s cubic-bezier(0.2,0.8,0.2,1)',
                  transitionDelay: `${i * 22}ms`,
                }}
              >
                <span className={`${tone.base} transition-colors`} style={{ height: `${(l.base / (l.total || 1)) * 100}%` }} />
                <span className={`${tone.saved} transition-colors`} style={{ height: `${(l.saved / (l.total || 1)) * 100}%` }} />
                <span className={`${tone.grown} transition-colors`} style={{ height: `${(l.grown / (l.total || 1)) * 100}%` }} />
                {isSel && (
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-white/70 dark:bg-ink-900/40" />
                )}
              </div>
            );
          })}
        </div>

        {hoverPoint && (
          <div
            className="pointer-events-none absolute -top-8 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg dark:bg-white dark:text-ink-900"
            style={{ left: `${((hoverPos + 0.5) / n) * 100}%` }}
          >
            {hoverPoint.year} · {formatKRWShort(hoverPoint.netWorth)}
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
