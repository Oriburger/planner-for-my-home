import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore } from '@/store/uiStore';
import type { YearResult } from '@/types/planner';

/**
 * 홈·타임라인이 공유하는 선택 연차 (0 = 지금).
 * 아직 고른 적이 없으면 첫 목표 연차 → 5년차 → 3년차 → 1년차 순으로 고른다.
 */
export function useSelectedYear(rows: YearResult[]): number {
  const selected = useUIStore((s) => s.selectedYearIndex);
  const goals = usePlannerStore((s) => s.goals);
  const last = rows[rows.length - 1]?.index ?? 1;

  if (selected !== null && selected >= 0 && selected <= last) return selected;

  const firstGoal = [...goals]
    .sort((a, b) => a.yearIndex - b.yearIndex)
    .find((g) => g.yearIndex <= last);
  if (firstGoal) return firstGoal.yearIndex;
  return last >= 5 ? 5 : last >= 3 ? 3 : 1;
}
