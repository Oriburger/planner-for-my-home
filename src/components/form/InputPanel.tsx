import { usePlannerStore } from '@/store/plannerStore';
import { PeriodSection } from './PeriodSection';
import { AssetSection } from './AssetSection';
import { IncomeSection } from './IncomeSection';
import { HousingSection } from './HousingSection';
import { LoanSection } from './LoanSection';
import { ExpenseSection } from './ExpenseSection';
import { Accordion } from '@/components/ui/Accordion';
import { GoalEditor } from '@/components/home/GoalEditor';

/** 좌측(모바일에서는 상단) 데이터 입력 패널 */
export function InputPanel() {
  const resetAll = usePlannerStore((s) => s.resetAll);
  const goalCount = usePlannerStore((s) => s.goals.length);

  return (
    <div className="space-y-3">
      <PeriodSection />

      <Accordion title="연도별 목표" summary={goalCount ? `${goalCount}개` : '아직 없음'} icon="target">
        <GoalEditor />
      </Accordion>

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
        className="btn-glass w-full text-xs text-ink-600 dark:text-slate-400"
      >
        입력값 초기화
      </button>
    </div>
  );
}
