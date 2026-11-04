import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { formatKRWShort } from '@/utils/format';
import { haptic } from '@/utils/feedback';
import { stackLayers, type YearPoint } from '@/utils/accumulation';

/** 범례·차트 공용 층 색 */
export const LAYER = {
  base: 'bg-ink-200 dark:bg-slate-700',
  saved: 'bg-ink-800 dark:bg-slate-200',
  grown: 'bg-accent-500 dark:bg-accent-400',
};

interface GrowthChartProps {
  points: YearPoint[];
  selected: number;
  onSelect: (index: number) => void;
  onInteract?: () => void;
  goalAmount?: number | null;
  goalLabel?: string;
}

type Pt = [number, number];

/** Catmull-Rom → 베지어: 점들을 지나는 부드러운 곡선 */
function smooth(pts: Pt[]): string {
  if (pts.length === 0) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** 위 곡선과 아래 곡선 사이를 채우는 영역 */
function band(top: Pt[], bottom: Pt[]): string {
  const lower = smooth([...bottom].reverse()).replace(/^M/, 'L');
  return `${smooth(top)} ${lower} Z`;
}

const H_MOBILE = 176;
const H_WIDE = 230;
const PAD_TOP = 24;
const PAD_X = 6;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * 연도별 순자산을 시작 자산 / 내가 모은 돈 / 불어난 돈 세 층의 곡선으로 쌓는다.
 * 고른 연도까지만 진하게 드러나고, 그 뒤는 앞으로 쌓일 모습으로 옅게 보인다.
 * 그래프 자체가 스크러버 — PC: 호버·클릭·드래그·방향키 / 모바일: 터치한 채 밀기.
 */
export function GrowthChart({
  points,
  selected,
  onSelect,
  onInteract,
  goalAmount,
  goalLabel,
}: GrowthChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const dragging = useRef(false);
  const lastIdx = useRef(selected);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setW(Math.max(200, el.clientWidth));
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const id = window.setTimeout(() => setRevealed(true), 80);
    return () => window.clearTimeout(id);
  }, []);

  const H = w >= 640 ? H_WIDE : H_MOBILE;
  const n = points.length;
  const lastIndex = points[n - 1]?.index ?? 0;
  const max = Math.max(1, ...points.map((p) => p.netWorth), goalAmount ?? 0) * 1.06;
  const x = (i: number) => PAD_X + (i / Math.max(1, n - 1)) * (w - PAD_X * 2);
  const y = (v: number) => H - (Math.max(0, v) / max) * (H - PAD_TOP);

  const paths = useMemo(() => {
    const layers = points.map(stackLayers);
    const zero = points.map((_, i) => [x(i), H] as Pt);
    const l1 = layers.map((l, i) => [x(i), y(l.base)] as Pt);
    const l2 = layers.map((l, i) => [x(i), y(l.base + l.saved)] as Pt);
    const l3 = layers.map((l, i) => [x(i), y(l.total)] as Pt);
    return {
      base: band(l1, zero),
      saved: band(l2, l1),
      grown: band(l3, l2),
      line: smooth(l3),
      tops: l3,
    };
    // x, y 는 w·max·n 에서만 파생된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, w, max, H]);

  const selPos = Math.max(0, points.findIndex((p) => p.index === selected));
  const sx = x(selPos);
  const sy = paths.tops[selPos]?.[1] ?? H;
  const hoverPos = hover !== null ? points.findIndex((p) => p.index === hover) : -1;
  const showHover = hoverPos >= 0 && hover !== selected;

  const indexAt = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return selected;
    const r = el.getBoundingClientRect();
    const ratio = (clientX - r.left - PAD_X) / Math.max(1, r.width - PAD_X * 2);
    const i = Math.round(ratio * (n - 1));
    return points[Math.max(0, Math.min(n - 1, i))].index;
  };
  const choose = (idx: number, touch: boolean) => {
    if (idx === lastIdx.current) return;
    lastIdx.current = idx;
    onSelect(idx);
    if (touch) haptic(5);
  };

  return (
    <div data-no-swipe>
      <div
        ref={wrapRef}
        role="slider"
        tabIndex={0}
        aria-label="연도 선택"
        aria-valuemin={0}
        aria-valuemax={lastIndex}
        aria-valuenow={selected}
        aria-valuetext={`${points[selPos]?.year ?? ''}년`}
        className="relative cursor-crosshair touch-pan-y select-none rounded-lg outline-offset-4"
        style={{ height: H }}
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
          const d =
            e.key === 'ArrowRight' || e.key === 'ArrowUp'
              ? 1
              : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
                ? -1
                : 0;
          if (!d) return;
          e.preventDefault();
          onInteract?.();
          onSelect(Math.max(0, Math.min(lastIndex, selected + d)));
        }}
      >
        <svg width={w} height={H} className="absolute inset-0 overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="g-saved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.72" />
            </linearGradient>
            <linearGradient id="g-grown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#55a885" />
              <stop offset="100%" stopColor="#277356" />
            </linearGradient>
            {/* 지금 ~ 고른 연도까지만 드러나는 창 */}
            <clipPath id="g-past">
              <rect
                x={0}
                y={-40}
                height={H + 40}
                style={{ width: revealed ? sx + 0.5 : 0, transition: `width 0.6s ${EASE}` }}
              />
            </clipPath>
          </defs>

          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={0}
              x2={w}
              y1={PAD_TOP + (H - PAD_TOP) * f}
              y2={PAD_TOP + (H - PAD_TOP) * f}
              className="stroke-ink-900/[0.06] dark:stroke-white/[0.06]"
            />
          ))}

          {/* 앞으로 쌓일 모습 — 옅게 */}
          <g opacity={0.1}>
            <path d={paths.base} className="fill-ink-300 dark:fill-slate-600" />
            <path d={paths.saved} className="fill-ink-800 dark:fill-slate-300" />
            <path d={paths.grown} className="fill-accent-500" />
          </g>
          <path
            d={paths.line}
            fill="none"
            strokeDasharray="2 5"
            strokeLinecap="round"
            strokeWidth={1.5}
            className="stroke-ink-900/35 dark:stroke-white/35"
          />

          {/* 지금까지 쌓인 돈 */}
          <g clipPath="url(#g-past)" className="text-ink-800 dark:text-slate-200">
            <path d={paths.base} className="fill-ink-200 dark:fill-slate-700" />
            <path d={paths.saved} fill="url(#g-saved)" />
            <path d={paths.grown} fill="url(#g-grown)" />
            <path
              d={paths.line}
              fill="none"
              strokeWidth={2}
              className="stroke-accent-700 dark:stroke-accent-300"
            />
          </g>

          {goalAmount ? (
            <line
              x1={0}
              x2={w}
              y1={y(goalAmount)}
              y2={y(goalAmount)}
              strokeDasharray="1 5"
              strokeLinecap="round"
              strokeWidth={2}
              className="stroke-accent-600 dark:stroke-accent-400"
            />
          ) : null}

          {showHover && (
            <line
              x1={x(hoverPos)}
              x2={x(hoverPos)}
              y1={PAD_TOP - 6}
              y2={H}
              className="stroke-ink-900/20 dark:stroke-white/25"
            />
          )}

          {/* 선택 커서 */}
          <g style={{ transform: `translateX(${sx}px)`, transition: `transform 0.6s ${EASE}` }}>
            <line
              x1={0}
              x2={0}
              y1={PAD_TOP - 10}
              y2={H}
              strokeWidth={1}
              className="stroke-ink-900/45 dark:stroke-white/50"
            />
          </g>
          <g style={{ transform: `translate(${sx}px, ${sy}px)`, transition: `transform 0.6s ${EASE}` }}>
            <circle r={10} className="fill-accent-500/15" />
            <circle
              r={4.5}
              strokeWidth={2}
              className="fill-white stroke-ink-900 dark:fill-ink-900 dark:stroke-white"
            />
          </g>
        </svg>

        {goalAmount ? (
          <span
            className="pointer-events-none absolute right-0 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700 shadow-sm ring-1 ring-accent-600/20 dark:bg-ink-900/85 dark:text-accent-300"
            style={{ top: y(goalAmount) - 22, transition: `top 0.5s ${EASE}` }}
          >
            {goalLabel ?? formatKRWShort(goalAmount)}
          </span>
        ) : null}

        {showHover && (
          <span
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[11px] font-medium tabular-nums text-white shadow-lg dark:bg-white dark:text-ink-900"
            style={{ left: x(hoverPos) }}
          >
            {points[hoverPos].year} · {formatKRWShort(points[hoverPos].netWorth)}
          </span>
        )}
      </div>

      {/* 축: 지금 · 고른 연도 · 끝 */}
      <div className="relative mt-2 h-4 text-[10px] font-medium tabular-nums text-ink-500 dark:text-slate-500">
        {/* 커서 꼬리표와 겹치면 양 끝 글자를 숨긴다 */}
        {(selPos === 0 || sx > 44) && <span className="absolute left-0">지금</span>}
        {(selPos === n - 1 || sx < w - 44) && (
          <span className="absolute right-0">{points[n - 1]?.year}</span>
        )}
        {selPos > 0 && selPos < n - 1 && (
          <span
            className="absolute -translate-x-1/2 rounded bg-ink-900 px-1.5 text-white dark:bg-white dark:text-ink-900"
            style={{ left: sx, transition: `left 0.6s ${EASE}` }}
          >
            {points[selPos].year}
          </span>
        )}
      </div>
    </div>
  );
}
