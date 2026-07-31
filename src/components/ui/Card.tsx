import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-ink-200 bg-white shadow-card ${className}`}
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
    <header className="flex items-start justify-between gap-3 border-b border-ink-100 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink-900 sm:text-base">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-ink-500">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}
