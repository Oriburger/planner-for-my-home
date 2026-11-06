import { useMemo } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { runSimulation, initialSnapshot } from '@/utils/simulation';
import type { SimulationResult } from '@/types/planner';

let cached: (SimulationResult & { start: ReturnType<typeof initialSnapshot> }) | null = null;
let lastSettings: unknown = null;
let lastAssets: unknown = null;
let lastIncomes: unknown = null;
let lastHousings: unknown = null;
let lastLoans: unknown = null;
let lastExpenses: unknown = null;

/**
 * 입력 상태가 바뀔 때만 시뮬레이션을 재계산한다.
 * 동일 렌더 주기 내 다수 컴포넌트 호출 시 모듈 캐시로 1회만 계산한다.
 */
export function useSimulation(): SimulationResult & {
  start: ReturnType<typeof initialSnapshot>;
} {
  const settings = usePlannerStore((s) => s.settings);
  const assets = usePlannerStore((s) => s.assets);
  const incomes = usePlannerStore((s) => s.incomes);
  const housings = usePlannerStore((s) => s.housings);
  const loans = usePlannerStore((s) => s.loans);
  const expenses = usePlannerStore((s) => s.expenses);

  return useMemo(() => {
    if (
      cached &&
      lastSettings === settings &&
      lastAssets === assets &&
      lastIncomes === incomes &&
      lastHousings === housings &&
      lastLoans === loans &&
      lastExpenses === expenses
    ) {
      return cached;
    }

    const data = { settings, assets, incomes, housings, loans, expenses };
    cached = { ...runSimulation(data), start: initialSnapshot(data) };
    lastSettings = settings;
    lastAssets = assets;
    lastIncomes = incomes;
    lastHousings = housings;
    lastLoans = loans;
    lastExpenses = expenses;

    return cached;
  }, [settings, assets, incomes, housings, loans, expenses]);
}
