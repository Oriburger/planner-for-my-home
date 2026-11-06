import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { buildYearPoints } from '@/utils/accumulation';
import { useSimulation } from '@/hooks/useSimulation';
import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore, type AppView } from '@/store/uiStore';
import { useSelectedYear } from '@/hooks/useSelectedYear';
import { HomeHero } from '@/components/home/HomeHero';
import { GoalCarousel } from '@/components/home/GoalCarousel';
import { SummaryCards } from '@/components/result/SummaryCards';
import { TimelineView } from '@/components/result/TimelineView';
import { AssetChart } from '@/components/result/AssetChart';
import { CashflowChart } from '@/components/result/CashflowChart';
import { YearTable } from '@/components/result/YearTable';
import { TaxRefundCard } from '@/components/result/TaxRefundCard';
import { MoneyFlowView } from '@/components/result/MoneyFlowView';
import { InputPanel } from '@/components/form/InputPanel';

function Disclaimer() {
  return (
    <p className="glass rounded-xl px-3.5 py-2.5 text-[11px] leading-relaxed text-ink-600 dark:text-slate-400">
      가정값 기반 추정치예요. 실제 수익률·세법에 따라 달라질 수 있어요.
    </p>
  );
}

export function OverviewView({ onEditGoals }: { onEditGoals: () => void }) {
  const { rows, summary, start } = useSimulation();
  const years = usePlannerStore((s) => s.settings.years);
  const selected = useSelectedYear(rows);
  const points = useMemo(() => buildYearPoints(rows, start), [rows, start]);
  const point = points.find((p) => p.index === selected) ?? points[points.length - 1];
  return (
    <div className="space-y-3">
      <HomeHero onAddGoal={onEditGoals} />
      <SummaryCards summary={summary} firstYear={rows[0]} point={point} years={years} />
      <GoalCarousel onEdit={onEditGoals} />
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

/** 통장 · 자동이체 · 연말정산 — 돈이 어디로 가는지 */
export function MoneyView() {
  const { rows, assetBalances } = useSimulation();
  const selectedYearIndex = useSelectedYear(rows);
  return (
    <div className="space-y-3">
      <TaxRefundCard />
      <MoneyFlowView
        rows={rows}
        assetBalances={assetBalances}
        selectedYearIndex={selectedYearIndex}
      />
      <Disclaimer />
    </div>
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
export function ViewContent({ view, onEditGoals }: { view: AppView; onEditGoals: () => void }) {
  switch (view) {
    case 'plan':
      return (
        <>
          <div className="mx-auto max-w-2xl lg:hidden">
            <InputPanel />
          </div>
          <div className="hidden lg:block">
            <OverviewView onEditGoals={onEditGoals} />
          </div>
        </>
      );
    case 'timeline':
      return <TimelineScreen />;
    case 'money':
      return <MoneyView />;
    case 'charts':
      return <ChartsView />;
    case 'table':
      return <TableView />;
    default:
      return <OverviewView onEditGoals={onEditGoals} />;
  }
}
