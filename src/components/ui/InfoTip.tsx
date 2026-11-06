import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon';

/**
 * 부가 설명을 본문에서 빼고 ⓘ 뒤에 숨긴다.
 * PC: 호버 / 모바일: 탭으로 열고 바깥을 누르면 닫힌다.
 */
export function InfoTip({ text, label = '설명 보기' }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative inline-flex align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="-m-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-500 transition-colors hover:text-ink-700 dark:text-slate-500 dark:hover:text-slate-200"
      >
        <Icon name="info" className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="animate-fade-in break-keep absolute bottom-full left-1/2 z-50 mb-1.5 w-max max-w-[min(260px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-ink-900 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white shadow-lg dark:bg-white dark:text-ink-900"
        >
          {text}
        </span>
      )}
    </span>
  );
}
