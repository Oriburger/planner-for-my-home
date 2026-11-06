import { describe, expect, it } from 'vitest';
import {
  extractAssetMilestones,
  extractHorizonSnapshots,
  extractTimelineEvents,
} from '../timeline';
import type { PlannerData, YearResult, SimulationSummary } from '@/types/planner';

const 만 = 10_000;
const 억 = 100_000_000;

const mockSettings = {
  asOfYear: 2026,
  years: 10,
  inflationRate: 2,
  taxMode: 'flatRate' as const,
  flatTaxRate: 10,
  applyAssetReturn: true,
  savingsReturnRate: 3,
  currentAge: 32,
  applyTaxRefund: false,
  houselessHead: false,
};

const mockRows: YearResult[] = [
  {
    index: 1,
    year: 2026,
    age: 32,
    grossIncome: 5000 * 만,
    taxAndInsurance: 500 * 만,
    netIncome: 4500 * 만,
    livingExpense: 2000 * 만,
    housingCost: 200 * 만,
    loanPayment: 1000 * 만,
    loanInterest: 200 * 만,
    loanPrincipalPaid: 800 * 만,
    investmentReturn: 300 * 만,
    contribution: 600 * 만,
    taxRefund: 0,
    annualSavings: 1300 * 만,
    contributionBalance: 700 * 만,
    liquidAssets: 5000 * 만,
    lockedAssets: 7000 * 만,
    totalAssets: 12000 * 만,
    loanBalance: 4000 * 만,
    netWorth: 8000 * 만,
  },
  {
    index: 2,
    year: 2027,
    age: 33,
    grossIncome: 5200 * 만,
    taxAndInsurance: 520 * 만,
    netIncome: 4680 * 만,
    livingExpense: 2050 * 만,
    housingCost: 200 * 만,
    loanPayment: 1000 * 만,
    loanInterest: 150 * 만,
    loanPrincipalPaid: 850 * 만,
    investmentReturn: 500 * 만,
    contribution: 600 * 만,
    taxRefund: 0,
    annualSavings: 1430 * 만,
    contributionBalance: 830 * 만,
    liquidAssets: 7000 * 만,
    lockedAssets: 7500 * 만,
    totalAssets: 14500 * 만,
    loanBalance: 3150 * 만,
    netWorth: 11350 * 만, // crosses 1억!
  },
  {
    index: 3,
    year: 2028,
    age: 34,
    grossIncome: 5500 * 만,
    taxAndInsurance: 550 * 만,
    netIncome: 4950 * 만,
    livingExpense: 2100 * 만,
    housingCost: 200 * 만,
    loanPayment: 1000 * 만,
    loanInterest: 100 * 만,
    loanPrincipalPaid: 900 * 만,
    investmentReturn: 700 * 만,
    contribution: 600 * 만,
    taxRefund: 0,
    annualSavings: 1650 * 만,
    contributionBalance: 1050 * 만,
    liquidAssets: 9500 * 만,
    lockedAssets: 8000 * 만,
    totalAssets: 17500 * 만,
    loanBalance: 2250 * 만,
    netWorth: 15250 * 만,
  },
  {
    index: 5,
    year: 2030,
    age: 36,
    grossIncome: 6000 * 만,
    taxAndInsurance: 600 * 만,
    netIncome: 5400 * 만,
    livingExpense: 2200 * 만,
    housingCost: 200 * 만,
    loanPayment: 1000 * 만,
    loanInterest: 50 * 만,
    loanPrincipalPaid: 950 * 만,
    investmentReturn: 1200 * 만,
    contribution: 600 * 만,
    taxRefund: 0,
    annualSavings: 2000 * 만,
    contributionBalance: 1400 * 만,
    liquidAssets: 15000 * 만,
    lockedAssets: 9000 * 만,
    totalAssets: 24000 * 만,
    loanBalance: 0,
    netWorth: 24000 * 만, // crosses 2억!
  },
];

