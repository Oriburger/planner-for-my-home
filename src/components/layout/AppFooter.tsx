import { useUIStore } from '@/store/uiStore';

export function AppFooter() {
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <footer className="mt-auto border-t border-ink-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-4 text-xs text-ink-500 dark:text-slate-400 sm:flex-row sm:px-6">
        <p className="text-center sm:text-left">
          © {new Date().getFullYear()} 저축 예상액 계산기 · 내 집 마련 플래너
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* 화면 모드 (PC / 모바일 버전) 전환 버튼 (텍스트 형태) */}
          <div className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-ink-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
            <span className="font-medium text-ink-600 dark:text-slate-300">화면 모드:</span>
            <button
              type="button"
              onClick={() => setViewMode('pc')}
              className={`px-1.5 py-0.5 font-medium transition ${
                viewMode === 'pc'
                  ? 'font-bold text-brand-600 underline dark:text-brand-400'
                  : 'text-ink-500 hover:text-ink-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              PC 버전
            </button>
            <span className="text-ink-300 dark:text-slate-600">|</span>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={`px-1.5 py-0.5 font-medium transition ${
                viewMode === 'mobile'
                  ? 'font-bold text-brand-600 underline dark:text-brand-400'
                  : 'text-ink-500 hover:text-ink-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              모바일 버전
            </button>
            <span className="text-ink-300 dark:text-slate-600">|</span>
            <button
              type="button"
              onClick={() => setViewMode('auto')}
              className={`px-1.5 py-0.5 font-medium transition ${
                viewMode === 'auto'
                  ? 'font-bold text-brand-600 underline dark:text-brand-400'
                  : 'text-ink-500 hover:text-ink-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              자동
            </button>
          </div>

          {/* 다크 모드 전환 텍스트 버튼 */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1 font-medium transition hover:bg-ink-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <span>{theme === 'dark' ? '☀️ 라이트 모드로 보기' : '🌙 다크 모드로 보기'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
