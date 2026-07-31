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
      />

      <AssetChart rows={rows} start={start} />
      <CashflowChart rows={rows} />
      <YearTable rows={rows} />

      <p className="px-1 pb-2 text-[11px] leading-relaxed text-ink-400">
        * 세금과 4대보험은 연봉 구간별 실효 공제율로 단순화한 추정치이며, 실제
        연말정산 결과와 다를 수 있습니다. 물가상승률·수익률 등 가정값에 따라
        결과가 크게 달라지므로 참고용으로만 활용해 주세요.
      </p>
    </div>
  );
}
