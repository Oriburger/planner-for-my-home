import { describe, expect, it } from 'vitest';
import { buildYearPoints, stackLayers } from '../accumulation';
import type { YearResult } from '@/types/planner';

const row = (index: number, netWorth: number, ret: number, sav: number) =>
  ({ index, year: 2025 + index, netWorth, investmentReturn: ret, annualSavings: sav, netIncome: 100 }) as YearResult;

describe('buildYearPoints', () => {
  it('운용수익·저축을 누적하고, 나머지를 내가 모은 돈으로 본다', () => {
    const pts = buildYearPoints([row(1, 130, 10, 20), row(2, 170, 15, 25)], { year: 2025, netWorth: 100 });
    expect(pts).toHaveLength(3);
    expect(pts[0]).toMatchObject({ index: 0, grown: 0, saved: 0, savingsRate: null });
    expect(pts[2]).toMatchObject({ grown: 25, saved: 45, savingsCum: 45, savingsRate: 25 });
    expect(pts[2].base + pts[2].saved + pts[2].grown).toBe(pts[2].netWorth);
  });
});

describe('stackLayers', () => {
  it('세 층의 합은 0 이상인 순자산과 같고 음수 층은 없다', () => {
    const l = stackLayers({ index: 1, year: 0, netWorth: 50, base: 100, grown: 10, saved: -60, savingsCum: 0, savingsRate: null });
    expect(l).toEqual({ base: 50, grown: 0, saved: 0, total: 50 });
    const m = stackLayers({ index: 1, year: 0, netWorth: 170, base: 100, grown: 25, saved: 45, savingsCum: 0, savingsRate: null });
    expect(m).toEqual({ base: 100, grown: 25, saved: 45, total: 170 });
  });
});
