import { describe, expect, it } from 'vitest';
import { analyzeGoal, analyzeGoals, goalForYear } from '../goals';
import type { YearResult } from '@/types/planner';

const 만 = 10_000;
const rows = [1, 2, 3, 4, 5].map(
  (index) => ({ index, year: 2025 + index, netWorth: index * 10_000 * 만 }) as YearResult,
);
const goal = (yearIndex: number, amount: number) => ({
  id: `g${yearIndex}-${amount}`,
  name: 'g',
  yearIndex,
  amount: amount * 만,
});

describe('analyzeGoal', () => {
  it('목표 연차까지 달성하면 onTrack, 달성 연차와 앞당김을 계산한다', () => {
    const p = analyzeGoal(goal(4, 20_000), rows, 5_000 * 만);
    expect(p.status).toBe('onTrack');
    expect(p.reachedYearIndex).toBe(2);
    expect(p.yearsDiff).toBe(-2);
    expect(p.projectedRatio).toBeCloseTo(2);
    expect(p.currentRatio).toBeCloseTo(0.25);
    expect(p.shortfall).toBe(0);
  });

  it('목표 연차는 놓치지만 기간 안에 달성하면 late', () => {
    const p = analyzeGoal(goal(2, 40_000), rows, 0);
    expect(p.status).toBe('late');
    expect(p.reachedYearIndex).toBe(4);
    expect(p.yearsDiff).toBe(2);
    expect(p.shortfall).toBe(20_000 * 만);
  });

  it('기간 안에 달성하지 못하면 miss, 이미 넘었으면 done', () => {
    expect(analyzeGoal(goal(3, 90_000), rows, 0).status).toBe('miss');
    expect(analyzeGoal(goal(3, 1_000), rows, 2_000 * 만).status).toBe('done');
  });

  it('목표 연차가 기간 밖이면 beyond (기간 안 달성 시 onTrack)', () => {
    expect(analyzeGoal(goal(9, 90_000), rows, 0).status).toBe('beyond');
    expect(analyzeGoal(goal(9, 30_000), rows, 0).status).toBe('onTrack');
  });
});

describe('goalForYear', () => {
  it('선택 연차 이후의 가장 가까운 목표, 없으면 마지막 목표', () => {
    const list = analyzeGoals([goal(5, 1), goal(2, 1)], rows, 0);
    expect(goalForYear(list, 1)?.goal.yearIndex).toBe(2);
    expect(goalForYear(list, 3)?.goal.yearIndex).toBe(5);
    expect(goalForYear(list, 9)?.goal.yearIndex).toBe(5);
    expect(goalForYear([], 1)).toBeNull();
  });
});
