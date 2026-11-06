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
import { IncomeView } from '@/components/plan/IncomeView';
import { BudgetPlanView } from '@/components/plan/BudgetPlanView';
import { formatKRWShort } from '@/utils/format';
import { Icon } from '@/components/ui/Icon';

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
  const setView = useUIStore((s) => s.setView);
  const selected = useSelectedYear(rows);
  const points = useMemo(() => buildYearPoints(rows, start), [rows, start]);
  const point = points.find((p) => p.index === selected) ?? points[points.length - 1];

  const incomes = usePlannerStore((s) => s.incomes);
  const assets = usePlannerStore((s) => s.assets);
  const goals = usePlannerStore((s) => s.goals);
  const loadSample = usePlannerStore((s) => s.loadSample);

  const firstYear = rows[0];
  const monthlyNet = firstYear ? firstYear.netIncome / 12 : 0;
  const monthlySavings = firstYear ? firstYear.annualSavings / 12 : 0;
  const savingsPct = monthlyNet > 0 ? (monthlySavings / monthlyNet) * 100 : 0;

  const isEmpty = incomes.length === 0 && assets.length === 0;
  const needsGoal = !isEmpty && goals.length === 0;

  return (
    <div className="space-y-3">
      {/* 1. 데이터가 비어있을 때 (온보딩을 건너뛴 유저용 안내) */}
      {isEmpty && (
        <div className="glass glass-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl p-4 border border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-950/30">
          <div>
            <p className="text-sm font-bold text-ink-900 dark:text-white">
              👋 아직 등록된 자산과 수입이 없어요
            </p>
            <p className="text-xs text-ink-600 dark:text-slate-400 mt-0.5">
              2030 직장인 예시 데이터를 먼저 둘러보거나, 내 수입부터 바로 입력해 보세요.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSample}
              className="btn-glass px-3 py-1.5 text-xs font-semibold"
            >
              예시 데이터 둘러보기
            </button>
            <button
              type="button"
              onClick={() => setView('income')}
              className="btn-primary px-3 py-1.5 text-xs font-semibold"
            >
              수입부터 입력하기
            </button>
          </div>
        </div>
      )}

      {/* 2. 자산/수입은 있으나 내 집 마련 목표가 없을 때 다음 단계 넛지 */}
      {needsGoal && (
        <div className="glass glass-card flex items-center justify-between gap-3 rounded-2xl p-3.5 border border-accent-400/30 bg-accent-50/40 dark:bg-accent-950/20">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-500/10 text-accent-700 dark:text-accent-300 font-bold text-sm">🎯</span>
            <div>
              <p className="text-xs font-bold text-ink-900 dark:text-white">다음 단계: 내 집 마련 목표 세우기</p>
              <p className="text-[11px] text-ink-500 dark:text-slate-400">목표 금액과 달성하고 싶은 연도를 정하면 달성 가능성을 계산해 드려요.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditGoals}
            className="btn-primary shrink-0 px-3 py-1.5 text-xs"
          >
            목표 세우기
          </button>
        </div>
      )}

      <HomeHero onAddGoal={onEditGoals} />

      {/* 한 달 머니 계획 바로가기 퀵 배너 */}
      <button
        type="button"
        onClick={() => setView('budget')}
        className="glass glass-card group flex w-full items-center justify-between gap-3 rounded-2xl p-3.5 text-left transition-all hover:border-brand-400"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
            <Icon name="sliders" className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-ink-900 dark:text-slate-100">
              월 지출 · 저축 계획 현황
            </p>
            <p className="text-[11px] text-ink-500 dark:text-slate-400">
              세후 월 {formatKRWShort(monthlyNet)}원 중 {formatKRWShort(monthlySavings)}원({savingsPct.toFixed(0)}%) 저축 계획 중
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform">
          <span>계획 조정</span>
          <Icon name="chevronRight" className="h-3 w-3" />
        </span>
      </button>

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
 * 메인 / 수입 관리 / 계획(지출, 저축) / 타임라인 / 차트 / 상세표 화면 렌더링
 */
export function ViewContent({ view, onEditGoals }: { view: AppView; onEditGoals: () => void }) {
  switch (view) {
    case 'overview':
      return <OverviewView onEditGoals={onEditGoals} />;
    case 'income':
      return <IncomeView />;
    case 'budget':
      return <BudgetPlanView />;
    case 'timeline':
      return <TimelineScreen />;
    case 'charts':
      return <ChartsView />;
    case 'table':
      return <TableView />;
    default:
      return <OverviewView onEditGoals={onEditGoals} />;
  }
}
