import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** 기본 유리 패널 */
export function Card({ children, className = '' }: CardProps) {
  return <section className={`glass rounded-3xl ${className}`}>{children}</section>;
}

interface CardHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, description, icon, action }: CardHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pb-1 pt-4 sm:px-5 sm:pt-5">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <IconBadge>{icon}</IconBadge>}
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight text-ink-900 dark:text-slate-50 sm:text-base">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </header>
  );
}

/** 섹션 아이콘을 담는 작은 유리 배지 */
export function IconBadge({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="icon-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[17px] leading-none"
    >
      {children}
    </span>
  );
}
