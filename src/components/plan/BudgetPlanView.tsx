import { useMemo, useState } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { useSimulation } from '@/hooks/useSimulation';
import { useUIStore } from '@/store/uiStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import {
  CountInput,
  Field,
  MemoField,
  MoneyInput,
  PercentInput,
  RangeInput,
  Select,
  TextInput,
  Toggle,
} from '@/components/ui/Fields';
import { formatKRWShort } from '@/utils/format';
import { haptic } from '@/utils/feedback';
import { currentYear } from '@/utils/time';
import { estimateMonthlyLoanPayment } from '@/utils/loan';
import { MoneyFlowView } from '@/components/result/MoneyFlowView';
import { AssetSection } from '@/components/form/AssetSection';
import { PeriodSection } from '@/components/form/PeriodSection';
import {
  calculateBudgetShares,
  applyBudgetPreset,
  applyBudgetSavingsPreset,
  BUDGET_PRESETS,
  type BudgetPresetType,
} from '@/utils/budget';
import {
  ASSET_TYPE_LABEL,
  EXPENSE_CATEGORY_LABEL,
  HOUSING_TYPE_LABEL,
  REPAYMENT_TYPE_LABEL,
  type AssetType,
  type ExpenseCategory,
  type HousingType,
  type RepaymentType,
} from '@/types/planner';

const FLOW_COLORS = {
  housing: '#eda100', // 주거비 (yellow)
  loan: '#d03b3b', // 대출 상환 (red)
  living: '#eb6834', // 생활비 (orange)
  contribution: '#2a78d6', // 자동이체 저축 (blue)
  leftover: '#10b981', // 여유자금 (emerald)
} as const;

const HOUSING_TYPE_OPTIONS = (Object.keys(HOUSING_TYPE_LABEL) as HousingType[]).map(
  (value) => ({ value, label: HOUSING_TYPE_LABEL[value] }),
);

const REPAYMENT_TYPE_OPTIONS = (
  Object.keys(REPAYMENT_TYPE_LABEL) as RepaymentType[]
).map((value) => ({ value, label: REPAYMENT_TYPE_LABEL[value] }));

const EXPENSE_CATEGORY_OPTIONS = (
  Object.keys(EXPENSE_CATEGORY_LABEL) as ExpenseCategory[]
).map((value) => ({ value, label: EXPENSE_CATEGORY_LABEL[value] }));

const ASSET_TYPE_OPTIONS = (Object.keys(ASSET_TYPE_LABEL) as AssetType[]).map(
  (value) => ({ value, label: ASSET_TYPE_LABEL[value] }),
);

const HAS_MATURITY_TYPES: AssetType[] = [
  'pension',
  'savings',
  'housingSubscription',
];

