import { useUIStore } from '@/store/uiStore';

export function AppFooter() {
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <footer className="mt-auto border-t border-white/60 bg-white/70 py-6 backdrop-blur-2xl transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/65 shadow-glass-sm dark:shadow-glass-dark">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-4 text-xs text-ink-500 dark:text-slate-400 sm:flex-row sm:px-6">
        <p className="text-center font-medium sm:text-left">
          © {new Date().getFullYear()} 내 집 마련 플래너 · Liquid Glass Edition
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* 화면 모드 (PC / 모바일 버전) 전환 버튼 */}
          <div className="flex items-center gap-1 rounded-xl border border-white/60 bg-white/60 p-1 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-slate-800/60">
            <span className="px-2 text-[11px] font-semibold text-ink-600 dark:text-slate-300">뷰 모드:</span>
            <button
              type="button"
              onClick={() => setViewMode('pc')}
              className={`rounded-lg px-2 py-1 font-semibold transition-all ${
                viewMode === 'pc'
                  ? 'bg-brand-600 text-white shadow-xs dark:bg-brand-500'
                  : 'text-ink-500 hover:text-ink-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              PC
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={`rounded-lg px-2 py-1 font-semibold transition-all ${
                viewMode === 'mobile'
                  ? 'bg-brand-600 text-white shadow-xs dark:bg-brand-500'
                  : 'text-ink-500 hover:text-ink-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              모바일
            </button>
            <button
              type="button"
              onClick={() => setViewMode('auto')}
              className={`rounded-lg px-2 py-1 font-semibold transition-all ${
                viewMode === 'auto'
                  ? 'bg-brand-600 text-white shadow-xs dark:bg-brand-500'
                  : 'text-ink-500 hover:text-ink-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              자동
            </button>
          </div>

          {/* 테마 전환 */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-xl border border-white/60 bg-white/60 px-3 py-1.5 font-semibold text-ink-600 shadow-xs backdrop-blur-md transition-all hover:bg-white dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span>{theme === 'dark' ? '☀️ 라이트 모드' : '🌙 다크 모드'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
