import { useMemo, useState } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { useSimulation } from '@/hooks/useSimulation';
import { useUIStore } from '@/store/uiStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { MoneyInput } from '@/components/ui/Fields';
import { formatKRWShort } from '@/utils/format';
import { haptic } from '@/utils/feedback';
import { MoneyFlowView } from '@/components/result/MoneyFlowView';
import {
  calculateBudgetShares,
  applyBudgetPreset,
  applyBudgetSavingsPreset,
  BUDGET_PRESETS,
  type BudgetPresetType,
} from '@/utils/budget';
import { ASSET_TYPE_LABEL, EXPENSE_CATEGORY_LABEL } from '@/types/planner';

const FLOW_COLORS = {
  housing: '#eda100', // 주거비 (yellow)
  loan: '#d03b3b', // 대출 상환 (red)
  living: '#eb6834', // 생활비 (orange)
  contribution: '#2a78d6', // 자동이체 저축 (blue)
  leftover: '#10b981', // 여유자금 (emerald)
} as const;

/** 원터치 증감 칩 및 와이드 슬라이더 */
function FastStepAdjuster({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (val: number) => void;
  max: number;
}) {
  return (
    <div className="mt-2.5 space-y-2.5" data-no-swipe>
      <input
        type="range"
        min={0}
        max={max}
        step={10000}
        value={value}
        onChange={(e) => {
          haptic(3);
          onChange(Number(e.target.value));
        }}
        className="h-8 w-full cursor-pointer py-2 touch-none"
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
              disabled={value + step > max * 1.5}
              onClick={() => {
                haptic(5);
                onChange(value + step);
              }}
              className="min-h-[34px] min-w-[44px] rounded-lg border border-ink-900/10 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-white active:scale-95 disabled:opacity-30 touch-manipulation dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300"
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

  const expenses = usePlannerStore((s) => s.expenses);
  const assets = usePlannerStore((s) => s.assets);
  const housings = usePlannerStore((s) => s.housings);
  const loans = usePlannerStore((s) => s.loans);
  const goals = usePlannerStore((s) => s.goals);

  const updateExpense = usePlannerStore((s) => s.updateExpense);
  const addExpense = usePlannerStore((s) => s.addExpense);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const updateAsset = usePlannerStore((s) => s.updateAsset);
  const addAsset = usePlannerStore((s) => s.addAsset);
  const updateHousing = usePlannerStore((s) => s.updateHousing);
  const updateLoan = usePlannerStore((s) => s.updateLoan);

  const [editingHousingId, setEditingHousingId] = useState<string | null>(null);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
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

  // 저축/투자 자동이체 대상 자산 목록
  const contributionAssets = useMemo(
    () => assets.filter((a) => a.monthlyContribution > 0 || ['savings', 'isa', 'pension', 'housingSubscription'].includes(a.type)),
    [assets],
  );

  // 첫 번째 목표
  const primaryGoal = goals[0];

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
              <span>보유 계좌 잔액</span>
            </button>
          </div>
        </div>

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
            <span>보유 계좌 잔액</span>
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
            title="주거비 (월세 · 관리비)"
            description={`월 소득의 ${shares.housing.percent.toFixed(1)}% (${formatKRWShort(shares.housing.amount)}원)`}
            action={
              <span className="rounded-full bg-amber-100/80 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                고정 주거비
              </span>
            }
          />
          <div className="p-4 space-y-3">
            {housings.length === 0 ? (
              <p className="text-xs text-ink-400 dark:text-slate-500 italic">등록된 주거 계약이 없습니다.</p>
            ) : (
              housings.map((h) => (
                <div key={h.id} className="rounded-xl border border-ink-900/10 bg-white/50 p-3 text-xs backdrop-blur-xs dark:border-white/10 dark:bg-slate-800/50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-ink-900 dark:text-slate-100">{h.name}</span>
                      <p className="mt-0.5 break-keep text-[11px] text-ink-500 dark:text-slate-400">
                        보증금 {formatKRWShort(h.deposit)}원 · 월세 {formatKRWShort(h.monthlyRent)}원 · 관리비 {formatKRWShort(h.monthlyMaintenance)}원
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-extrabold text-ink-900 dark:text-slate-100 tabular-nums">
                        월 {formatKRWShort(h.monthlyRent + h.monthlyMaintenance)}원
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingHousingId(editingHousingId === h.id ? null : h.id)}
                        className="rounded-lg border border-ink-900/10 px-2 py-1 text-[11px] font-semibold text-ink-600 hover:bg-ink-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        {editingHousingId === h.id ? '완료' : '수정'}
                      </button>
                    </div>
                  </div>

                  {editingHousingId === h.id && (
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-ink-100 pt-3 dark:border-white/10">
                      <div>
                        <label className="text-[10px] text-ink-500 dark:text-slate-400">월세 (원)</label>
                        <MoneyInput
                          value={h.monthlyRent}
                          onChange={(v) => updateHousing(h.id, { monthlyRent: v })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-ink-500 dark:text-slate-400">관리비 (원)</label>
                        <MoneyInput
                          value={h.monthlyMaintenance}
                          onChange={(v) => updateHousing(h.id, { monthlyMaintenance: v })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* 2. 대출 상환 */}
        <Card>
          <CardHeader
            title="대출 상환 (원리금 상환)"
            description={`월 소득의 ${shares.loan.percent.toFixed(1)}% (${formatKRWShort(shares.loan.amount)}원)`}
            action={
              <span className="rounded-full bg-rose-100/80 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                부채 상환
              </span>
            }
          />
          <div className="p-4 space-y-3">
            {loans.length === 0 ? (
              <p className="text-xs text-ink-400 dark:text-slate-500 italic">상환 중인 대출이 없습니다.</p>
            ) : (
              loans.map((l) => (
                <div key={l.id} className="rounded-xl border border-ink-900/10 bg-white/50 p-3 text-xs backdrop-blur-xs dark:border-white/10 dark:bg-slate-800/50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-ink-900 dark:text-slate-100">{l.name}</span>
                        {l.isDepositLinked && (
                          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                            보증금 상환
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 break-keep text-[11px] text-ink-500 dark:text-slate-400">
                        원금 {formatKRWShort(l.principal)}원 · 연 {l.annualRate}%
                        {l.isDepositLinked && ' (원금은 만기 시 보증금에서 상환)'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                        월 {formatKRWShort(loanPaymentMonthly)}원
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingLoanId(editingLoanId === l.id ? null : l.id)}
                        className="rounded-lg border border-ink-900/10 px-2 py-1 text-[11px] font-semibold text-ink-600 hover:bg-ink-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        {editingLoanId === l.id ? '완료' : '수정'}
                      </button>
                    </div>
                  </div>

                  {editingLoanId === l.id && (
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-ink-100 pt-3 dark:border-white/10">
                      <div>
                        <label className="text-[10px] text-ink-500 dark:text-slate-400">대출 원금 (원)</label>
                        <MoneyInput
                          value={l.principal}
                          onChange={(v) => updateLoan(l.id, { principal: v })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-ink-500 dark:text-slate-400">월 상환액 직접 지정 (0이면 자동계산)</label>
                        <MoneyInput
                          value={l.monthlyPayment}
                          onChange={(v) => updateLoan(l.id, { monthlyPayment: v })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* 3. 생활비 (와이드 슬라이더 + 빠른 증감 칩) */}
        <Card>
          <CardHeader
            title="생활비 한도 & 범위 (식비 · 교통 · 여가 등)"
            description={`월 소득의 ${shares.living.percent.toFixed(1)}% (${formatKRWShort(shares.living.amount)}원)`}
            action={
              <button
                type="button"
                onClick={addExpense}
                className="flex items-center gap-1 rounded-xl border border-brand-200/80 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 shadow-xs backdrop-blur-xs transition hover:bg-brand-100 dark:border-brand-800/60 dark:bg-brand-950/80 dark:text-brand-300"
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                <span>지출 추가</span>
              </button>
            }
          />
          <div className="p-4 space-y-3.5">
            {expenses.map((exp) => {
              const expShare = monthlyNetIncome > 0 ? (exp.monthlyAmount / monthlyNetIncome) * 100 : 0;
              const maxRange = Math.max(100 * 10000, Math.round((monthlyNetIncome * 0.5) / 10000) * 10000);

              return (
                <div
                  key={exp.id}
                  className="rounded-xl border border-ink-900/10 bg-white/60 p-3.5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-slate-800/60"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-bold text-ink-900 dark:text-slate-100 text-xs">
                        {exp.name}
                      </span>
                      <span className="shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600 dark:bg-slate-700 dark:text-slate-300">
                        {EXPENSE_CATEGORY_LABEL[exp.category]}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="whitespace-nowrap rounded-full bg-orange-100/80 px-2 py-0.5 text-[10px] font-bold text-orange-800 dark:bg-orange-950/80 dark:text-orange-300">
                        월급의 {expShare.toFixed(1)}%
                      </span>
                      <span className="font-extrabold tabular-nums text-xs text-ink-900 dark:text-slate-100">
                        {formatKRWShort(exp.monthlyAmount)}원
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem('expenses', exp.id)}
                        className="text-ink-400 hover:text-rose-600 dark:text-slate-500"
                        title="삭제"
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
                  />
                </div>
              );
            })}
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

        {/* 4. 저축 & 투자 자동이체 (현재 잔액 + 매월 이체액 동시 관리) */}
        <Card>
          <CardHeader
            title="목적 통장 자동이체 (청약 · ISA · 연금 · 적금)"
            description={`월 소득의 ${shares.contribution.percent.toFixed(1)}% (${formatKRWShort(shares.contribution.amount)}원) 이체 중`}
            action={
              <button
                type="button"
                onClick={addAsset}
                className="flex items-center gap-1 rounded-xl border border-blue-200/80 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-xs backdrop-blur-xs transition hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/80 dark:text-blue-300"
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                <span>통장 추가</span>
              </button>
            }
          />
          <div className="p-4 space-y-3.5">
            {contributionAssets.length === 0 ? (
              <p className="text-xs text-ink-400 dark:text-slate-500 italic">자동이체 중인 저축/투자 통장이 없습니다.</p>
            ) : (
              contributionAssets.map((asset) => {
                const assetShare = monthlyNetIncome > 0 ? (asset.monthlyContribution / monthlyNetIncome) * 100 : 0;
                const maxRange = Math.max(100 * 10000, Math.round((monthlyNetIncome * 0.5) / 10000) * 10000);

                return (
                  <div
                    key={asset.id}
                    className="rounded-xl border border-blue-200/60 bg-blue-50/40 p-3.5 shadow-xs backdrop-blur-md dark:border-blue-900/40 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-900 dark:text-slate-100 text-xs">
                          {asset.name}
                        </span>
                        <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          {ASSET_TYPE_LABEL[asset.type]}
                        </span>
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          연 {asset.annualReturnRate}% 복리
                        </span>
                      </div>

                      <span className="rounded-full bg-blue-100/90 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                        월급의 {assetShare.toFixed(1)}% 이체
                      </span>
                    </div>

                    {/* 통장 현재 잔액 & 이체 금액 정보 */}
                    <div className="mt-2.5 flex items-center justify-between rounded-lg bg-white/60 px-2.5 py-1.5 text-xs dark:bg-slate-900/60">
                      <div>
                        <span className="text-[10px] text-ink-500 dark:text-slate-400">현재 통장 잔액: </span>
                        <strong className="font-extrabold tabular-nums text-ink-900 dark:text-slate-100">
                          {formatKRWShort(asset.amount)}원
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingAssetSeedId(editingAssetSeedId === asset.id ? null : asset.id)}
                        className="text-[10px] text-brand-600 underline dark:text-brand-400"
                      >
                        {editingAssetSeedId === asset.id ? '닫기' : '잔액 수정'}
                      </button>
                    </div>

                    {editingAssetSeedId === asset.id && (
                      <div className="mt-2 border-t border-blue-200/40 pt-2 dark:border-white/10">
                        <label className="text-[10px] text-ink-500 dark:text-slate-400">현재 보유 잔액 (원)</label>
                        <MoneyInput
                          value={asset.amount}
                          onChange={(v) => updateAsset(asset.id, { amount: v })}
                        />
                      </div>
                    )}

                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-[11px] text-ink-500 dark:text-slate-400">매월 자동이체:</span>
                      <span className="font-extrabold tabular-nums text-xs text-brand-700 dark:text-brand-400">
                        {formatKRWShort(asset.monthlyContribution)}원/월
                      </span>
                    </div>

                    {/* 이체 금액 조절 와이드 슬라이더 & 스텝 칩 */}
                    <FastStepAdjuster
                      value={asset.monthlyContribution}
                      onChange={(val) => updateAsset(asset.id, { monthlyContribution: val })}
                      max={maxRange}
                    />
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
                파킹통장 복리 운용
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
    </div>
  );
}
