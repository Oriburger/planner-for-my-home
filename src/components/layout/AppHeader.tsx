import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore } from '@/store/uiStore';

export function AppHeader({ onOpenWizard }: { onOpenWizard: () => void }) {
  const years = usePlannerStore((s) => s.settings.years);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <header className="sticky top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
      <div className="glass glass-strong mx-auto flex h-14 max-w-[1440px] items-center gap-3 rounded-2xl pl-2.5 pr-1.5 sm:h-16 sm:gap-4 sm:rounded-[20px] sm:pl-3 sm:pr-2">
        {/* 브랜드 */}
        <div
          aria-hidden="true"
          className="aurora-card flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[17px] sm:h-10 sm:w-10"
        >
          🏡
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-bold tracking-tight text-ink-900 dark:text-white sm:text-base">
            내 집 마련 플래너
          </h1>
          <p className="hidden truncate text-xs text-ink-500 dark:text-slate-400 sm:block">
            지금의 자산과 수입으로 {years}년 뒤를 미리 그려보세요
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="chip hidden px-3 py-1 text-xs text-ink-600 dark:text-slate-300 md:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
            {years}년 시뮬레이션
          </span>

          <button
            type="button"
            onClick={onOpenWizard}
            aria-label="초기 설정 마법사 열기"
            className="btn-glass min-h-[2.5rem] px-2.5 text-[13px] min-[340px]:px-3"
          >
            <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 1a.75.75 0 01.7.48l1.37 3.6a1.5 1.5 0 00.85.85l3.6 1.37a.75.75 0 010 1.4l-3.6 1.37a1.5 1.5 0 00-.85.85l-1.37 3.6a.75.75 0 01-1.4 0l-1.37-3.6a1.5 1.5 0 00-.85-.85L3.48 8.7a.75.75 0 010-1.4l3.6-1.37a1.5 1.5 0 00.85-.85l1.37-3.6A.75.75 0 0110 1zM15.5 13a.5.5 0 01.47.33l.44 1.26 1.26.44a.5.5 0 010 .94l-1.26.44-.44 1.26a.5.5 0 01-.94 0l-.44-1.26-1.26-.44a.5.5 0 010-.94l1.26-.44.44-1.26A.5.5 0 0115.5 13z" />
            </svg>
            <span className="hidden sm:inline">초기 설정 마법사</span>
            <span className="hidden min-[340px]:inline sm:hidden">설정</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="btn-icon text-ink-600 dark:text-slate-300"
          >
            {theme === 'dark' ? (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.66 5.4a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.46 14.6a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 101.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.6 15.66a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06zM5.4 6.46a.75.75 0 001.06-1.06L5.4 4.34a.75.75 0 00-1.06 1.06L5.4 6.46z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M7.46 2.21a.75.75 0 01.1.83 6 6 0 007.4 8.36.75.75 0 01.94.98A7.5 7.5 0 116.63 2.12a.75.75 0 01.83.09z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