/** 원터치 증감 칩 및 와이드 슬라이더 */
function FastStepAdjuster({
  value,
  onChange,
  max,
  label = '금액 조절',
}: {
  value: number;
  onChange: (val: number) => void;
  max: number;
  label?: string;
}) {
  const effectiveMax = Math.max(max, value);
  return (
    <div className="mt-2.5 space-y-2.5" data-no-swipe>
      <RangeInput
        min={0}
        max={effectiveMax}
        step={10000}
        value={value}
        label={label}
        onChange={(val) => {
          haptic(3);
          onChange(val);
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
        <div className="flex items-center gap-1.5">
          {[-50000, -10000].map((step, idx) => (
            <button
              key={step}
              type="button"
              disabled={value + step < 0}
              onClick={() => {
                haptic(5);
                onChange(Math.max(0, value + step));
              }}
              className="min-h-[34px] min-w-[44px] rounded-lg border border-ink-900/10 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-white active:scale-95 disabled:opacity-30 touch-manipulation dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300"
            >
              {idx === 0 ? '-5만' : '-1만'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {[10000, 50000].map((step, idx) => (
            <button
              key={step}
              type="button"
              onClick={() => {
                haptic(5);
                onChange(value + step);
              }}
              className="min-h-[34px] min-w-[44px] rounded-lg border border-ink-900/10 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-white active:scale-95 touch-manipulation dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300"
            >
              {idx === 0 ? '+1만' : '+5만'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BudgetPlanView() {
  const { rows, summary } = useSimulation();
  const setView = useUIStore((s) => s.setView);

  const [subTab, setSubTab] = useState<'budget' | 'accounts'>('budget');

  const settings = usePlannerStore((s) => s.settings);
  const expenses = usePlannerStore((s) => s.expenses);
  const assets = usePlannerStore((s) => s.assets);
  const housings = usePlannerStore((s) => s.housings);
  const loans = usePlannerStore((s) => s.loans);
  const goals = usePlannerStore((s) => s.goals);

  const updateExpense = usePlannerStore((s) => s.updateExpense);
  const addExpense = usePlannerStore((s) => s.addExpense);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const duplicateItem = usePlannerStore((s) => s.duplicateItem);
  const updateAsset = usePlannerStore((s) => s.updateAsset);
  const addAsset = usePlannerStore((s) => s.addAsset);
  const updateHousing = usePlannerStore((s) => s.updateHousing);
  const addHousing = usePlannerStore((s) => s.addHousing);
  const updateLoan = usePlannerStore((s) => s.updateLoan);
  const addLoan = usePlannerStore((s) => s.addLoan);

  const [editingHousingId, setEditingHousingId] = useState<string | null>(null);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingAssetSeedId, setEditingAssetSeedId] = useState<string | null>(null);

  // 1년차 기준 월 수치 (월 단위 환산: 연간 / 12)
  const firstYear = rows[0];
  const monthlyNetIncome = firstYear ? firstYear.netIncome / 12 : 0;
  const housingCostMonthly = firstYear ? firstYear.housingCost / 12 : 0;
  const loanPaymentMonthly = firstYear ? firstYear.loanPayment / 12 : 0;
  const livingExpenseMonthly = firstYear ? firstYear.livingExpense / 12 : 0;
  const contributionMonthly = firstYear ? firstYear.contribution / 12 : 0;

  const shares = useMemo(
    () =>
      calculateBudgetShares({
        monthlyNetIncome,
        housingCost: housingCostMonthly,
        loanPayment: loanPaymentMonthly,
        livingExpense: livingExpenseMonthly,
        contribution: contributionMonthly,
      }),
    [
      monthlyNetIncome,
      housingCostMonthly,
      loanPaymentMonthly,
      livingExpenseMonthly,
      contributionMonthly,
    ],
  );

  // 프리셋 적용 (지출과 저축 자산 동시 스케일링)
  const handleApplyPreset = (preset: BudgetPresetType) => {
    haptic(10);
    const updatedExpenses = applyBudgetPreset(
      preset,
      monthlyNetIncome,
      expenses,
      housingCostMonthly,
      loanPaymentMonthly,
    );
    for (const exp of updatedExpenses) {
      updateExpense(exp.id, { monthlyAmount: exp.monthlyAmount });
    }
    const updatedAssets = applyBudgetSavingsPreset(preset, monthlyNetIncome, assets);
    for (const a of updatedAssets) {
      updateAsset(a.id, { monthlyContribution: a.monthlyContribution });
    }
  };

  // 저축/투자 자동이체 대상 자산 목록 (보증금 제외한 모든 통장 표시하여 추가/편집이 누락되지 않게 함)
  const contributionAssets = useMemo(
    () => assets.filter((a) => a.type !== 'rentDeposit'),
    [assets],
  );

  // 첫 번째 목표
  const primaryGoal = goals[0];

  const handleAddExpense = () => {
    haptic(5);
    addExpense();
    const latest = usePlannerStore.getState().expenses;
    const newest = latest[latest.length - 1];
    if (newest) setEditingExpenseId(newest.id);
  };

  const handleAddHousing = () => {
    haptic(5);
    addHousing();
    const latest = usePlannerStore.getState().housings;
    const newest = latest[latest.length - 1];
    if (newest) setEditingHousingId(newest.id);
  };

  const handleAddLoan = () => {
    haptic(5);
    addLoan();
    const latest = usePlannerStore.getState().loans;
    const newest = latest[latest.length - 1];
    if (newest) setEditingLoanId(newest.id);
  };

  const handleAddContributionAsset = () => {
    haptic(5);
    addAsset({
      type: 'savings',
      name: '새 저축 통장',
      annualReturnRate: 3.5,
      liquid: true,
      monthlyContribution: 100_000,
    });
    const latest = usePlannerStore.getState().assets;
    const newest = latest[latest.length - 1];
    if (newest) setEditingAssetSeedId(newest.id);
  };

  if (subTab === 'accounts') {
    return (
      <div className="space-y-4">
        {/* 서브 탭 전환기 */}
        <div className="flex items-center justify-between gap-2">
          <div className="segmented w-full sm:w-auto" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={false}
              onClick={() => {
                haptic(5);
                setSubTab('budget');
              }}
              className="segmented-item flex items-center justify-center gap-1.5"
            >
              <Icon name="sliders" className="h-4 w-4" />
              <span>월 지출·저축 배분</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={true}
              onClick={() => {
                haptic(5);
                setSubTab('accounts');
              }}
              className="segmented-item flex items-center justify-center gap-1.5"
            >
              <Icon name="wallet" className="h-4 w-4" />
              <span>보유 계좌 · 자산 관리</span>
            </button>
          </div>
        </div>

        <AssetSection />
        <MoneyFlowView rows={rows} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 서브 탭 전환기 */}
      <div className="flex items-center justify-between gap-2">
        <div className="segmented w-full sm:w-auto" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={true}
            onClick={() => {
              haptic(5);
              setSubTab('budget');
            }}
            className="segmented-item flex items-center justify-center gap-1.5"
          >
            <Icon name="sliders" className="h-4 w-4" />
            <span>월 지출·저축 배분</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={false}
            onClick={() => {
              haptic(5);
              setSubTab('accounts');
            }}
            className="segmented-item flex items-center justify-center gap-1.5"
          >
            <Icon name="wallet" className="h-4 w-4" />
            <span>보유 계좌 · 자산 관리</span>
          </button>
        </div>
      </div>

      {/* 1. 고정 월 소득 기준 앵커 카드 */}
      <Card className="relative overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
                  <Icon name="banknote" className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold text-ink-600 dark:text-slate-400">
                  고정된 월 소득 기준점 (100%)
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-slate-100 sm:text-3xl tabular-nums">
                  {formatKRWShort(monthlyNetIncome)}원
                </span>
                <span className="text-xs font-medium text-ink-500 dark:text-slate-400">
                  / 세후 월 실수령액
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setView('income')}
                className="flex items-center gap-1.5 rounded-xl border border-ink-900/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-brand-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span>수입 변경</span>
                <Icon name="chevronRight" className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 배분 상태 요약 바 */}
          <div className="mt-4 rounded-xl border border-ink-900/10 bg-white/60 p-3 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-slate-800/50">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink-700 dark:text-slate-300">
                  총 배분액:
                </span>
                <span className="font-bold text-ink-900 dark:text-slate-100 tabular-nums">
                  {formatKRWShort(shares.totalAllocated.amount)}원 ({shares.totalAllocated.percent.toFixed(0)}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {shares.status === 'surplus' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    남는 자유자금 {formatKRWShort(shares.leftover.amount)}원 ({shares.leftover.percent.toFixed(0)}%)
                  </span>
                )}
                {shares.status === 'deficit' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100/80 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    월 {formatKRWShort(Math.abs(shares.leftover.amount))}원 초과 (조정 필요)
                  </span>
                )}
                {shares.status === 'balanced' && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                    100% 균형 배분 완료
                  </span>
                )}
              </div>
            </div>

            {/* 실시간 누적 스택 바 */}
            <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-ink-200/50 dark:bg-slate-700/50 shadow-inner">
              <div
                style={{ width: `${Math.min(100, Math.max(0, shares.housing.percent))}%`, backgroundColor: FLOW_COLORS.housing }}
                title={`주거비: ${shares.housing.percent.toFixed(1)}%`}
              />
              <div
                style={{ width: `${Math.min(100, Math.max(0, shares.loan.percent))}%`, backgroundColor: FLOW_COLORS.loan }}
                title={`대출상환: ${shares.loan.percent.toFixed(1)}%`}
              />
              <div
                style={{ width: `${Math.min(100, Math.max(0, shares.living.percent))}%`, backgroundColor: FLOW_COLORS.living }}
                title={`생활비: ${shares.living.percent.toFixed(1)}%`}
              />
              <div
                style={{ width: `${Math.min(100, Math.max(0, shares.contribution.percent))}%`, backgroundColor: FLOW_COLORS.contribution }}
                title={`저축·투자: ${shares.contribution.percent.toFixed(1)}%`}
              />
              {shares.leftover.percent > 0 && (
                <div
                  style={{ width: `${Math.min(100, shares.leftover.percent)}%`, backgroundColor: FLOW_COLORS.leftover }}
                  title={`자유 여유자금: ${shares.leftover.percent.toFixed(1)}%`}
                />
              )}
            </div>

            {/* 범례 */}
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FLOW_COLORS.housing }} />
                주거 {shares.housing.percent.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FLOW_COLORS.loan }} />
                대출 {shares.loan.percent.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FLOW_COLORS.living }} />
                생활비 {shares.living.percent.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FLOW_COLORS.contribution }} />
                저축·투자 {shares.contribution.percent.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FLOW_COLORS.leftover }} />
                여유 {Math.max(0, shares.leftover.percent).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* 프리셋 원클릭 적용 */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink-500 dark:text-slate-400 mr-1">
              배분 프리셋:
            </span>
            {BUDGET_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p.id)}
                className="rounded-lg border border-ink-900/10 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-ink-700 shadow-xs backdrop-blur-xs transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800"
                title={p.desc}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* 실시간 목표 달성 임팩트 카드 */}
          {primaryGoal && (
            <div className="mt-3.5 flex items-center gap-2.5 rounded-xl bg-accent-500/10 p-2.5 text-xs text-accent-800 dark:bg-accent-400/10 dark:text-accent-300">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white">
                <Icon name="target" className="h-3 w-3" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  목표 &lsquo;{primaryGoal.name}&rsquo; ({formatKRWShort(primaryGoal.amount)}원)
                </p>
                <p className="text-[11px] opacity-90">
                  현재 저축 계획 적용 시 첫 해 저축률{' '}
                  <strong>{summary.savingsRate.toFixed(1)}%</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 2단 멘탈 모델: 1. 필수 및 고정 지출 */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Icon name="receipt" className="h-3.5 w-3.5" />
          </span>
          <h3 className="break-keep text-xs font-bold text-ink-800 dark:text-slate-200">
            1. 필수 및 고정 지출 (주거비 · 대출 · 생활비)
          </h3>
        </div>

        {/* 1. 주거비 */}
        <Card>
          <CardHeader
            title="주거비 (월세 · 관리비 · 보증금)"
            description={`월 소득의 ${shares.housing.percent.toFixed(1)}% (${formatKRWShort(shares.housing.amount)}원)`}
            action={
              <button
                type="button"
                onClick={handleAddHousing}
                className="flex items-center gap-1 rounded-xl border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-xs backdrop-blur-xs transition hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/80 dark:text-amber-300"
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                <span>주거 추가</span>
              </button>
            }
          />
          <div className="p-4 space-y-3">
            {housings.length === 0 ? (
              <p className="text-xs text-ink-400 dark:text-slate-500 italic">등록된 주거 계약이 없습니다.</p>
            ) : (
              housings.map((h) => {
                const isEditing = editingHousingId === h.id;
                return (
                  <div
                    key={h.id}
                    className="rounded-xl border border-ink-900/10 bg-white/60 p-3.5 text-xs backdrop-blur-xs dark:border-white/10 dark:bg-slate-800/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-[180px] flex-1 items-center gap-1.5">
                        <input
                          type="text"
                          value={h.name}
                          onChange={(e) => updateHousing(h.id, { name: e.target.value })}
                          placeholder="주거 계약 이름"
                          aria-label="주거 계약 이름"
                          className="min-w-[90px] flex-1 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-xs font-bold text-ink-900 transition hover:border-ink-900/15 hover:bg-white/80 focus:border-brand-500 focus:bg-white focus:outline-none dark:text-slate-100 dark:hover:border-white/15 dark:hover:bg-slate-900/60 dark:focus:bg-slate-900"
                        />
                        <select
                          value={h.type}
                          onChange={(e) => updateHousing(h.id, { type: e.target.value as HousingType })}
                          aria-label="거주 형태"
                          className="shrink-0 cursor-pointer rounded-md border border-amber-200/80 bg-amber-100/90 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 focus:outline-none dark:border-amber-800/60 dark:bg-amber-950/80 dark:text-amber-300"
                        >
                          {HOUSING_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {h.startYear > 1 && (
                          <span className="shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600 dark:bg-slate-700 dark:text-slate-300">
                            {h.startYear}년차~
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="font-extrabold text-ink-900 dark:text-slate-100 tabular-nums">
                          월 {formatKRWShort(h.monthlyRent + h.monthlyMaintenance)}원
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingHousingId(isEditing ? null : h.id)}
                          className="rounded-lg border border-ink-900/10 bg-white/70 px-2 py-1 text-[11px] font-semibold text-ink-600 hover:bg-ink-100 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          {isEditing ? '접기' : '상세옵션'}
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateItem('housings', h.id)}
                          className="btn-icon h-7 w-7 text-ink-400 hover:text-ink-700 dark:text-slate-500"
                          title="복제"
                          aria-label="주거 계약 복제"
                        >
                          <Icon name="copy" className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem('housings', h.id)}
                          className="btn-icon h-7 w-7 text-ink-400 hover:text-rose-600 dark:text-slate-500"
                          title="삭제"
                          aria-label="주거 계약 삭제"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 px-1.5 break-keep text-[11px] text-ink-500 dark:text-slate-400">
                      보증금 {formatKRWShort(h.deposit)}원 · 월세 {formatKRWShort(h.monthlyRent)}원 · 관리비 {formatKRWShort(h.monthlyMaintenance)}원 (연 {h.annualIncreaseRate}% 상승)
                    </p>

                    {isEditing && (
                      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-ink-100 pt-3 dark:border-white/10">
                        <Field label="계약 이름">
                          <TextInput
                            value={h.name}
                            onChange={(name) => updateHousing(h.id, { name })}
                            placeholder="계약 이름"
                          />
                        </Field>
                        <Field label="거주 형태">
                          <Select
                            value={h.type}
                            onChange={(type) => updateHousing(h.id, { type })}
                            options={HOUSING_TYPE_OPTIONS}
                          />
                        </Field>
                        <Field label="보증금" className="col-span-2">
                          <MoneyInput
                            value={h.deposit}
                            onChange={(deposit) => updateHousing(h.id, { deposit })}
                          />
                        </Field>
                        <Field label="월세">
                          <MoneyInput
                            value={h.monthlyRent}
                            onChange={(monthlyRent) => updateHousing(h.id, { monthlyRent })}
                          />
                        </Field>
                        <Field label="관리비 등">
                          <MoneyInput
                            value={h.monthlyMaintenance}
                            onChange={(monthlyMaintenance) =>
                              updateHousing(h.id, { monthlyMaintenance })
                            }
                          />
                        </Field>
                        <Field label="연 상승률" className="col-span-2">
                          <PercentInput
                            value={h.annualIncreaseRate}
                            onChange={(annualIncreaseRate) =>
                              updateHousing(h.id, { annualIncreaseRate })
                            }
                            min={-20}
                            max={30}
                          />
                        </Field>
                        <Field label="시작 연차">
                          <CountInput
                            value={h.startYear}
                            onChange={(startYear) => updateHousing(h.id, { startYear })}
                            min={1}
                            max={40}
                          />
                        </Field>
                        <Field label="종료 연차" hint="0 = 끝까지">
                          <CountInput
                            value={h.endYear ?? 0}
                            onChange={(v) =>
                              updateHousing(h.id, { endYear: v === 0 ? null : v })
                            }
                            min={0}
                            max={40}
                            blankOnZero
                            placeholder="끝까지"
                          />
                        </Field>
                        <MemoField
                          value={h.memo ?? ''}
                          onChange={(memo) => updateHousing(h.id, { memo })}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* 2. 대출 상환 */}
        <Card>
          <CardHeader
            title="대출 상환 (원리금 · 이자 상환)"
            description={`월 소득의 ${shares.loan.percent.toFixed(1)}% (${formatKRWShort(shares.loan.amount)}원)`}
            action={
              <button
                type="button"
                onClick={handleAddLoan}
                className="flex items-center gap-1 rounded-xl border border-rose-200/80 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 shadow-xs backdrop-blur-xs transition hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/80 dark:text-rose-300"
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                <span>대출 추가</span>
              </button>
            }
          />
          <div className="p-4 space-y-3">
            {loans.length === 0 ? (
              <p className="text-xs text-ink-400 dark:text-slate-500 italic">상환 중인 대출이 없습니다.</p>
            ) : (
              loans.map((l) => {
                const isEditing = editingLoanId === l.id;
                const graceYears = l.graceYears ?? 0;
                const estimatedMonthly = estimateMonthlyLoanPayment(l);

                return (
                  <div
                    key={l.id}
                    className="rounded-xl border border-ink-900/10 bg-white/60 p-3.5 text-xs backdrop-blur-xs dark:border-white/10 dark:bg-slate-800/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-[180px] flex-1 items-center gap-1.5">
                        <input
                          type="text"
                          value={l.name}
                          onChange={(e) => updateLoan(l.id, { name: e.target.value })}
                          placeholder="대출 이름"
                          aria-label="대출 이름"
                          className="min-w-[90px] flex-1 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-xs font-bold text-ink-900 transition hover:border-ink-900/15 hover:bg-white/80 focus:border-brand-500 focus:bg-white focus:outline-none dark:text-slate-100 dark:hover:border-white/15 dark:hover:bg-slate-900/60 dark:focus:bg-slate-900"
                        />
                        <select
                          value={l.repaymentType}
                          onChange={(e) =>
                            updateLoan(l.id, { repaymentType: e.target.value as RepaymentType })
                          }
                          aria-label="상환 방식"
                          className="shrink-0 cursor-pointer rounded-md border border-rose-200/80 bg-rose-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 focus:outline-none dark:border-rose-800/60 dark:bg-rose-950/70 dark:text-rose-300"
                        >
                          {REPAYMENT_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {l.isDepositLinked && (
                          <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                            보증금 상환
                          </span>
                        )}
                        {l.startYear > 1 && (
                          <span className="shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600 dark:bg-slate-700 dark:text-slate-300">
                            {l.startYear}년차~
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                          월 {formatKRWShort(estimatedMonthly)}원
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingLoanId(isEditing ? null : l.id)}
                          className="rounded-lg border border-ink-900/10 bg-white/70 px-2 py-1 text-[11px] font-semibold text-ink-600 hover:bg-ink-100 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          {isEditing ? '접기' : '상세옵션'}
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateItem('loans', l.id)}
                          className="btn-icon h-7 w-7 text-ink-400 hover:text-ink-700 dark:text-slate-500"
                          title="복제"
                          aria-label="대출 복제"
                        >
                          <Icon name="copy" className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem('loans', l.id)}
                          className="btn-icon h-7 w-7 text-ink-400 hover:text-rose-600 dark:text-slate-500"
                          title="삭제"
                          aria-label="대출 삭제"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 px-1.5 break-keep text-[11px] text-ink-500 dark:text-slate-400">
                      원금 {formatKRWShort(l.principal)}원 · 연 {l.annualRate}% · {l.termYears}년 만기
                      {l.isDepositLinked && ' (만기 원금은 보증금에서 상환)'}
                    </p>

                    {isEditing && (
                      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-ink-100 pt-3 dark:border-white/10">
                        <Field label="대출 이름">
                          <TextInput
                            value={l.name}
                            onChange={(name) => updateLoan(l.id, { name })}
                            placeholder="대출 이름"
                          />
                        </Field>
                        <Field label="상환 방식">
                          <Select
                            value={l.repaymentType}
                            onChange={(repaymentType) =>
                              updateLoan(l.id, { repaymentType })
                            }
                            options={REPAYMENT_TYPE_OPTIONS}
                          />
                        </Field>
                        <Field label="대출 원금">
                          <MoneyInput
                            value={l.principal}
                            onChange={(principal) => updateLoan(l.id, { principal })}
                          />
                        </Field>
                        <Field label="연 이자율">
                          <PercentInput
                            value={l.annualRate}
                            onChange={(annualRate) => updateLoan(l.id, { annualRate })}
                            min={0}
                            max={30}
                          />
                        </Field>
                        <Field label="완납 시점" hint={`총 ${l.termYears}년`}>
                          <CountInput
                            value={l.startYear + l.termYears - 1}
                            onChange={(endYear) =>
                              updateLoan(l.id, {
                                termYears: Math.max(1, endYear - l.startYear + 1),
                              })
                            }
                            min={l.startYear}
                            max={40}
                            suffix="년 후"
                          />
                        </Field>
                        <Field label="거치 기간" hint="이자만 내는 기간">
                          <CountInput
                            value={graceYears}
                            onChange={(g) =>
                              updateLoan(l.id, {
                                graceYears: Math.min(g, Math.max(0, l.termYears - 1)),
                              })
                            }
                            min={0}
                            max={Math.max(0, l.termYears - 1)}
                            suffix="년"
                          />
                        </Field>
                        <Field
                          label="대출 실행/상환 시작 연차"
                          hint={
                            l.startYear > 1
                              ? `${currentYear() + l.startYear - 1}년부터`
                              : '지금부터'
                          }
                          className="col-span-2"
                        >
                          <CountInput
                            value={l.startYear}
                            onChange={(startYear) => updateLoan(l.id, { startYear })}
                            min={1}
                            max={40}
                          />
                        </Field>

                        {l.repaymentType === 'fixedMonthly' && (
                          <Field label="월 상환액" className="col-span-2">
                            <MoneyInput
                              value={l.monthlyPayment}
                              onChange={(monthlyPayment) =>
                                updateLoan(l.id, { monthlyPayment })
                              }
                            />
                          </Field>
                        )}

                        <div className="col-span-2 space-y-2 pt-1">
                          <Toggle
                            checked={l.isDepositLinked ?? false}
                            onChange={(isDepositLinked) =>
                              updateLoan(l.id, { isDepositLinked })
                            }
                            label="보증금으로 대출 자동 상환"
                            description="전세 만기 시 돌려받는 보증금으로 대출을 갚아요 (내 현금 지출 없음)."
                          />

                          {l.repaymentType === 'interestOnly' && (
                            <Toggle
                              checked={l.autoRenew ?? false}
                              onChange={(autoRenew) => updateLoan(l.id, { autoRenew })}
                              label="만기 시 원금 상환 없이 연장"
                              description="만기 시 원금을 갚지 않고 이자만 계속 납부합니다."
                            />
                          )}
                        </div>

                        <MemoField
                          value={l.memo ?? ''}
                          onChange={(memo) => updateLoan(l.id, { memo })}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* 3. 생활비 (와이드 슬라이더 + 이름/카테고리/상세 커스텀 옵션) */}
        <Card>
          <CardHeader
            title="생활비 한도 & 상세 설정 (식비 · 교통 · 여가 등)"
            description={`월 소득의 ${shares.living.percent.toFixed(1)}% (${formatKRWShort(shares.living.amount)}원)`}
            action={
              <button
                type="button"
                onClick={handleAddExpense}
                className="flex items-center gap-1 rounded-xl border border-brand-200/80 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 shadow-xs backdrop-blur-xs transition hover:bg-brand-100 dark:border-brand-800/60 dark:bg-brand-950/80 dark:text-brand-300"
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                <span>지출 추가</span>
              </button>
            }
          />
          <div className="p-4 space-y-3.5">
            {expenses.length === 0 ? (
              <p className="text-xs text-ink-400 dark:text-slate-500 italic">등록된 고정 지출이 없습니다.</p>
            ) : (
              expenses.map((exp) => {
                const isEditing = editingExpenseId === exp.id;
                const expShare = monthlyNetIncome > 0 ? (exp.monthlyAmount / monthlyNetIncome) * 100 : 0;
                const maxRange = Math.max(100 * 10000, Math.round((monthlyNetIncome * 0.5) / 10000) * 10000);

                return (
                  <div
                    key={exp.id}
                    className="rounded-xl border border-ink-900/10 bg-white/60 p-3.5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-slate-800/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-[170px] flex-1 items-center gap-1.5">
                        <input
                          type="text"
                          value={exp.name}
                          onChange={(e) => updateExpense(exp.id, { name: e.target.value })}
                          placeholder="지출 이름 입력"
                          aria-label="지출 이름"
                          className="min-w-[85px] flex-1 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-xs font-bold text-ink-900 transition hover:border-ink-900/15 hover:bg-white/80 focus:border-brand-500 focus:bg-white focus:outline-none dark:text-slate-100 dark:hover:border-white/15 dark:hover:bg-slate-900/60 dark:focus:bg-slate-900"
                        />
                        <select
                          value={exp.category}
                          onChange={(e) =>
                            updateExpense(exp.id, { category: e.target.value as ExpenseCategory })
                          }
                          aria-label="지출 카테고리"
                          className="shrink-0 cursor-pointer rounded-md border border-ink-900/10 bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-700 focus:outline-none dark:border-white/10 dark:bg-slate-700 dark:text-slate-200"
                        >
                          {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {exp.startYear > 1 && (
                          <span className="shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600 dark:bg-slate-700 dark:text-slate-300">
                            {exp.startYear}년차~
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="whitespace-nowrap rounded-full bg-orange-100/80 px-2 py-0.5 text-[10px] font-bold text-orange-800 dark:bg-orange-950/80 dark:text-orange-300">
                          월급의 {expShare.toFixed(1)}%
                        </span>
                        <span className="font-extrabold tabular-nums text-xs text-ink-900 dark:text-slate-100">
                          {formatKRWShort(exp.monthlyAmount)}원
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingExpenseId(isEditing ? null : exp.id)}
                          className="rounded-lg border border-ink-900/10 bg-white/70 px-2 py-1 text-[11px] font-semibold text-ink-600 hover:bg-ink-100 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          {isEditing ? '접기' : '상세옵션'}
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateItem('expenses', exp.id)}
                          className="btn-icon h-7 w-7 text-ink-400 hover:text-ink-700 dark:text-slate-500"
                          title="복제"
                          aria-label="지출 항목 복제"
                        >
                          <Icon name="copy" className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem('expenses', exp.id)}
                          className="btn-icon h-7 w-7 text-ink-400 hover:text-rose-600 dark:text-slate-500"
                          title="삭제"
                          aria-label="지출 항목 삭제"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 와이드 슬라이더 및 빠른 증감 칩 */}
                    <FastStepAdjuster
                      value={exp.monthlyAmount}
                      onChange={(val) => updateExpense(exp.id, { monthlyAmount: val })}
                      max={maxRange}
                      label={`${exp.name} 월 지출액`}
                    />

                    {/* 지출 이름 · 카테고리 · 직접입력 · 연차 · 개별 물가상승률 커스텀 옵션 */}
                    {isEditing && (
                      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-ink-100 pt-3 dark:border-white/10">
                        <Field label="지출 이름">
                          <TextInput
                            value={exp.name}
                            onChange={(name) => updateExpense(exp.id, { name })}
                            placeholder="예: 식비, 구독료, 학원비"
                          />
                        </Field>
                        <Field label="카테고리">
                          <Select
                            value={exp.category}
                            onChange={(category) => updateExpense(exp.id, { category })}
                            options={EXPENSE_CATEGORY_OPTIONS}
                          />
                        </Field>
                        <Field label="월 지출액 직접 입력" className="col-span-2">
                          <MoneyInput
                            value={exp.monthlyAmount}
                            onChange={(monthlyAmount) =>
                              updateExpense(exp.id, { monthlyAmount })
                            }
                          />
                        </Field>
                        <Field label="시작 연차">
                          <CountInput
                            value={exp.startYear}
                            onChange={(startYear) =>
                              updateExpense(exp.id, { startYear })
                            }
                            min={1}
                            max={40}
                          />
                        </Field>
                        <Field label="종료 연차" hint="0 = 끝까지">
                          <CountInput
                            value={exp.endYear ?? 0}
                            onChange={(v) =>
                              updateExpense(exp.id, { endYear: v === 0 ? null : v })
                            }
                            min={0}
                            max={40}
                            blankOnZero
                            placeholder="끝까지"
                          />
                        </Field>
                        <div className="col-span-2">
                          <Toggle
                            checked={exp.inflationRate === null}
                            onChange={(useDefault) =>
                              updateExpense(exp.id, {
                                inflationRate: useDefault ? null : settings.inflationRate,
                              })
                            }
                            label={`기본 물가상승률 따르기 (${settings.inflationRate}%)`}
                          />
                        </div>
                        {exp.inflationRate !== null && (
                          <Field label="개별 물가상승률" className="col-span-2">
                            <PercentInput
                              value={exp.inflationRate}
                              onChange={(v) =>
                                updateExpense(exp.id, { inflationRate: v })
                              }
                              min={-20}
                              max={30}
                            />
                          </Field>
                        )}
                        <MemoField
                          value={exp.memo ?? ''}
                          onChange={(memo) => updateExpense(exp.id, { memo })}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* 2단 멘탈 모델: 2. 저축 및 투자 이체 */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Icon name="wallet" className="h-3.5 w-3.5" />
          </span>
          <h3 className="break-keep text-xs font-bold text-ink-800 dark:text-slate-200">
            2. 저축 및 투자 이체 (목적 통장 자동이체 & 비상금)
          </h3>
        </div>

        {/* 4. 저축 & 투자 자동이체 (현재 잔액 + 매월 이체액 + 상세 옵션 동시 관리) */}
        <Card>
          <CardHeader
            title="목적 통장 · 투자 계좌 (청약 · ISA · 연금 · 적금 · ETF)"
            description={`월 소득의 ${shares.contribution.percent.toFixed(1)}% (${formatKRWShort(shares.contribution.amount)}원) 이체 중`}
            action={
              <button
                type="button"
                onClick={handleAddContributionAsset}
                className="flex items-center gap-1 rounded-xl border border-blue-200/80 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-xs backdrop-blur-xs transition hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/80 dark:text-blue-300"
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                <span>통장 추가</span>
              </button>
            }
          />
          <div className="p-4 space-y-3.5">
            {contributionAssets.length === 0 ? (
              <p className="text-xs text-ink-400 dark:text-slate-500 italic">등록된 저축/투자 통장이 없습니다.</p>
            ) : (
              contributionAssets.map((asset) => {
                const isEditing = editingAssetSeedId === asset.id;
                const hasMaturity = HAS_MATURITY_TYPES.includes(asset.type);
                const assetShare = monthlyNetIncome > 0 ? (asset.monthlyContribution / monthlyNetIncome) * 100 : 0;
                const maxRange = Math.max(100 * 10000, Math.round((monthlyNetIncome * 0.5) / 10000) * 10000);

                return (
                  <div
                    key={asset.id}
                    className="rounded-xl border border-blue-200/60 bg-blue-50/40 p-3.5 shadow-xs backdrop-blur-md dark:border-blue-900/40 dark:bg-slate-800/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-[180px] flex-1 items-center gap-1.5">
                        <input
                          type="text"
                          value={asset.name}
                          onChange={(e) => updateAsset(asset.id, { name: e.target.value })}
                          placeholder="통장 이름 입력"
                          aria-label="통장 이름"
                          className="min-w-[85px] flex-1 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-xs font-bold text-ink-900 transition hover:border-ink-900/15 hover:bg-white/80 focus:border-brand-500 focus:bg-white focus:outline-none dark:text-slate-100 dark:hover:border-white/15 dark:hover:bg-slate-900/60 dark:focus:bg-slate-900"
                        />
                        <select
                          value={asset.type}
                          onChange={(e) => updateAsset(asset.id, { type: e.target.value as AssetType })}
                          aria-label="통장 분류"
                          className="shrink-0 cursor-pointer rounded-md border border-brand-200/80 bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 focus:outline-none dark:border-brand-800/60 dark:bg-brand-950 dark:text-brand-300"
                        >
                          {ASSET_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <span className="shrink-0 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          연 {asset.annualReturnRate}%
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded-full bg-blue-100/90 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                          월급의 {assetShare.toFixed(1)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingAssetSeedId(isEditing ? null : asset.id)}
                          className="rounded-lg border border-ink-900/10 bg-white/70 px-2 py-1 text-[11px] font-semibold text-ink-600 hover:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {isEditing ? '접기' : '상세옵션'}
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateItem('assets', asset.id)}
                          className="btn-icon h-7 w-7 text-ink-400 hover:text-ink-700 dark:text-slate-500"
                          title="복제"
                          aria-label="통장 복제"
                        >
                          <Icon name="copy" className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem('assets', asset.id)}
                          className="btn-icon h-7 w-7 text-ink-400 hover:text-rose-600 dark:text-slate-500"
                          title="삭제"
                          aria-label="통장 삭제"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 통장 현재 잔액 & 이체 금액 정보 */}
                    <div className="mt-2.5 flex items-center justify-between rounded-lg bg-white/60 px-2.5 py-1.5 text-xs dark:bg-slate-900/60">
                      <div>
                        <span className="text-[10px] text-ink-500 dark:text-slate-400">현재 통장 잔액: </span>
                        <strong className="font-extrabold tabular-nums text-ink-900 dark:text-slate-100">
                          {formatKRWShort(asset.amount)}원
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-500 dark:text-slate-400">매월 자동이체: </span>
                        <strong className="font-extrabold tabular-nums text-brand-700 dark:text-brand-400">
                          {formatKRWShort(asset.monthlyContribution)}원/월
                        </strong>
                      </div>
                    </div>

                    {/* 이체 금액 조절 와이드 슬라이더 & 스텝 칩 */}
                    <FastStepAdjuster
                      value={asset.monthlyContribution}
                      onChange={(val) => updateAsset(asset.id, { monthlyContribution: val })}
                      max={maxRange}
                      label={`${asset.name} 월 자동이체`}
                    />

                    {/* 통장 이름·분류·잔액·수익률·만기 등 전체 커스텀 옵션 */}
                    {isEditing && (
                      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-blue-200/50 pt-3 dark:border-white/10">
                        <Field label="통장 이름">
                          <TextInput
                            value={asset.name}
                            onChange={(name) => updateAsset(asset.id, { name })}
                            placeholder="통장 이름"
                          />
                        </Field>
                        <Field label="분류">
                          <Select
                            value={asset.type}
                            onChange={(type) => updateAsset(asset.id, { type })}
                            options={ASSET_TYPE_OPTIONS}
                          />
                        </Field>
                        <Field label="현재 보유 잔액">
                          <MoneyInput
                            value={asset.amount}
                            onChange={(amount) => updateAsset(asset.id, { amount })}
                          />
                        </Field>
                        <Field label="연 기대수익률">
                          <PercentInput
                            value={asset.annualReturnRate}
                            onChange={(annualReturnRate) =>
                              updateAsset(asset.id, { annualReturnRate })
                            }
                            min={-30}
                            max={50}
                          />
                        </Field>
                        <Field label="월 자동이체 직접 입력">
                          <MoneyInput
                            value={asset.monthlyContribution}
                            onChange={(monthlyContribution) =>
                              updateAsset(asset.id, { monthlyContribution })
                            }
                          />
                        </Field>
                        <Field label="시작 연차" hint="1 = 지금부터">
                          <CountInput
                            value={asset.startYear ?? 1}
                            onChange={(startYear) => updateAsset(asset.id, { startYear })}
                            min={1}
                            max={40}
                          />
                        </Field>

                        {hasMaturity && (
                          <>
                            <Field label="만기 시점" hint="비우면 미설정">
                              <CountInput
                                value={asset.maturityYear ?? 0}
                                onChange={(v) =>
                                  updateAsset(asset.id, { maturityYear: v > 0 ? v : null })
                                }
                                min={0}
                                max={40}
                                suffix="년 후"
                                blankOnZero
                                placeholder="만기 없음"
                              />
                            </Field>
                            {settings.currentAge !== null ? (
                              <Field label="만기 나이" hint="예: 만 55세">
                                <CountInput
                                  value={asset.maturityAge ?? 0}
                                  onChange={(v) =>
                                    updateAsset(asset.id, { maturityAge: v > 0 ? v : null })
                                  }
                                  min={0}
                                  max={100}
                                  suffix="세"
                                  blankOnZero
                                  placeholder="미지정"
                                />
                              </Field>
                            ) : (
                              <div />
                            )}
                          </>
                        )}

                        <div className="col-span-2 space-y-2 pt-1">
                          <Toggle
                            checked={asset.liquid}
                            onChange={(liquid) => updateAsset(asset.id, { liquid })}
                            label="자유 입출금 가능"
                            description="보증금·연금·청약 등 묶인 돈은 꺼주세요."
                          />
                          {!asset.liquid && hasMaturity && (
                            <Toggle
                              checked={asset.convertLiquidOnMaturity ?? true}
                              onChange={(convertLiquidOnMaturity) =>
                                updateAsset(asset.id, { convertLiquidOnMaturity })
                              }
                              label="만기 시 자유 입출금으로 전환"
                              description="만기 시 즉시 인출 가능한 현금으로 전환됩니다."
                            />
                          )}
                        </div>

                        <MemoField
                          value={asset.memo ?? ''}
                          onChange={(memo) => updateAsset(asset.id, { memo })}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* 5. 비상금 파킹통장 (남은 여유자금) */}
        <Card className="border-emerald-300/80 bg-gradient-to-br from-emerald-50/60 to-white/70 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-slate-900/70">
          <CardHeader
            title="비상금 파킹통장 (지출과 자동이체 후 남는 돈)"
            description={`월 소득의 ${Math.max(0, shares.leftover.percent).toFixed(1)}% (${formatKRWShort(Math.max(0, shares.leftover.amount))}원/월)`}
            action={
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                연 {settings.savingsReturnRate}% 복리 운용
              </span>
            }
          />
          <div className="p-4 text-xs text-ink-600 dark:text-slate-400 space-y-1.5">
            <p className="break-keep leading-relaxed">
              지출과 자동이체 후 남은 <strong>{formatKRWShort(Math.max(0, shares.leftover.amount))}원</strong>은 비상금 통장에 자동 적립되어 복리로 불어납니다.
            </p>
            {shares.status === 'deficit' && (
              <p className="break-keep font-semibold text-rose-600 dark:text-rose-400">
                ⚠️ 월 지출과 자동이체가 소득을 초과하여 매달 비상금이 감소합니다. 지출 또는 자동이체를 조정해 주세요.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* 3. 기본 가정 (나이 · 물가 상승률 · 여유자금 수익률 · 세금 방식 등 커스텀 설정) */}
      <PeriodSection />
    </div>
  );
}
