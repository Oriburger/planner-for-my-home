import { describe, expect, it } from 'vitest';
import { runSimulation, incomeForYear } from '../simulation';
import { monthlyEqualPayment, simulateLoanYear } from '../loan';
import { estimateNetIncome } from '../tax';
import type { PlannerData, SimulationSettings } from '@/types/planner';

const 만 = 10_000;

const baseSettings: SimulationSettings = {
  startYear: 2026,
  years: 10,
  inflationRate: 0,
  taxMode: 'flatRate',
  flatTaxRate: 0,
  applyAssetReturn: false,
  savingsReturnRate: 0,
  currentAge: null,
};

function makeData(overrides: Partial<PlannerData> = {}): PlannerData {
  return {
    settings: baseSettings,
    assets: [],
    incomes: [],
    housings: [],
    loans: [],
    expenses: [],
    ...overrides,
  };
}

describe('incomeForYear', () => {
  it('고정 인상률을 복리로 적용한다', () => {
    const income = {
      id: 'i1',
      type: 'salary' as const,
      name: '연봉',
      annualAmount: 5000 * 만,
      growthMode: 'fixed' as const,
      growthRate: 10,
      manualGrowthRates: [],
      taxable: true,
      startYear: 1,
      endYear: null,
    };

    expect(incomeForYear(income, 1)).toBe(5000 * 만);
    expect(incomeForYear(income, 2)).toBeCloseTo(5500 * 만, 0);
    expect(incomeForYear(income, 3)).toBeCloseTo(6050 * 만, 0);
  });

  it('연도별 수동 인상률을 순차 적용하고, 배열이 짧으면 마지막 값을 이어 쓴다', () => {
    const income = {
      id: 'i2',
      type: 'salary' as const,
      name: '연봉',
      annualAmount: 100,
      growthMode: 'manual' as const,
      growthRate: 0,
      manualGrowthRates: [10, 20],
      taxable: true,
      startYear: 1,
      endYear: null,
    };

    expect(incomeForYear(income, 1)).toBe(100);
    expect(incomeForYear(income, 2)).toBeCloseTo(110);
    expect(incomeForYear(income, 3)).toBeCloseTo(132);
    // 4년차는 마지막 값(20%)을 재사용
    expect(incomeForYear(income, 4)).toBeCloseTo(158.4);
  });

  it('종료 연차 이후에는 0을 반환한다', () => {
    const income = {
      id: 'i3',
      type: 'side' as const,
      name: '부수입',
      annualAmount: 1000,
      growthMode: 'fixed' as const,
      growthRate: 0,
      manualGrowthRates: [],
      taxable: false,
      startYear: 2,
      endYear: 3,
    };

    expect(incomeForYear(income, 1)).toBe(0);
    expect(incomeForYear(income, 2)).toBe(1000);
    expect(incomeForYear(income, 3)).toBe(1000);
    expect(incomeForYear(income, 4)).toBe(0);
  });
});

