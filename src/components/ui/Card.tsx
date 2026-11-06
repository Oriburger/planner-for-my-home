import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** 기본 유리 패널 */
export function Card({ children, className = '' }: CardProps) {
  return <section className={`glass spotlight rounded-2xl ${className}`}>{children}</section>;
}

interface CardHeaderProps {
  title: string;
  description?: string;
  icon?: IconName;
  action?: ReactNode;
}

export function CardHeader({ title, description, icon, action }: CardHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pb-1 pt-4 sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <IconBadge name={icon} />}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink-900 dark:text-slate-50">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-600 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </header>
  );
}

/** 섹션 아이콘 — 중립 톤의 작은 사각 타일 */
export function IconBadge({ name }: { name: IconName }) {
  return (
    <span className="glass-tile flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-600 dark:text-slate-300">
      <Icon name={name} className="h-4 w-4" />
    </span>
  );
}
