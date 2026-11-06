import type { GoalItem, YearResult } from '@/types/planner';

export type GoalStatus =
  /** 지금 이미 목표 이상 */
  | 'done'
  /** 목표 연차까지 달성 예상 */
  | 'onTrack'
  /** 목표 연차는 놓치지만 기간 안에 달성 */
  | 'late'
  /** 시뮬레이션 기간 안에 달성하지 못함 */
  | 'miss'
  /** 목표 연차가 시뮬레이션 기간 밖 */
  | 'beyond';

export interface GoalProgress {
  goal: GoalItem;
  /** 목표 연차의 예상 순자산 (기간 밖이면 null) */
  projected: number | null;
  /** 예상 순자산 / 목표 (0~) */
  projectedRatio: number;
  /** 현재 순자산 / 목표 (0~) */
  currentRatio: number;
  /** 처음으로 목표 이상이 되는 연차 (0 = 지금, 없으면 null) */
  reachedYearIndex: number | null;
  /** 달성 연차 - 목표 연차 (음수면 앞당김) */
  yearsDiff: number | null;
  /** 목표 연차 기준 부족액 */
  shortfall: number;
  status: GoalStatus;
}

export function analyzeGoal(
  goal: GoalItem,
  rows: YearResult[],
  startNetWorth: number,
): GoalProgress {
  const amount = Math.max(1, goal.amount);
  const row = rows.find((r) => r.index === goal.yearIndex) ?? null;
  const projected = row ? row.netWorth : null;

  let reachedYearIndex: number | null = null;
  if (startNetWorth >= amount) reachedYearIndex = 0;
  else {
    const hit = rows.find((r) => r.netWorth >= amount);
    reachedYearIndex = hit ? hit.index : null;
  }

  let status: GoalStatus;
  if (reachedYearIndex === 0) status = 'done';
  else if (projected === null) status = reachedYearIndex !== null ? 'onTrack' : 'beyond';
  else if (projected >= amount) status = 'onTrack';
  else if (reachedYearIndex !== null) status = 'late';
  else status = 'miss';

  return {
    goal,
    projected,
    projectedRatio: projected === null ? 0 : Math.max(0, projected / amount),
    currentRatio: Math.max(0, startNetWorth / amount),
    reachedYearIndex,
    yearsDiff: reachedYearIndex === null ? null : reachedYearIndex - goal.yearIndex,
    shortfall: projected === null ? 0 : Math.max(0, amount - projected),
    status,
  };
}

/** 연차 순으로 정렬한 목표 분석 목록 */
export function analyzeGoals(
  goals: GoalItem[],
  rows: YearResult[],
  startNetWorth: number,
): GoalProgress[] {
  return [...goals]
    .sort((a, b) => a.yearIndex - b.yearIndex || a.amount - b.amount)
    .map((g) => analyzeGoal(g, rows, startNetWorth));
}

/** 선택 연차 기준으로 '다음' 목표 (없으면 마지막 목표) */
export function goalForYear<T extends { goal: GoalItem }>(list: T[], yearIndex: number): T | null {
  if (list.length === 0) return null;
  return list.find((p) => p.goal.yearIndex >= yearIndex) ?? list[list.length - 1];
}
