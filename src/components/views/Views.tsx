import { useShallow } from 'zustand/react/shallow';
import { useSimulation } from '@/hooks/useSimulation';
import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore, type AppView } from '@/store/uiStore';
import type { SimulationResult } from '@/types/planner';
import { MilestoneHorizonSummary } from '@/components/result/MilestoneHorizonSummary';
import { SummaryCards } from '@/components/result/SummaryCards';
import { TimelineView } from '@/components/result/TimelineView';
import { AssetChart } from '@/components/result/AssetChart';
import { CashflowChart } from '@/components/result/CashflowChart';
import { YearTable } from '@/components/result/YearTable';
import { InputPanel } from '@/components/form/InputPanel';

/** 선택 연차가 없을 때 보여줄 기본 연차 (5년차 → 3년차 → 1년차) */
function useSelectedYear(rows: SimulationResult['rows']) {
  const selected = useUIStore((s) => s.selectedYearIndex);
  if (selected !== null && (selected === 0 || rows.some((r) => r.index === selected))) {
    return selected;
  }
  return rows.length >= 5 ? 5 : rows.length >= 3 ? 3 : 1;
}

function Disclaimer() {
  return (
    <p className="glass rounded-xl px-3.5 py-2.5 text-[11px] leading-relaxed text-ink-500 dark:text-slate-400">
      가정값 기반 추정치이며 실제 시장 수익률 및 세법 개정에 따라 차이가 발생할 수 있습니다.
    </p>
  );
}

export function OverviewView() {
  const { rows, summary, start } = useSimulation();
  const years = usePlannerStore((s) => s.settings.years);
  const selectYear = useUIStore((s) => s.selectYear);
  const setView = useUIStore((s) => s.setView);
  const selectedYearIndex = useSelectedYear(rows);

  return (
    <div className="space-y-3">
      <SummaryCards
        summary={summary}
        years={years}
        finalYear={rows[rows.length - 1].year}
        firstYear={rows[0]}
        trend={[start.netWorth, ...rows.map((r) => r.netWorth)]}
      />
      <MilestoneHorizonSummary
        rows={rows}
        start={start}
        selectedYearIndex={selectedYearIndex}
        onSelectYear={(y) => {
          selectYear(y);
          setView('timeline');
        }}
      />
      <AssetChart rows={rows} start={start} />
      <Disclaimer />
    </div>
  );
}

export function TimelineScreen() {
  const data = usePlannerStore(
    useShallow((s) => ({
      settings: s.settings,
      assets: s.assets,
      incomes: s.incomes,
      housings: s.housings,
      loans: s.loans,
      expenses: s.expenses,
    })),
  );
  const { rows, summary } = useSimulation();
  const selectYear = useUIStore((s) => s.selectYear);
  const selectedYearIndex = useSelectedYear(rows);

  return (
    <TimelineView
      data={data}
      rows={rows}
      summary={summary}
      selectedYearIndex={selectedYearIndex}
      onSelectYear={selectYear}
    />
  );
}

export function ChartsView() {
  const { rows, start } = useSimulation();
  return (
    <div className="space-y-3">
      <AssetChart rows={rows} start={start} />
      <CashflowChart rows={rows} />
    </div>
  );
}

export function TableView() {
  const { rows } = useSimulation();
  return (
    <div className="space-y-3">
      <YearTable rows={rows} />
      <Disclaimer />
    </div>
  );
}

/**
 * 현재 화면 렌더링.
 * 'plan'(입력)은 모바일 전용 화면 — 데스크톱에서는 입력이 좌측 패널에 있으므로 개요를 보여준다.
 */
export function ViewContent({ view }: { view: AppView }) {
  switch (view) {
    case 'plan':
      return (
        <>
          <div className="lg:hidden">
            <InputPanel />
          </div>
          <div className="hidden lg:block">
            <OverviewView />
          </div>
        </>
      );
    case 'timeline':
      return <TimelineScreen />;
    case 'charts':
      return <ChartsView />;
    case 'table':
      return <TableView />;
    default:
      return <OverviewView />;
  }
}