describe('runSimulation', () => {
  it('수입 - 지출이 매년 그대로 누적된다 (수익률 0)', () => {
    const data = makeData({
      settings: { ...baseSettings, years: 3 },
      assets: [
        {
          id: 'a1',
          type: 'cash',
          name: '현금',
          amount: 1000 * 만,
          annualReturnRate: 0,
          liquid: true,
          monthlyContribution: 0,
        },
      ],
      incomes: [
        {
          id: 'i1',
          type: 'salary',
          name: '연봉',
          annualAmount: 5000 * 만,
          growthMode: 'fixed',
          growthRate: 0,
          manualGrowthRates: [],
          taxable: true,
          startYear: 1,
          endYear: null,
        },
      ],
      expenses: [
        {
          id: 'e1',
          category: 'food',
          name: '생활비',
          monthlyAmount: 100 * 만,
          inflationRate: null,
          startYear: 1,
          endYear: null,
        },
      ],
    });

    const { rows } = runSimulation(data);

    // 연 저축 = 5000만 - 1200만 = 3800만
    expect(rows[0].annualSavings).toBeCloseTo(3800 * 만, 0);
    expect(rows[0].totalAssets).toBeCloseTo(4800 * 만, 0);
    expect(rows[1].totalAssets).toBeCloseTo(8600 * 만, 0);
    expect(rows[2].totalAssets).toBeCloseTo(12400 * 만, 0);
  });

  it('자산 수익률을 복리로 적용한다', () => {
    const data = makeData({
      settings: { ...baseSettings, years: 2, applyAssetReturn: true },
      assets: [
        {
          id: 'a1',
          type: 'investment',
          name: 'ETF',
          amount: 1000 * 만,
          annualReturnRate: 10,
          liquid: true,
          monthlyContribution: 0,
        },
      ],
    });

    const { rows } = runSimulation(data);
    expect(rows[0].totalAssets).toBeCloseTo(1100 * 만, 0);
    expect(rows[1].totalAssets).toBeCloseTo(1210 * 만, 0);
  });

  it('보증금은 총자산에 중립적이고 유동 -> 비유동으로만 이동한다', () => {
    const data = makeData({
      settings: { ...baseSettings, years: 3 },
      assets: [
        {
          id: 'a1',
          type: 'cash',
          name: '현금',
          amount: 3 * 100_000_000,
          annualReturnRate: 0,
          liquid: true,
          monthlyContribution: 0,
        },
      ],
      housings: [
        {
          id: 'h1',
          type: 'jeonse',
          name: '2년차 전세',
          deposit: 2 * 100_000_000,
          monthlyRent: 0,
          monthlyMaintenance: 0,
          annualIncreaseRate: 0,
          startYear: 2,
          endYear: null,
        },
      ],
    });

    const { rows } = runSimulation(data);

    // 총자산은 변하지 않는다
    expect(rows[1].totalAssets).toBeCloseTo(3 * 100_000_000, 0);
    // 2년차에 2억이 묶인 자산으로 이동
    expect(rows[1].lockedAssets).toBeCloseTo(2 * 100_000_000, 0);
    expect(rows[1].liquidAssets).toBeCloseTo(1 * 100_000_000, 0);
  });

  it('월 자동이체가 저축여력을 초과하면 감당 가능한 만큼만 반영하고, 총자산은 줄어들지 않는다', () => {
    const build = (monthlyContribution: number) =>
      makeData({
        settings: { ...baseSettings, years: 5, applyAssetReturn: true, savingsReturnRate: 3 },
        assets: [
          {
            id: 'a1',
            type: 'isa',
            name: 'ISA',
            amount: 0,
            annualReturnRate: 6,
            liquid: false,
            monthlyContribution,
          },
        ],
        incomes: [
          {
            id: 'i1',
            type: 'salary',
            name: '연봉',
            annualAmount: 3000 * 만,
            growthMode: 'fixed',
            growthRate: 0,
            manualGrowthRates: [],
            taxable: false,
            startYear: 1,
            endYear: null,
          },
        ],
        expenses: [
          {
            id: 'e1',
            category: 'food',
            name: '생활비',
            monthlyAmount: 200 * 만,
            inflationRate: null,
            startYear: 1,
            endYear: null,
          },
        ],
      });

    // 연 저축액(annualSavings) = 3000만 - 2400만 = 600만.
    // 자동이체를 저축여력(600만)보다 훨씬 크게(연 2400만) 잡아도
    // 여유자금이 빚처럼 마이너스 복리로 굴러가서는 안 된다.
    const overCommitted = runSimulation(build(200 * 만));
    const modest = runSimulation(build(30 * 만));

    const lastOver = overCommitted.rows[overCommitted.rows.length - 1];
    const lastModest = modest.rows[modest.rows.length - 1];

    // 실제 반영된 이체액은 그 해 감당 가능한 금액을 넘지 않는다.
    expect(overCommitted.rows[0].contribution).toBeCloseTo(600 * 만, 0);
    // 과도한 자동이체 설정이 적정 설정보다 최종 총자산을 더 깎아먹지 않는다.
    expect(lastOver.totalAssets).toBeGreaterThanOrEqual(lastModest.totalAssets - 1);
  });

  it('순자산은 대출 잔액을 뺀 값이며 상환에 따라 잔액이 줄어든다', () => {
    const data = makeData({
      settings: { ...baseSettings, years: 3 },
      assets: [
        {
          id: 'a1',
          type: 'cash',
          name: '현금',
          amount: 1 * 100_000_000,
          annualReturnRate: 0,
          liquid: true,
          monthlyContribution: 0,
        },
      ],
      loans: [
        {
          id: 'l1',
          name: '신용대출',
          principal: 3000 * 만,
          annualRate: 5,
          termYears: 3,
          repaymentType: 'equalPayment',
          monthlyPayment: 0,
          startYear: 1,
        },
      ],
    });

    const { rows } = runSimulation(data);

    expect(rows[0].loanBalance).toBeLessThan(3000 * 만);
    expect(rows[2].loanBalance).toBeCloseTo(0, 0);
    expect(rows[2].netWorth).toBeCloseTo(rows[2].totalAssets, 0);
    // 이자를 포함해 원금보다 많이 갚는다
    const totalPaid = rows.reduce((s, r) => s + r.loanPayment, 0);
    expect(totalPaid).toBeGreaterThan(3000 * 만);
  });
});

