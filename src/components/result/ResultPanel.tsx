import { usePlannerStore } from '@/store/plannerStore';
import { useSimulation } from '@/hooks/useSimulation';
import { SummaryCards } from './SummaryCards';
import { AssetChart } from './AssetChart';
import { CashflowChart } from './CashflowChart';
import { YearTable } from './YearTable';

/** 우측(모바일에서는 하단) 결과 패널 */
export function ResultPanel() {
  const years = usePlannerStore((s) => s.settings.years);
  const { rows, summary, start } = useSimulation();

  return (
    <div className="space-y-3">
      <SummaryCards
        summary={summary}
        years={years}
        finalYear={rows[rows.length - 1].year}
        firstYear={rows[0]}
      />

      <AssetChart rows={rows} start={start} />
      <CashflowChart rows={rows} />
      <YearTable rows={rows} />

      <p className="px-1 pb-2 text-[11px] text-ink-400">
        * 가정값 기반 추정치이며 참고용입니다.
      </p>
    </div>
  );
}
