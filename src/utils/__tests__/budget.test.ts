import { describe, expect, it } from 'vitest';
import { calculateBudgetShares, applyBudgetPreset, applyBudgetSavingsPreset } from '../budget';
import type { AssetItem, ExpenseItem } from '@/types/planner';

const 만 = 10_000;

describe('calculateBudgetShares', () => {
  it('월 실수령액 100% 기준으로 각 카테고리의 금액과 비중(%)을 올바르게 계산한다', () => {
    const shares = calculateBudgetShares({
      monthlyNetIncome: 300 * 만,
      housingCost: 60 * 만, // 20%
      loanPayment: 30 * 만, // 10%
      livingExpense: 90 * 만, // 30%
      contribution: 90 * 만, // 30%
    });

    expect(shares.monthlyNetIncome).toBe(300 * 만);
    expect(shares.housing.percent).toBeCloseTo(20, 1);
    expect(shares.loan.percent).toBeCloseTo(10, 1);
    expect(shares.living.percent).toBeCloseTo(30, 1);
    expect(shares.contribution.percent).toBeCloseTo(30, 1);
    expect(shares.leftover.amount).toBe(30 * 만); // 10% leftover
    expect(shares.leftover.percent).toBeCloseTo(10, 1);
    expect(shares.status).toBe('surplus');
  });

  it('지출과 저축의 합이 소득을 초과하면 deficit 상태를 반환한다', () => {
    const shares = calculateBudgetShares({
      monthlyNetIncome: 200 * 만,
      housingCost: 50 * 만,
      loanPayment: 50 * 만,
      livingExpense: 80 * 만,
      contribution: 50 * 만, // total = 230만 (30만 초과)
    });

    expect(shares.status).toBe('deficit');
    expect(shares.leftover.amount).toBe(-30 * 만);
    expect(shares.leftover.percent).toBeCloseTo(-15, 1);
  });

  it('소득이 0원일 때 1억% 폭증 없이 비율 0%로 안전하게 처리한다', () => {
    const shares = calculateBudgetShares({
      monthlyNetIncome: 0,
      housingCost: 50 * 만,
      loanPayment: 0,
      livingExpense: 50 * 만,
      contribution: 0,
    });

    expect(shares.status).toBe('deficit');
    expect(shares.housing.percent).toBe(0);
    expect(shares.living.percent).toBe(0);
  });
});

describe('applyBudgetPreset', () => {
  it('50-30-20 프리셋 적용 시 생활비 항목들의 비율을 비례적으로 스케일링한다', () => {
    const expenses: ExpenseItem[] = [
      {
        id: 'e1',
        category: 'food',
        name: '식비',
        monthlyAmount: 60 * 만,
        inflationRate: null,
        startYear: 1,
        endYear: null,
      },
      {
        id: 'e2',
        category: 'transport',
        name: '교통비',
        monthlyAmount: 20 * 만,
        inflationRate: null,
        startYear: 1,
        endYear: null,
      },
    ];

    // 소득 400만, 주거 60만, 대출 40만
    // 50-30-20: 필수(주거+대출+생활) = 50% (200만) -> 생활비 목표 = 200만 - (60만+40만) = 100만
    // 기존 생활비 총 80만이 100만으로 1.25배 스케일링 (식비 75만, 교통비 25만)
    const scaled = applyBudgetPreset('50-30-20', 400 * 만, expenses, 60 * 만, 40 * 만);
    const newTotal = scaled.reduce((sum, e) => sum + e.monthlyAmount, 0);

    expect(newTotal).toBeCloseTo(100 * 만, -2);
    expect(scaled.find((e) => e.id === 'e1')?.monthlyAmount).toBeCloseTo(75 * 만, -2);
  });
});

describe('applyBudgetSavingsPreset', () => {
  it('50-30-20 프리셋 적용 시 저축 자산 항목들의 월 자동이체액을 30% 목표에 맞게 스케일링한다', () => {
    const assets: AssetItem[] = [
      {
        id: 'a1',
        type: 'savings',
        name: '적금',
        amount: 500 * 만,
        annualReturnRate: 3.5,
        liquid: true,
        monthlyContribution: 40 * 만,
      },
      {
        id: 'a2',
        type: 'isa',
        name: 'ISA',
        amount: 300 * 만,
        annualReturnRate: 6,
        liquid: false,
        monthlyContribution: 20 * 만,
      },
    ];

    // 소득 400만 -> 50-30-20 저축 목표 30% = 120만
    // 기존 저축 합 60만(40만+20만)이 120만으로 2배 스케일링 -> a1: 80만, a2: 40만
    const updated = applyBudgetSavingsPreset('50-30-20', 400 * 만, assets);
    const totalContrib = updated.reduce((sum, a) => sum + a.monthlyContribution, 0);

    expect(totalContrib).toBeCloseTo(120 * 만, -2);
    expect(updated.find((a) => a.id === 'a1')?.monthlyContribution).toBeCloseTo(80 * 만, -2);
    expect(updated.find((a) => a.id === 'a2')?.monthlyContribution).toBeCloseTo(40 * 만, -2);
  });
});
