import { describe, expect, it } from 'vitest';
import { effectiveAge } from '../time';
import { getAssetMaturityYearIndex, initialSnapshot, runSimulation } from '../simulation';
import { normalizeSettings, DEFAULT_SETTINGS } from '@/store/plannerStore';
import type { AssetItem, PlannerData } from '@/types/planner';

const 만 = 10_000;
const base: PlannerData = {
  settings: { ...DEFAULT_SETTINGS, years: 5, currentAge: 30, asOfYear: 2026 },
  assets: [
    { id: 'a', type: 'cash', name: '현금', amount: 1000 * 만, annualReturnRate: 0, liquid: true, monthlyContribution: 0 },
  ],
  incomes: [],
  housings: [],
  loans: [
    {
      id: 'future',
      name: '미래 대출',
      principal: 5000 * 만,
      annualRate: 4,
      termYears: 10,
      repaymentType: 'equalPayment',
      monthlyPayment: 0,
      startYear: 3,
    } as PlannerData['loans'][number],
  ],
  expenses: [],
};

describe('시간 모델: 지금 = 올해, N년 후 = 올해 + N', () => {
  it('지금은 올해·현재 나이, 1년 후는 올해+1·나이+1', () => {
    const start = initialSnapshot(base, 2026);
    expect(start.year).toBe(2026);
    expect(start.age).toBe(30);
    const { rows } = runSimulation(base, 2026);
    expect(rows[0]).toMatchObject({ index: 1, year: 2027, age: 31 });
    expect(rows[4]).toMatchObject({ index: 5, year: 2031, age: 35 });
  });

  it('해가 바뀌면 지금도 바뀌고, 예전에 입력한 나이는 올해 기준으로 보정된다', () => {
    expect(initialSnapshot(base, 2028).year).toBe(2028);
    expect(effectiveAge(base.settings, 2028)).toBe(32);
    expect(runSimulation(base, 2028).rows[0]).toMatchObject({ year: 2029, age: 33 });
  });

  it('아직 실행 전인 미래 대출은 지금 순자산에서 빼지 않는다', () => {
    expect(initialSnapshot(base, 2026).netWorth).toBe(1000 * 만);
  });

  it('만기 나이 55세는 현재 30세 기준 25년 후', () => {
    const pension = { maturityAge: 55 } as AssetItem;
    expect(getAssetMaturityYearIndex(pension, 30)).toBe(25);
  });
});

describe('저장 데이터 마이그레이션', () => {
  it('예전 startYear 는 asOfYear 로 옮겨지고 미래 연도는 올해로 잘린다', () => {
    const migrated = normalizeSettings({ ...DEFAULT_SETTINGS, asOfYear: undefined as unknown as number, startYear: 2024 });
    expect(migrated.asOfYear).toBe(2024);
    expect('startYear' in migrated).toBe(false);
    const future = normalizeSettings({ ...DEFAULT_SETTINGS, asOfYear: 9999 });
    expect(future.asOfYear).toBe(new Date().getFullYear());
  });
});

describe('만기·거치·갱신 경계 (N년차의 끝 = N년 후)', () => {
  it('만기 3년 후인 적금은 3년차까지 납입하고 4년차부터 멈춘다', () => {
    const data: PlannerData = {
      ...base,
      loans: [],
      assets: [
        { id: 's', type: 'savings', name: '적금', amount: 0, annualReturnRate: 0, liquid: false, monthlyContribution: 10 * 만, maturityYear: 3, startYear: 1 },
      ],
    };
    const { rows } = runSimulation(data, 2026);
    expect(rows.map((r) => r.contribution)).toEqual([120 * 만, 120 * 만, 120 * 만, 0, 0]);
  });
});
