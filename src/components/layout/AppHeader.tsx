import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore } from '@/store/uiStore';

export function AppHeader({ onOpenWizard }: { onOpenWizard: () => void }) {
  const years = usePlannerStore((s) => s.settings.years);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-base text-white shadow-sm">
          📈
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-ink-900 dark:text-slate-100 sm:text-base">
            저축 예상액 계산기
          </h1>
          <p className="truncate text-[11px] text-ink-500 dark:text-slate-400">
            지금의 수입과 지출로 {years}년 뒤 자산을 예측해 보세요
          </p>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-sm text-ink-600 transition hover:bg-ink-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <span className="hidden shrink-0 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-blue-800/80 dark:bg-blue-950/50 dark:text-blue-300 sm:block">
          {years}년 시뮬레이션
        </span>

        <button
          type="button"
          onClick={onOpenWizard}
          className="shrink-0 rounded-xl border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-800"
        >
          초기설정
        </button>
      </div>
    </header>
  );
}
