import { useMemo } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { runSimulation, initialSnapshot } from '@/utils/simulation';
import type { SimulationResult } from '@/types/planner';

/**
 * 입력 상태가 바뀔 때만 시뮬레이션을 재계산한다.
 * (store 의 액션 함수는 의존성에서 제외하기 위해 슬라이스 단위로 구독한다)
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
    const data = { settings, assets, incomes, housings, loans, expenses };
    return { ...runSimulation(data), start: initialSnapshot(data) };
  }, [settings, assets, incomes, housings, loans, expenses]);
}
