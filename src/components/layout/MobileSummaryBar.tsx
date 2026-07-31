import { useSimulation } from '@/hooks/useSimulation';
import { usePlannerStore } from '@/store/plannerStore';
import { formatKRWShort } from '@/utils/format';

/** 모바일에서 입력 중에도 결과를 계속 볼 수 있게 하는 하단 고정 바 */
export function MobileSummaryBar() {
  const years = usePlannerStore((s) => s.settings.years);
  const { summary } = useSimulation();

  return (
    <div className="sticky bottom-0 z-30 border-t border-ink-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-ink-500">{years}년 후 예상 순자산</p>
          <p className="truncate text-lg font-bold text-brand-700">
            {formatKRWShort(summary.finalNetWorth)}원
          </p>
        </div>

        <a
          href="#result"
          className="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          결과 보기
        </a>
      </div>
    </div>
  );
}
