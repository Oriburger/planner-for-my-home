import { useId, useState, type ReactNode } from 'react';
import { IconBadge } from './Card';
import { Icon, type IconName } from './Icon';

interface AccordionProps {
  title: string;
  /** 헤더 우측에 표시되는 요약값 (예: "월 136만원") */
  summary?: string;
  icon?: IconName;
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
    <div className="glass spotlight overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-[3.75rem] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-900/[0.02] focus:outline-none focus-visible:bg-ink-900/[0.03] dark:hover:bg-white/[0.03]"
      >
        {icon && <IconBadge name={icon} />}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold tracking-tight text-ink-900 dark:text-slate-50">
            {title}
          </span>
          {summary && (
            <span className="mt-0.5 block truncate text-xs text-ink-600 dark:text-slate-400">
              {summary}
            </span>
          )}
        </span>

        <Icon
          name="chevronDown"
          className={`h-4 w-4 shrink-0 text-ink-500 transition-transform duration-200 dark:text-slate-500 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div id={panelId} className="hairline space-y-3 border-t px-3 pb-4 pt-3 sm:px-4">
          {children}
        </div>
      )}
    </div>
  );
}
