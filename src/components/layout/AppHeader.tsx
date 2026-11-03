import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore } from '@/store/uiStore';

export function AppHeader({ onOpenWizard }: { onOpenWizard: () => void }) {
  const years = usePlannerStore((s) => s.settings.years);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-2xl transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/65 shadow-glass-sm dark:shadow-glass-dark">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3.5 px-4 py-3 sm:px-6">
        {/* Glowing Brand Emblem */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-md shadow-blue-500/25 ring-1 ring-white/30">
          <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-gradient-to-tr from-blue-600 to-indigo-600 text-lg text-white">
            🏡
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-bold tracking-tight text-ink-900 dark:text-slate-100 sm:text-base">
              내 집 마련 플래너
            </h1>
            <span className="hidden rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-400/10 dark:text-brand-300 sm:inline-block">
              Liquid Glass Edition
            </span>
          </div>
          <p className="truncate text-[11px] text-ink-500 dark:text-slate-400">
            지금의 자산과 수입으로 {years}년 후 내 집 마련 시점을 시뮬레이션하세요
          </p>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex items-center gap-2">
          <span className="hidden shrink-0 rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-semibold text-brand-700 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-slate-800/60 dark:text-brand-300 sm:block">
            {years}년 시뮬레이션
          </span>

          <button
            type="button"
            onClick={onOpenWizard}
            className="flex items-center gap-1.5 rounded-xl border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-xs backdrop-blur-md transition-all duration-200 hover:border-brand-300 hover:bg-white hover:text-brand-700 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:bg-slate-800"
          >
            <span>✨</span>
            <span className="hidden sm:inline">초기설정 마법사</span>
            <span className="sm:hidden">설정</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/60 bg-white/70 text-sm text-ink-600 shadow-xs backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
