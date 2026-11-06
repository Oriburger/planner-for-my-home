import { useEffect, useRef, useState } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { Icon } from '@/components/ui/Icon';
import { PresetGroup, RangeInput } from '@/components/ui/Fields';
import { haptic } from '@/utils/feedback';

const PRESETS = [5, 10, 20, 30] as const;

/**
 * 시뮬레이션 기간 — 데이터가 아니라 '보는 범위'이므로 설정이 아닌 헤더에 둔다.
 * − / + 로 1년씩, 숫자를 누르면 슬라이더·프리셋.
 */
export function HorizonControl() {
  const years = usePlannerStore((s) => s.settings.years);
  const setYears = usePlannerStore((s) => s.setYears);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const step = (d: number) => {
    setYears(years + d);
    haptic(5);
  };

  return (
    <div ref={ref} className="relative">
      <div className="glass-tile flex h-9 items-center rounded-full p-0.5">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={years <= 1}
          aria-label="기간 1년 줄이기"
          className="flex h-8 w-7 items-center justify-center rounded-full text-ink-600 transition active:scale-90 disabled:opacity-30 dark:text-slate-300 sm:w-8"
        >
          <Icon name="minus" className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`시뮬레이션 기간 ${years}년, 눌러서 바꾸기`}
          className="min-w-[2.75rem] rounded-full px-1 text-center text-[13px] font-semibold tabular-nums text-ink-900 dark:text-white"
        >
          {years}년
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={years >= 40}
          aria-label="기간 1년 늘리기"
          className="flex h-8 w-7 items-center justify-center rounded-full text-ink-600 transition active:scale-90 disabled:opacity-30 dark:text-slate-300 sm:w-8"
        >
          <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>

      {open && (
        <div className="glass animate-sheet-up absolute right-0 top-[calc(100%+8px)] z-50 !bg-white dark:!bg-[#1a1c22] w-[min(300px,calc(100vw-1.5rem))] rounded-2xl p-4 max-sm:-right-[4.5rem]">
          <div className="flex items-end justify-between">
            <span className="text-xs font-medium text-ink-600 dark:text-slate-400">몇 년 뒤까지 볼까요?</span>
            <span className="text-2xl font-semibold leading-none tabular-nums text-ink-900 dark:text-white">
              {years}
              <span className="ml-0.5 text-sm font-medium text-ink-500">년</span>
            </span>
          </div>
          <div className="mt-2">
            <RangeInput value={years} onChange={setYears} min={1} max={40} label="시뮬레이션 기간(년)" />
          </div>
          <div className="mt-2">
            <PresetGroup
              value={years as (typeof PRESETS)[number]}
              onChange={(y) => {
                setYears(y);
                haptic(5);
              }}
              options={PRESETS}
              format={(y) => `${y}년`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
