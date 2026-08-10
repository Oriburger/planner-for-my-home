import type {
  AssetItem,
  ExpenseCategory,
  HousingType,
  PlannerData,
  RepaymentType,
  SimulationSettings,
} from '@/types/planner';
import { DEFAULT_SETTINGS } from '@/store/plannerStore';

/**
 * 초기 설정 마법사가 들고 있는 임시 입력값.
 *
 * store 의 PlannerData 를 그대로 쓰지 않고 납작한 구조를 쓰는 이유:
 * 마법사는 "항목을 몇 개 만들지"가 아니라 "각 칸에 얼마인지"만 물어보므로,
 * 완료 시점에 draftToPlannerData() 로 한 번에 항목 배열로 변환한다.
 */

/** 자산 단계에서 물어보는 칸 (보증금은 주거 단계에서 자동으로 만들어진다) */
export const ASSET_PRESETS = [
  { key: 'cash', label: '현금 · 파킹통장', rate: 2.5, liquid: true },
  { key: 'savings', label: '예금 · 적금', rate: 3.5, liquid: true },
  { key: 'isa', label: 'ISA', rate: 6, liquid: false },
  { key: 'investment', label: '주식 · ETF', rate: 6, liquid: true },
  { key: 'pension', label: '연금저축 · IRP', rate: 5.5, liquid: false },
  {
    key: 'housingSubscription',
    label: '주택청약',
    rate: 2.8,
    liquid: false,
  },
] as const;

export type AssetPresetKey = (typeof ASSET_PRESETS)[number]['key'];

/** 지출 단계에서 물어보는 칸 */
export const EXPENSE_PRESETS = [
  { key: 'food', label: '식비 · 생필품' },
  { key: 'transport', label: '교통비' },
  { key: 'insurance', label: '보험료' },
  { key: 'telecom', label: '통신비' },
  { key: 'leisure', label: '여가 · 문화' },
] as const;

export type ExpensePresetKey = (typeof EXPENSE_PRESETS)[number]['key'];

export interface OnboardingDraft {
  settings: SimulationSettings;
  /** 자산 칸별 금액 (원) */
  assets: Record<AssetPresetKey, number>;
  income: {
    annualAmount: number;
    growthRate: number;
    /** 월 자동이체로 저축하는 금액 (원/월) — ISA·연금 등에 배분하지 않고 여유자금으로 본다 */
    sideAnnualAmount: number;
  };
  housing: {
    type: HousingType;
    deposit: number;
    monthlyRent: number;
    monthlyMaintenance: number;
    annualIncreaseRate: number;
  };
  loan: {
    principal: number;
    annualRate: number;
    termYears: number;
    repaymentType: RepaymentType;
  };
  /** 지출 칸별 월 금액 (원) */
  expenses: Record<ExpensePresetKey, number>;
}

const zeroAssets = () =>
  Object.fromEntries(ASSET_PRESETS.map((p) => [p.key, 0])) as Record<
    AssetPresetKey,
    number
  >;

const zeroExpenses = () =>
  Object.fromEntries(EXPENSE_PRESETS.map((p) => [p.key, 0])) as Record<
    ExpensePresetKey,
    number
  >;

/** 빈 값으로 시작하는 기본 draft */
export function createEmptyDraft(): OnboardingDraft {
  return {
    settings: { ...DEFAULT_SETTINGS },
    assets: zeroAssets(),
    income: { annualAmount: 0, growthRate: 3, sideAnnualAmount: 0 },
    housing: {
      type: 'jeonse',
      deposit: 0,
      monthlyRent: 0,
      monthlyMaintenance: 0,
      annualIncreaseRate: 2,
    },
    loan: {
      principal: 0,
      annualRate: 4,
      termYears: 10,
      repaymentType: 'equalPayment',
    },
    expenses: zeroExpenses(),
  };
}

const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const HOUSING_LABEL: Record<HousingType, string> = {
  jeonse: '전세',
  wolse: '월세',
  owned: '자가',
  etc: '주거',
};

/**
 * draft 를 시뮬레이터가 쓰는 PlannerData 로 변환한다.
 * 0 으로 남겨둔 칸은 항목을 만들지 않는다 (건너뛴 것으로 본다).
 */
