import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-white/60 bg-white/70 shadow-glass backdrop-blur-xl transition-all duration-300 ring-1 ring-inset ring-white/30 dark:border-white/10 dark:bg-slate-900/65 dark:shadow-glass-dark dark:ring-white/5 ${className}`}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-white/40 px-4 py-3.5 dark:border-white/10 sm:px-5">
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-ink-900 dark:text-slate-100 sm:text-base">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-ink-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}
