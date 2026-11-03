import { useUIStore, type ViewMode } from '@/store/uiStore';

const VIEW_OPTIONS: Array<{ value: ViewMode; label: string }> = [
  { value: 'auto', label: '자동' },
  { value: 'pc', label: 'PC' },
  { value: 'mobile', label: '모바일' },
];

export function AppFooter() {
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);

  return (
    <footer className="mt-auto px-4 pb-6 pt-2 sm:px-6 lg:px-8">
      <div className="hairline mx-auto flex max-w-[1440px] flex-col items-center gap-3 border-t pt-5 text-xs text-ink-500 dark:text-slate-400 sm:flex-row sm:justify-between">
        <p className="font-medium">© {new Date().getFullYear()} 내 집 마련 플래너</p>

        <div className="flex items-center gap-2">
          <span className="font-medium text-ink-400 dark:text-slate-500">화면 레이아웃</span>
          <div className="segmented" role="group" aria-label="화면 레이아웃">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={viewMode === opt.value}
                onClick={() => setViewMode(opt.value)}
                className="segmented-item min-h-[2rem] px-3"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
