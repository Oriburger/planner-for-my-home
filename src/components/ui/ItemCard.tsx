import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface ItemCardProps {
  title: ReactNode;
  badge?: string;
  onRemove?: () => void;
  onDuplicate?: () => void;
  children: ReactNode;
}

/** 동적으로 추가/삭제되는 개별 입력 항목 카드 */
export function ItemCard({
  title,
  badge,
  onRemove,
  onDuplicate,
  children,
}: ItemCardProps) {
  return (
    <div className="glass-tile rounded-xl p-3 sm:p-3.5">
      <div className="mb-3 flex items-center gap-1">
        <div className="min-w-0 flex-1">{title}</div>

        {badge && <span className="chip ml-1 shrink-0 whitespace-nowrap text-ink-600 dark:text-slate-300">{badge}</span>}

        {onDuplicate && (
          <button
            type="button"
            onClick={onDuplicate}
            aria-label="항목 복제"
            title="복제"
            className="btn-icon"
          >
            <Icon name="copy" className="h-4 w-4" />
          </button>
        )}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="항목 삭제"
            title="삭제"
            className="btn-icon hover:!bg-rose-500/10 hover:!text-rose-600 dark:hover:!text-rose-400"
          >
            <Icon name="trash" className="h-4 w-4" />
          </button>
        )}
      </div>

      {children}
    </div>
  );
}

/** '항목 추가' 버튼 */
export function AddItemButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[2.75rem] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-900/15 px-3 text-sm font-medium text-ink-600 transition-all duration-150 hover:border-ink-900/30 hover:bg-ink-900/[0.03] hover:text-ink-900 active:scale-[0.99] dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:bg-white/[0.04] dark:hover:text-white"
    >
      <Icon name="plus" className="h-4 w-4" />
      {label}
    </button>
  );
}

/** 항목이 하나도 없을 때의 빈 상태 */
export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-ink-900/10 px-3 py-6 text-center text-xs text-ink-500 dark:border-white/10 dark:text-slate-500">
      {message}
    </p>
  );
}