export function draftToPlannerData(draft: OnboardingDraft): PlannerData {
  const assets: AssetItem[] = ASSET_PRESETS.filter(
    (preset) => draft.assets[preset.key] > 0,
  ).map((preset) => ({
    id: uid(),
    type: preset.key,
    name: preset.label,
    amount: draft.assets[preset.key],
    annualReturnRate: preset.rate,
    liquid: preset.liquid,
    monthlyContribution: 0,
  }));

  // 보증금은 주거 단계에서 한 번만 입력받고 여기서 자산으로 만든다.
  // (자산 단계에서 또 물으면 같은 돈을 두 번 세게 된다)
  if (draft.housing.deposit > 0) {
    assets.push({
      id: uid(),
      type: 'rentDeposit',
      name: `${HOUSING_LABEL[draft.housing.type]} 보증금`,
      amount: draft.housing.deposit,
      annualReturnRate: 0,
      liquid: false,
      monthlyContribution: 0,
    });
  }

  const incomes = [];
  if (draft.income.annualAmount > 0) {
    incomes.push({
      id: uid(),
      type: 'salary' as const,
      name: '본업 연봉',
      annualAmount: draft.income.annualAmount,
      growthMode: 'fixed' as const,
      growthRate: draft.income.growthRate,
      manualGrowthRates: [],
      taxable: true,
      startYear: 1,
      endYear: null,
    });
  }
  if (draft.income.sideAnnualAmount > 0) {
    incomes.push({
      id: uid(),
      type: 'side' as const,
      name: '부수입',
      annualAmount: draft.income.sideAnnualAmount,
      growthMode: 'fixed' as const,
      growthRate: 0,
      manualGrowthRates: [],
      taxable: true,
      startYear: 1,
      endYear: null,
    });
  }

  const hasHousing =
    draft.housing.deposit > 0 ||
    draft.housing.monthlyRent > 0 ||
    draft.housing.monthlyMaintenance > 0;

  const housings = hasHousing
    ? [
        {
          id: uid(),
          type: draft.housing.type,
          name: `${HOUSING_LABEL[draft.housing.type]} 거주`,
          deposit: draft.housing.deposit,
          monthlyRent: draft.housing.monthlyRent,
          monthlyMaintenance: draft.housing.monthlyMaintenance,
          annualIncreaseRate: draft.housing.annualIncreaseRate,
          startYear: 1,
          endYear: null,
        },
      ]
    : [];

  const loans =
    draft.loan.principal > 0
      ? [
          {
            id: uid(),
            name: '대출',
            principal: draft.loan.principal,
            annualRate: draft.loan.annualRate,
            termYears: draft.loan.termYears,
            repaymentType: draft.loan.repaymentType,
            monthlyPayment: 0,
            startYear: 1,
          },
        ]
      : [];

  const expenses = EXPENSE_PRESETS.filter(
    (preset) => draft.expenses[preset.key] > 0,
  ).map((preset) => ({
    id: uid(),
    category: preset.key as ExpenseCategory,
    name: preset.label,
    monthlyAmount: draft.expenses[preset.key],
    inflationRate: null,
    startYear: 1,
    endYear: null,
  }));

  return {
    settings: draft.settings,
    assets,
    incomes,
    housings,
    loans,
    expenses,
  };
}

/** 현재 store 상태를 draft 로 되돌린다 (초기설정을 다시 열 때 값 채우기용) */
export function plannerDataToDraft(data: PlannerData): OnboardingDraft {
  const draft = createEmptyDraft();
  draft.settings = { ...data.settings };

  for (const asset of data.assets) {
    const preset = ASSET_PRESETS.find((p) => p.key === asset.type);
    if (preset) draft.assets[preset.key] += asset.amount;
  }

  const salary = data.incomes.find((i) => i.type === 'salary');
  if (salary) {
    draft.income.annualAmount = salary.annualAmount;
    draft.income.growthRate = salary.growthRate;
  }
  draft.income.sideAnnualAmount = data.incomes
    .filter((i) => i.type !== 'salary')
    .reduce((sum, i) => sum + i.annualAmount, 0);

  const housing = data.housings[0];
  if (housing) {
    draft.housing = {
      type: housing.type,
      deposit: housing.deposit,
      monthlyRent: housing.monthlyRent,
      monthlyMaintenance: housing.monthlyMaintenance,
      annualIncreaseRate: housing.annualIncreaseRate,
    };
  }

  const loan = data.loans[0];
  if (loan) {
    draft.loan = {
      principal: loan.principal,
      annualRate: loan.annualRate,
      termYears: loan.termYears,
      repaymentType: loan.repaymentType,
    };
  }

  for (const expense of data.expenses) {
    const preset = EXPENSE_PRESETS.find((p) => p.key === expense.category);
    if (preset) draft.expenses[preset.key] += expense.monthlyAmount;
  }

  return draft;
}
