import { currentYear } from '@/utils/time';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AssetItem,
  ExpenseItem,
  GoalItem,
  HousingItem,
  ID,
  IncomeItem,
  LoanItem,
  PlannerData,
  SimulationSettings,
} from '@/types/planner';

/* ------------------------------------------------------------------ */
/* 유틸                                                                */
/* ------------------------------------------------------------------ */

const uid = (): ID =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** 예전 저장 형식(startYear)을 asOfYear 로 바꾸고 빠진 값을 채운다 */
export function normalizeSettings(
  raw: Partial<SimulationSettings> & { startYear?: number },
): SimulationSettings {
  const { startYear, ...rest } = raw;
  const now = currentYear();
  const asOf = rest.asOfYear ?? startYear ?? now;
  return { ...DEFAULT_SETTINGS, ...rest, asOfYear: Math.min(asOf, now) };
}

const 만 = 10_000;
const 억 = 100_000_000;

/* ------------------------------------------------------------------ */
/* 기본값 (첫 방문 시 보이는 샘플 시나리오)                             */
/* ------------------------------------------------------------------ */

export const DEFAULT_SETTINGS: SimulationSettings = {
  asOfYear: currentYear(),
  years: 10,
  inflationRate: 2.5,
  taxMode: 'simplified',
  flatTaxRate: 17,
  applyAssetReturn: true,
  savingsReturnRate: 3.0,
  currentAge: null,
  applyTaxRefund: true,
  houselessHead: true,
};

/** 초기 설정을 마치기 전의 빈 상태 */
function createEmptyData(): PlannerData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    assets: [],
    incomes: [],
    housings: [],
    loans: [],
    expenses: [],
  };
}

