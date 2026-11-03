import { useId, useState, type ReactNode } from 'react';
import { IconBadge } from './Card';

interface AccordionProps {
  title: string;
  /** 헤더 우측에 표시되는 요약값 (예: "월 136만원") */
  summary?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** 카테고리별 입력을 접어두어 모바일에서의 시각적 피로도를 줄인다. */
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
    <div className="glass overflow-hidden rounded-3xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-[4rem] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/30 focus:outline-none focus-visible:bg-white/40 dark:hover:bg-white/[0.03] sm:px-5"
      >
        {icon && <IconBadge>{icon}</IconBadge>}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold tracking-tight text-ink-900 dark:text-slate-50">
            {title}
          </span>
          {summary && (
            <span className="mt-0.5 block truncate text-xs text-ink-500 dark:text-slate-400">
              {summary}
            </span>
          )}
        </span>

        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
            open
              ? 'rotate-180 bg-brand-500/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-300'
              : 'text-ink-400 dark:text-slate-500'
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div id={panelId} className="hairline space-y-3 border-t px-3 pb-4 pt-3 sm:px-4">
          {children}
        </div>
      )}
    </div>
  );
}