describe('loan', () => {
  it('원리금균등 월 납입액 (1억 / 연 5% / 30년) 은 약 536,822원', () => {
    const payment = monthlyEqualPayment(100_000_000, 5, 30);
    expect(payment).toBeGreaterThan(536_000);
    expect(payment).toBeLessThan(537_500);
  });

  it('무이자 대출은 원금을 기간으로 나눈 값만 상환한다', () => {
    expect(monthlyEqualPayment(1_200_000, 0, 1)).toBeCloseTo(100_000, 5);
  });

  it('만기일시상환은 만기 연도에 원금을 한 번에 갚는다', () => {
    const loan = {
      id: 'l1',
      name: '만기일시',
      principal: 1000 * 만,
      annualRate: 6,
      termYears: 2,
      repaymentType: 'interestOnly' as const,
      monthlyPayment: 0,
      startYear: 1,
    };

    const year1 = simulateLoanYear(loan, 1, 1000 * 만);
    expect(year1.principalPaid).toBe(0);
    expect(year1.interest).toBeCloseTo(60 * 만, 0);
    expect(year1.balance).toBeCloseTo(1000 * 만, 0);

    const year2 = simulateLoanYear(loan, 2, year1.balance);
    expect(year2.principalPaid).toBeCloseTo(1000 * 만, 0);
    expect(year2.balance).toBe(0);
  });

  it('거치 기간 동안은 이자만 납부하고, 거치 후 원금 상환이 시작된다', () => {
    const loan = {
      id: 'l_grace',
      name: '거치대출',
      principal: 1200 * 만,
      annualRate: 5,
      termYears: 3,
      graceYears: 1,
      repaymentType: 'equalPrincipal' as const,
      monthlyPayment: 0,
      startYear: 1,
    };

    // 1년차(거치): 이자만 발생
    const year1 = simulateLoanYear(loan, 1, 1200 * 만);
    expect(year1.principalPaid).toBe(0);
    expect(year1.balance).toBe(1200 * 만);

    // 2년차(거치 후): 남은 2년간 원금균등 상환 (연 600만원씩)
    const year2 = simulateLoanYear(loan, 2, year1.balance);
    expect(year2.principalPaid).toBeCloseTo(600 * 만, 0);
    expect(year2.balance).toBeCloseTo(600 * 만, 0);
  });

  it('만기 자동 연장(autoRenew) 시 만기 연도에도 원금을 갚지 않고 이자만 계속 납부한다', () => {
    const loan = {
      id: 'l_renew',
      name: '버팀목 연장',
      principal: 2000 * 만,
      annualRate: 3,
      termYears: 2,
      repaymentType: 'interestOnly' as const,
      monthlyPayment: 0,
      startYear: 1,
      autoRenew: true,
    };

    const year2 = simulateLoanYear(loan, 2, 2000 * 만);
    expect(year2.principalPaid).toBe(0);
    expect(year2.balance).toBe(2000 * 만);
  });

  it('보증금 상환 연동(isDepositLinked) 시 원금 상환액이 유동 현금 지출에서 제외된다', () => {
    const loan = {
      id: 'l_link',
      name: '보증금 연동 대출',
      principal: 2000 * 만,
      annualRate: 4,
      termYears: 1,
      repaymentType: 'interestOnly' as const,
      monthlyPayment: 0,
      startYear: 1,
      isDepositLinked: true,
    };

    const year1 = simulateLoanYear(loan, 1, 2000 * 만);
    expect(year1.principalPaid).toBe(2000 * 만);
    expect(year1.cashPrincipalPaid).toBe(0);
    expect(year1.depositLinkedPrincipalPaid).toBe(2000 * 만);
    // 현금 지출 payment 는 이자만 포함
    expect(year1.payment).toBe(year1.interest);
  });

  it('상환 시작 전에는 현금흐름이 없다', () => {
    const loan = {
      id: 'l2',
      name: '미래 대출',
      principal: 1000 * 만,
      annualRate: 4,
      termYears: 5,
      repaymentType: 'equalPayment' as const,
      monthlyPayment: 0,
      startYear: 3,
    };
    expect(simulateLoanYear(loan, 1, 1000 * 만).payment).toBe(0);
  });

  it('미래 대출(startYear > 1)은 시작 연차 전까지 대출 잔액이 0이다', () => {
    const data = makeData({
      settings: { ...baseSettings, years: 5 },
      loans: [
        {
          id: 'l_future',
          name: '미래 주담대',
          principal: 5000 * 만,
          annualRate: 4,
          termYears: 5,
          repaymentType: 'interestOnly' as const,
          monthlyPayment: 0,
          startYear: 3,
        },
      ],
    });

    const res = runSimulation(data);
    expect(res.rows[0].loanBalance).toBe(0); // 1년차: 대출 잔액 0
    expect(res.rows[1].loanBalance).toBe(0); // 2년차: 대출 잔액 0
    expect(res.rows[2].loanBalance).toBe(5000 * 만); // 3년차: 대출 실행
  });

  it('연금저축/ISA 자산 만기 시 자동이체가 중단되고 만기 요약에 집계된다', () => {
    const data = makeData({
      settings: { ...baseSettings, years: 5 },
      incomes: [
        {
          id: 'i1',
          type: 'salary' as const,
          name: '연봉',
          annualAmount: 5000 * 만,
          growthMode: 'fixed' as const,
          growthRate: 0,
          manualGrowthRates: [],
          taxable: false,
          startYear: 1,
          endYear: null,
        },
      ],
      assets: [
        {
          id: 'a_pension',
          type: 'pension' as const,
          name: '연금저축펀드',
          amount: 1000 * 만,
          annualReturnRate: 0,
          liquid: false,
          monthlyContribution: 10 * 만,
          maturityYear: 3,
          convertLiquidOnMaturity: true,
        },
      ],
    });

    const res = runSimulation(data);
    expect(res.summary.pensionMaturities).toHaveLength(1);
    expect(res.summary.pensionMaturities[0].maturityYearIndex).toBe(3);
    // 3년차 만기 이후에는 납입 중단되고 유동자산으로 전환
    expect(res.rows[2].liquidAssets).toBeGreaterThan(1000 * 만);
  });
});

describe('tax', () => {
  it('flatRate 모드는 지정한 공제율을 그대로 적용한다', () => {
    const net = estimateNetIncome(5000 * 만, {
      taxMode: 'flatRate',
      flatTaxRate: 20,
    });
    expect(net).toBeCloseTo(4000 * 만, 0);
  });

  it('연봉이 높을수록 실효 공제율이 커진다', () => {
    const settings = { taxMode: 'simplified' as const, flatTaxRate: 0 };
    const lowRate =
      1 - estimateNetIncome(3000 * 만, settings) / (3000 * 만);
    const highRate =
      1 - estimateNetIncome(10000 * 만, settings) / (10000 * 만);
    expect(highRate).toBeGreaterThan(lowRate);
  });
});