/** '샘플로 채우기' 로 불러오는 예시 시나리오 */
function createSampleData(): PlannerData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    assets: [
      {
        id: uid(),
        type: 'cash',
        name: '현금 · 파킹통장',
        amount: 1500 * 만,
        annualReturnRate: 2.5,
        liquid: true,
        monthlyContribution: 0,
      },
      {
        id: uid(),
        type: 'isa',
        name: 'ISA 계좌',
        amount: 2000 * 만,
        annualReturnRate: 6,
        liquid: false,
        monthlyContribution: 30 * 만,
      },
      {
        id: uid(),
        type: 'pension',
        name: '연금저축펀드',
        amount: 1200 * 만,
        annualReturnRate: 5.5,
        liquid: false,
        monthlyContribution: 30 * 만,
      },
      {
        id: uid(),
        type: 'savings',
        name: '정기적금',
        amount: 800 * 만,
        annualReturnRate: 3.5,
        liquid: true,
        monthlyContribution: 0,
      },
      {
        id: uid(),
        type: 'rentDeposit',
        name: '전세보증금',
        amount: 2 * 억,
        annualReturnRate: 0,
        liquid: false,
        monthlyContribution: 0,
      },
      {
        id: uid(),
        type: 'housingSubscription',
        name: '주택청약종합저축',
        amount: 500 * 만,
        annualReturnRate: 2.8,
        liquid: false,
        monthlyContribution: 10 * 만,
      },
    ],
    incomes: [
      {
        id: uid(),
        type: 'salary',
        name: '본업 연봉',
        annualAmount: 5200 * 만,
        growthMode: 'fixed',
        growthRate: 4,
        manualGrowthRates: [],
        taxable: true,
        startYear: 1,
        endYear: null,
      },
    ],
    housings: [
      {
        id: uid(),
        type: 'jeonse',
        name: '현재 전세',
        deposit: 2 * 억,
        monthlyRent: 0,
        monthlyMaintenance: 15 * 만,
        annualIncreaseRate: 2,
        startYear: 1,
        endYear: null,
      },
    ],
    loans: [
      {
        id: uid(),
        name: '전세자금대출',
        principal: 8000 * 만,
        annualRate: 3.8,
        termYears: 10,
        repaymentType: 'equalPayment',
        monthlyPayment: 0,
        startYear: 1,
        isDepositLinked: false,
        autoRenew: false,
      },
    ],
    expenses: [
      {
        id: uid(),
        category: 'food',
        name: '식비 · 생필품',
        monthlyAmount: 70 * 만,
        inflationRate: null,
        startYear: 1,
        endYear: null,
      },
      {
        id: uid(),
        category: 'transport',
        name: '교통비',
        monthlyAmount: 15 * 만,
        inflationRate: null,
        startYear: 1,
        endYear: null,
      },
      {
        id: uid(),
        category: 'insurance',
        name: '보험료',
        monthlyAmount: 18 * 만,
        inflationRate: null,
        startYear: 1,
        endYear: null,
      },
      {
        id: uid(),
        category: 'telecom',
        name: '통신비',
        monthlyAmount: 8 * 만,
        inflationRate: null,
        startYear: 1,
        endYear: null,
      },
      {
        id: uid(),
        category: 'leisure',
        name: '여가 · 문화',
        monthlyAmount: 25 * 만,
        inflationRate: null,
        startYear: 1,
        endYear: null,
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* 신규 항목 팩토리 ('항목 추가' 버튼용)                                */
/* ------------------------------------------------------------------ */

export const createAsset = (patch?: Partial<AssetItem>): AssetItem => ({
  id: uid(),
  type: 'etc',
  name: '새 자산',
  amount: 0,
  annualReturnRate: 0,
  liquid: true,
  monthlyContribution: 0,
  memo: '',
  startYear: 1,
  ...patch,
});

export const createIncome = (): IncomeItem => ({
  id: uid(),
  type: 'etc',
  name: '새 수입',
  annualAmount: 0,
  growthMode: 'fixed',
  growthRate: 0,
  manualGrowthRates: [],
  customAnnualAmounts: [],
  taxable: true,
  startYear: 1,
  endYear: null,
  memo: '',
});

export const createHousing = (): HousingItem => ({
  id: uid(),
  type: 'wolse',
  name: '새 주거 계약',
  deposit: 0,
  monthlyRent: 0,
  monthlyMaintenance: 0,
  annualIncreaseRate: 2,
  startYear: 1,
  endYear: null,
  memo: '',
});

export const createLoan = (): LoanItem => ({
  id: uid(),
  name: '새 대출',
  principal: 0,
  annualRate: 4,
  termYears: 10,
  repaymentType: 'equalPayment',
  monthlyPayment: 0,
  startYear: 1,
  graceYears: 0,
  isDepositLinked: false,
  autoRenew: false,
  memo: '',
});

export const createExpense = (): ExpenseItem => ({
  id: uid(),
  category: 'etc',
  name: '새 지출',
  monthlyAmount: 0,
  inflationRate: null,
  startYear: 1,
  memo: '',
  endYear: null,
});

/* ------------------------------------------------------------------ */
/* Store                                                              */
/* ------------------------------------------------------------------ */

type ListKey = 'assets' | 'incomes' | 'housings' | 'loans' | 'expenses';

function createSampleGoals(): GoalItem[] {
  return [
    { id: uid(), name: '종잣돈 2억', yearIndex: 2, amount: 20_000 * 만 },
    { id: uid(), name: '내 집 계약금', yearIndex: 5, amount: 30_000 * 만 },
    { id: uid(), name: '대출 없는 집', yearIndex: 10, amount: 55_000 * 만 },
  ];
}

interface PlannerActions {
  updateSettings: (patch: Partial<SimulationSettings>) => void;
  setYears: (years: number) => void;

  /** 초기 설정 마법사 완료 여부 표시 */
  setOnboarded: (value: boolean) => void;
  /** 예시 시나리오 불러오기 */
  loadSample: () => void;

  addAsset: (patch?: Partial<AssetItem>) => void;
  addIncome: () => void;
  addHousing: () => void;
  addLoan: () => void;
  addExpense: () => void;

  updateAsset: (id: ID, patch: Partial<AssetItem>) => void;
  updateIncome: (id: ID, patch: Partial<IncomeItem>) => void;
  updateHousing: (id: ID, patch: Partial<HousingItem>) => void;
  updateLoan: (id: ID, patch: Partial<LoanItem>) => void;
  updateExpense: (id: ID, patch: Partial<ExpenseItem>) => void;

  removeItem: (key: ListKey, id: ID) => void;
  duplicateItem: (key: ListKey, id: ID) => void;

  resetAll: () => void;
  clearAll: () => void;
  importData: (data: PlannerData) => void;

  addGoal: (goal?: Partial<GoalItem>) => void;
  updateGoal: (id: ID, patch: Partial<GoalItem>) => void;
  removeGoal: (id: ID) => void;
}

export type PlannerStore = PlannerData &
  PlannerActions & {
    /** 초기 설정 마법사를 이미 마쳤는지 (false 면 첫 방문으로 보고 자동으로 띄운다) */
    onboarded: boolean;
    /** 연도별 순자산 목표 (계산 입력과 분리 — 결과를 바꾸지 않는다) */
    goals: GoalItem[];
  };

/** 리스트 항목 부분 수정 헬퍼 */
function patchList<T extends { id: ID }>(
  list: T[],
  id: ID,
  patch: Partial<T>,
): T[] {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set, get) => ({
      ...createEmptyData(),
      onboarded: false,
      goals: [],

      setOnboarded: (value) => set({ onboarded: value }),
      loadSample: () =>
        set({ ...createSampleData(), goals: createSampleGoals(), onboarded: true }),

      updateSettings: (patch) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...patch,
            // 나이를 고치면 그 값은 '올해 기준'이 된다
            ...('currentAge' in patch ? { asOfYear: currentYear() } : {}),
          },
        })),

      setYears: (years) =>
        set((state) => ({
          settings: {
            ...state.settings,
            years: Math.max(1, Math.min(40, Math.round(years))),
          },
        })),

      addAsset: (patch) =>
        set((s) => ({ assets: [...s.assets, createAsset(patch)] })),
      addIncome: () => set((s) => ({ incomes: [...s.incomes, createIncome()] })),
      addHousing: () =>
        set((s) => ({ housings: [...s.housings, createHousing()] })),
      addLoan: () => set((s) => ({ loans: [...s.loans, createLoan()] })),
      addExpense: () =>
        set((s) => ({ expenses: [...s.expenses, createExpense()] })),

      updateAsset: (id, patch) =>
        set((s) => ({ assets: patchList(s.assets, id, patch) })),
      updateIncome: (id, patch) =>
        set((s) => ({ incomes: patchList(s.incomes, id, patch) })),
      updateHousing: (id, patch) =>
        set((s) => {
          const nextHousings = patchList(s.housings, id, patch);
          const updated = nextHousings.find((h) => h.id === id);
          let nextAssets = s.assets;
          // 1년차 주거 계약의 보증금을 수정하면 보유 자산의 '임대보증금(rentDeposit)'도 함께 동기화한다
          if (updated && updated.startYear <= 1 && 'deposit' in patch) {
            const idx = s.assets.findIndex((a) => a.type === 'rentDeposit');
            if (idx >= 0) {
              nextAssets = s.assets.map((a, i) =>
                i === idx ? { ...a, amount: updated.deposit } : a,
              );
            } else if (updated.deposit > 0) {
              nextAssets = [
                ...s.assets,
                createAsset({
                  type: 'rentDeposit',
                  name: '전월세 보증금',
                  amount: updated.deposit,
                  annualReturnRate: 0,
                  liquid: false,
                }),
              ];
            }
          }
          return { housings: nextHousings, assets: nextAssets };
        }),
      updateLoan: (id, patch) =>
        set((s) => ({ loans: patchList(s.loans, id, patch) })),
      updateExpense: (id, patch) =>
        set((s) => ({ expenses: patchList(s.expenses, id, patch) })),

      removeItem: (key, id) =>
        set((s) => ({
          [key]: (s[key] as Array<{ id: ID }>).filter((i) => i.id !== id),
        }) as Partial<PlannerStore>),

      duplicateItem: (key, id) =>
        set((s) => {
          const list = s[key] as Array<{ id: ID; name: string }>;
          const target = list.find((i) => i.id === id);
          if (!target) return {};
          const copy = { ...target, id: uid(), name: `${target.name} 사본` };
          const at = list.findIndex((i) => i.id === id);
          const next = [...list];
          next.splice(at + 1, 0, copy);
          return { [key]: next } as Partial<PlannerStore>;
        }),

      /** 전부 비우고 초기 설정 마법사를 다시 띄운다 */
      resetAll: () => set({ ...createEmptyData(), goals: [], onboarded: false }),

      clearAll: () =>
        set({
          settings: { ...get().settings },
          assets: [],
          incomes: [],
          housings: [],
          loans: [],
          expenses: [],
        }),

      importData: (data) => set({ ...data, settings: normalizeSettings(data.settings) }),

      addGoal: (goal) =>
        set((s) => {
          const sorted = [...s.goals].sort((a, b) => a.yearIndex - b.yearIndex);
          const last = sorted[sorted.length - 1];
          const yearIndex = Math.min(40, (last?.yearIndex ?? 0) + 3);
          const next: GoalItem = {
            id: uid(),
            name: '새 목표',
            yearIndex,
            amount: last ? Math.round((last.amount * 1.3) / (1000 * 만)) * 1000 * 만 : 10_000 * 만,
            ...goal,
          };
          return { goals: [...s.goals, next] };
        }),
      updateGoal: (id, patch) => set((s) => ({ goals: patchList(s.goals, id, patch) })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
    }),
    {
      name: 'planner-for-my-home:v1',
      version: 2,
      /**
       * v1 → v2: 사용자 지정 '시작 연도(startYear)'를 없애고 '지금 = 올해'로 통일.
       * 예전 startYear 는 입력 시점(asOfYear)으로 옮겨 현재 나이 보정에 쓴다.
       */
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<PlannerStore>;
        if (p.settings) p.settings = normalizeSettings(p.settings);
        return p as PlannerStore;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PlannerStore>;
        return {
          ...current,
          ...p,
          settings: normalizeSettings({ ...current.settings, ...(p.settings ?? {}) }),
        };
      },
      partialize: (state) => ({
        onboarded: state.onboarded,
        settings: state.settings,
        assets: state.assets,
        incomes: state.incomes,
        housings: state.housings,
        loans: state.loans,
        expenses: state.expenses,
        goals: state.goals,
      }),
    },
  ),
);

/** 계산 입력만 뽑아내는 셀렉터 (액션 변경으로 인한 재계산 방지) */
export const selectPlannerData = (s: PlannerStore): PlannerData => ({
  settings: s.settings,
  assets: s.assets,
  incomes: s.incomes,
  housings: s.housings,
  loans: s.loans,
  expenses: s.expenses,
});
