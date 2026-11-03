import { useSimulation } from '@/hooks/useSimulation';
import { usePlannerStore } from '@/store/plannerStore';
import { formatKRWShort } from '@/utils/format';

/** 모바일에서 입력 중에도 결과를 계속 볼 수 있게 하는 하단 플로팅 글래스 바 */
export function MobileSummaryBar() {
  const years = usePlannerStore((s) => s.settings.years);
  const { summary } = useSimulation();

  return (
    <div className="sticky bottom-0 z-30 border-t border-white/60 bg-white/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-glass backdrop-blur-2xl transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/80 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-ink-500 dark:text-slate-400">{years}년 후 예상 순자산</p>
          <p className="truncate text-lg font-extrabold text-brand-700 dark:text-brand-400 tabular-nums">
            {formatKRWShort(summary.finalNetWorth)}원
          </p>
        </div>

        <a
          href="#result"
          className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition-all duration-200 active:scale-95"
        >
          결과 보기
        </a>
      </div>
    </div>
  );
}
