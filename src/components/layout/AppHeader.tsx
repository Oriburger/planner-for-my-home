import { useSimulation } from '@/hooks/useSimulation';
import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore, VIEW_LABEL } from '@/store/uiStore';
import { Icon } from '@/components/ui/Icon';
import { formatKRWShort } from '@/utils/format';
import { HorizonControl } from './HorizonControl';

export function AppHeader() {
  const years = usePlannerStore((s) => s.settings.years);
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const { summary } = useSimulation();

  return (
    <header className="sticky top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
      <div className="glass glass-strong mx-auto flex h-14 max-w-[1440px] items-center gap-2 rounded-2xl pl-2.5 pr-3 sm:gap-3 sm:pl-3 sm:pr-4">
        <button
          type="button"
          onClick={() => setView('overview')}
          aria-label="홈으로 이동"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-ink-900 text-white dark:bg-white dark:text-ink-900"
        >
          <Icon name="home" className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>

        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <h1 className="truncate text-sm font-semibold tracking-tight text-ink-900 dark:text-white sm:text-[15px]">
            <span className="hidden sm:inline">내 집 마련 플래너</span>
            <span className="sm:hidden">{VIEW_LABEL[view]}</span>
          </h1>
          <span className="hidden text-sm text-ink-300 dark:text-slate-600 sm:inline">/</span>
          <span className="hidden truncate text-sm text-ink-600 dark:text-slate-400 sm:inline">
            {VIEW_LABEL[view]}
          </span>
        </div>

        <HorizonControl />

        <button
          type="button"
          onClick={() => setView('overview')}
          className="hidden min-w-0 text-right sm:block"
          aria-label={`${years}년 후 예상 순자산 ${formatKRWShort(summary.finalNetWorth)}원`}
        >
          <span className="block text-[10px] font-medium text-ink-500 dark:text-slate-400 sm:text-[11px]">
            최종 순자산
          </span>
          <span className="block truncate text-sm font-semibold tabular-nums tracking-tight text-ink-900 dark:text-white sm:text-[15px]">
            {formatKRWShort(summary.finalNetWorth)}원
          </span>
        </button>
      </div>
    </header>
  );
}
