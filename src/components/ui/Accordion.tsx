import { useId, useState, type ReactNode } from 'react';

interface AccordionProps {
  title: string;
  /** 헤더 우측에 표시되는 요약값 (예: "월 136만원") */
  summary?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * 카테고리별 입력을 접어두어 모바일에서의 시각적 피로도를 줄인다.
 * Liquid Glass 스타일로 유려하게 렌더링한다.
 */
export function Accordion({
  title,
  summary,
  icon,
  defaultOpen = false,
  children,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-glass backdrop-blur-xl ring-1 ring-inset ring-white/30 transition-all duration-300 dark:border-white/10 dark:bg-slate-900/65 dark:shadow-glass-dark dark:ring-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 dark:hover:bg-slate-800/60 sm:px-5"
      >
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50/80 text-base shadow-xs dark:border-blue-900/40 dark:from-blue-950/50 dark:to-slate-800">
            {icon}
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink-900 dark:text-slate-100">
            {title}
          </span>
          {summary && (
            <span className="mt-0.5 block truncate text-xs font-medium text-ink-500 dark:text-slate-400">
              {summary}
            </span>
          )}
        </span>

        <svg
          className={`h-5 w-5 shrink-0 text-ink-400 transition-transform duration-300 dark:text-slate-400 ${
            open ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          className="space-y-3 border-t border-white/40 bg-white/40 px-3 py-4 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/30 sm:px-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}
