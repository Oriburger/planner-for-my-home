import type { ReactNode } from 'react';

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
    <div className="rounded-xl border border-ink-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">{title}</div>

        {badge && (
          <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
            {badge}
          </span>
        )}

        {onDuplicate && (
          <button
            type="button"
            onClick={onDuplicate}
            aria-label="항목 복제"
            title="복제"
            className="shrink-0 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3.5A1.5 1.5 0 018.5 2h6A1.5 1.5 0 0116 3.5v8a1.5 1.5 0 01-1.5 1.5h-6A1.5 1.5 0 017 11.5v-8z" />
              <path d="M4 6.5A1.5 1.5 0 015.5 5H6v6.5A2.5 2.5 0 008.5 14H13v.5a1.5 1.5 0 01-1.5 1.5h-6A1.5 1.5 0 014 14.5v-8z" />
            </svg>
          </button>
        )}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="항목 삭제"
            title="삭제"
            className="shrink-0 rounded-lg p-1.5 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.75 1a1 1 0 00-.95.68L7.42 3H4a1 1 0 000 2h12a1 1 0 100-2h-3.42l-.38-1.32A1 1 0 0011.25 1h-2.5zM5.06 7l.63 9.42A2 2 0 007.69 18h4.62a2 2 0 001.99-1.58L14.94 7H5.06z"
                clipRule="evenodd"
              />
            </svg>
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
      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 px-3 py-2.5 text-xs font-semibold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
      </svg>
      {label}
    </button>
  );
}

/** 항목이 하나도 없을 때의 빈 상태 */
export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-ink-400">
      {message}
    </p>
  );
}
