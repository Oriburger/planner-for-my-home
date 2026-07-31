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
 * 열림 상태는 각 섹션이 로컬로 관리한다.
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
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 sm:px-5"
      >
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-base">
            {icon}
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink-900">
            {title}
          </span>
          {summary && (
            <span className="mt-0.5 block truncate text-xs text-ink-500">
              {summary}
            </span>
          )}
        </span>

        <svg
          className={`h-5 w-5 shrink-0 text-ink-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
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
          className="space-y-3 border-t border-ink-100 bg-ink-50/50 px-3 py-4 sm:px-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}
