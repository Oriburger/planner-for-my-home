import type { AssetItem, ExpenseItem } from '@/types/planner';

export interface BudgetShareItem {
  amount: number;
  percent: number;
}

export interface BudgetShares {
  monthlyNetIncome: number;
  housing: BudgetShareItem;
  loan: BudgetShareItem;
  living: BudgetShareItem;
  contribution: BudgetShareItem;
  leftover: BudgetShareItem;
  totalAllocated: BudgetShareItem;
  status: 'balanced' | 'surplus' | 'deficit';
}

export type BudgetPresetType = '50-30-20' | 'home-focus' | 'frugal';

export const BUDGET_PRESETS: Array<{
  id: BudgetPresetType;
  label: string;
  desc: string;
  livingShare: number; // 생활+주거+대출 권장 비중 (소득 대비 %)
  savingsShare: number; // 저축/투자 권장 비중 (%)
  leftoverShare: number; // 자유 여유자금 권장 비중 (%)
}> = [
  {
    id: '50-30-20',
    label: '50 / 30 / 20 법칙',
    desc: '필수 생활 50% · 저축 30% · 자유 20%',
    livingShare: 50,
    savingsShare: 30,
    leftoverShare: 20,
  },
  {
    id: 'home-focus',
    label: '내 집 마련 집중형',
    desc: '필수 생활 40% · 공격적 저축 50% · 자유 10%',
    livingShare: 40,
    savingsShare: 50,
    leftoverShare: 10,
  },
  {
    id: 'frugal',
    label: '극대화 저축형',
    desc: '필수 생활 30% · 저축 60% · 자유 10%',
    livingShare: 30,
    savingsShare: 60,
    leftoverShare: 10,
  },
];

export function calculateBudgetShares({
  monthlyNetIncome,
  housingCost,
  loanPayment,
  livingExpense,
  contribution,
}: {
  monthlyNetIncome: number;
  housingCost: number;
  loanPayment: number;
  livingExpense: number;
  contribution: number;
}): BudgetShares {
  const totalAllocated = housingCost + loanPayment + livingExpense + contribution;
  const leftover = monthlyNetIncome - totalAllocated;

  const toItem = (amt: number): BudgetShareItem => ({
    amount: amt,
    percent: monthlyNetIncome > 0 ? (amt / monthlyNetIncome) * 100 : 0,
  });

  let status: BudgetShares['status'] = 'balanced';
  if (leftover > 0) status = 'surplus';
  else if (leftover < 0) status = 'deficit';

  return {
    monthlyNetIncome,
    housing: toItem(housingCost),
    loan: toItem(loanPayment),
    living: toItem(livingExpense),
    contribution: toItem(contribution),
    leftover: toItem(leftover),
    totalAllocated: toItem(totalAllocated),
    status,
  };
}

/**
 * 선택한 프리셋의 목표 비율에 맞춰 기존 생활비 항목들을 비례적으로 스케일링한다.
 */
export function applyBudgetPreset(
  preset: BudgetPresetType,
  monthlyNetIncome: number,
  expenses: ExpenseItem[],
  housingCost: number,
  loanPayment: number,
): ExpenseItem[] {
  if (monthlyNetIncome <= 0 || expenses.length === 0) return expenses;

  const config = BUDGET_PRESETS.find((p) => p.id === preset) ?? BUDGET_PRESETS[0];
  const targetNeedsTotal = (monthlyNetIncome * config.livingShare) / 100;
  // 주거비와 대출은 고정 계약이므로, 남은 금액을 생활비 목표액으로 산정한다.
  const targetLivingTotal = Math.max(0, targetNeedsTotal - housingCost - loanPayment);

  const currentLivingTotal = expenses.reduce((sum, e) => sum + e.monthlyAmount, 0);
  if (currentLivingTotal <= 0) {
    // 0이면 항목 수대로 균등 배분
    const perItem = Math.round(targetLivingTotal / expenses.length / 10000) * 10000;
    return expenses.map((e) => ({ ...e, monthlyAmount: perItem }));
  }

  const factor = targetLivingTotal / currentLivingTotal;
  return expenses.map((e) => ({
    ...e,
    monthlyAmount: Math.round((e.monthlyAmount * factor) / 10000) * 10000,
  }));
}

/**
 * 선택한 프리셋의 목표 저축 비율에 맞춰 저축/투자 목적 자산들의 월 납입액을 비례적으로 스케일링한다.
 */
export function applyBudgetSavingsPreset(
  preset: BudgetPresetType,
  monthlyNetIncome: number,
  assets: AssetItem[],
): AssetItem[] {
  if (monthlyNetIncome <= 0 || assets.length === 0) return assets;
  const config = BUDGET_PRESETS.find((p) => p.id === preset) ?? BUDGET_PRESETS[0];
  const targetSavingsTotal = (monthlyNetIncome * config.savingsShare) / 100;

  const targetAssets = assets.filter(
    (a) =>
      ['savings', 'isa', 'pension', 'housingSubscription'].includes(a.type) ||
      a.monthlyContribution > 0,
  );
  if (targetAssets.length === 0) return assets;

  const currentTotal = targetAssets.reduce((sum, a) => sum + a.monthlyContribution, 0);
  const factor = currentTotal > 0 ? targetSavingsTotal / currentTotal : targetSavingsTotal / targetAssets.length;

  return assets.map((a) => {
    if (!targetAssets.some((ta) => ta.id === a.id)) return a;
    const nextContribution =
      currentTotal > 0
        ? Math.round((a.monthlyContribution * factor) / 10000) * 10000
        : Math.round(targetSavingsTotal / targetAssets.length / 10000) * 10000;
    return { ...a, monthlyContribution: Math.max(0, nextContribution) };
  });
}