const mockSummary: SimulationSummary = {
  finalTotalAssets: 24000 * 만,
  finalNetWorth: 24000 * 만,
  totalGrowth: 18000 * 만,
  totalSaved: 10000 * 만,
  totalTaxRefund: 0,
    totalReturn: 4000 * 만,
  averageAnnualSavings: 2000 * 만,
  savingsRate: 28.8,
  firstNegativeYear: null,
  firstContributionShortfallYear: null,
  maxContributionShortfall: 0,
  pensionMaturities: [
    {
      assetId: 'a1',
      assetName: 'ISA 계좌',
      assetType: 'isa',
      maturityYearIndex: 3,
      maturityCalendarYear: 2028,
      maturityAge: 34,
      estimatedAmountAtMaturity: 3000 * 만,
      convertedToLiquid: true,
    },
  ],
};

const mockData: PlannerData = {
  settings: mockSettings,
  assets: [],
  incomes: [],
  housings: [
    {
      id: 'h1',
      name: '마포 전세',
      type: 'jeonse',
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
      id: 'l1',
      name: '버팀목전세대출',
      principal: 8000 * 만,
      annualRate: 2.5,
      termYears: 5,
      repaymentType: 'equalPayment',
      monthlyPayment: 0,
      startYear: 1,
    },
  ],
  expenses: [],
};

describe('timeline utilities', () => {
  it('순자산 마일스톤(1억, 2억 등) 달성 시점을 정확히 감지한다', () => {
    const milestones = extractAssetMilestones(mockRows, 6000 * 만);
    expect(milestones.length).toBeGreaterThan(0);
    const m100m = milestones.find((m) => m.target === 1 * 억);
    expect(m100m).toBeDefined();
    expect(m100m?.reachedCalendarYear).toBe(2027);
    expect(m100m?.reachedAge).toBe(33);

    const m200m = milestones.find((m) => m.target === 2 * 억);
    expect(m200m).toBeDefined();
    expect(m200m?.reachedCalendarYear).toBe(2030);
  });

  it('주요 시점 스냅샷(지금, 3년 후, 5년 후 등)을 구성한다', () => {
    const snapshots = extractHorizonSnapshots(mockRows, {
      totalAssets: 6000 * 만,
      netWorth: 6000 * 만,
      year: 2026,
    });
    expect(snapshots.length).toBeGreaterThanOrEqual(2);
    expect(snapshots[0].label).toContain('지금');
  });

  it('연도별 타임라인 이벤트를 통합 추출한다 (만기, 주거 갱신, 대출 완납 등)', () => {
    const events = extractTimelineEvents(mockData, mockRows, mockSummary);
    expect(events.length).toBeGreaterThan(0);

    // ISA 만기 이벤트 확인
    const isaEvent = events.find((e) => e.title.includes('ISA'));
    expect(isaEvent).toBeDefined();
    expect(isaEvent?.calendarYear).toBe(2028);

    // 대출 완납 이벤트 확인 (termYears 5 -> year index 5)
    const loanEvent = events.find((e) => e.category === 'loan' && e.title.includes('완납'));
    expect(loanEvent).toBeDefined();
  });

  it('보증금 연동 대출(isDepositLinked) 완납 시 보증금 차감 상환 문구가 적용된다', () => {
    const data = {
      ...mockData,
      loans: [{ ...mockData.loans[0], id: 'jeonse-loan', isDepositLinked: true, termYears: 2 }],
    } as unknown as typeof mockData;
    const events = extractTimelineEvents(data, mockRows, mockSummary);
    const loanEvent = events.find((e) => e.id === 'loan-payoff-jeonse-loan');
    expect(loanEvent?.title).toContain('보증금 차감 상환');
    expect(loanEvent?.description).toContain('보증금에서 대출 원금');
    expect(loanEvent?.badge).toBe('보증금 상환');
  });
});

describe('이벤트 시점 (N년차의 끝 = N년 후)', () => {
  it('거치 2년 대출은 2년 후에 거치 종료, 지금 시작한 전세는 2년 후에 갱신', () => {
    const data = {
      ...mockData,
      loans: [{ ...mockData.loans[0], id: 'g', startYear: 1, graceYears: 2, termYears: 8 }],
      housings: [
        { id: 'h', type: 'jeonse', name: '전세', deposit: 0, monthlyRent: 0, maintenanceFee: 0, growthRate: 0, startYear: 1, endYear: null },
      ],
    } as unknown as typeof mockData;
    const events = extractTimelineEvents(data, mockRows, mockSummary);
    expect(events.find((e) => e.id === 'loan-grace-g')?.yearIndex).toBe(2);
    expect(events.filter((e) => e.category === 'housing').map((e) => e.yearIndex)[0]).toBe(2);
  });
});
