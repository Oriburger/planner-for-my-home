import { usePlannerStore } from '@/store/plannerStore';
import { PeriodSection } from './PeriodSection';
import { AssetSection } from './AssetSection';
import { IncomeSection } from './IncomeSection';
import { HousingSection } from './HousingSection';
import { LoanSection } from './LoanSection';
import { ExpenseSection } from './ExpenseSection';

/** 좌측(모바일에서는 상단) 데이터 입력 패널 */
export function InputPanel() {
  const resetAll = usePlannerStore((s) => s.resetAll);

  return (
    <div className="space-y-3">
      <PeriodSection />

      <AssetSection />
      <IncomeSection />
      <HousingSection />
      <LoanSection />
      <ExpenseSection />

      <button
        type="button"
        onClick={() => {
          if (window.confirm('입력값을 모두 예시 데이터로 되돌릴까요?')) {
            resetAll();
          }
        }}
        className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-xs font-medium text-ink-500 transition hover:bg-ink-50 hover:text-ink-700"
      >
        입력값 초기화
      </button>
    </div>
  );
}
