import { describe, expect, it } from 'vitest';
import { calculateBudgetShares, applyBudgetPreset } from '../budget';
import type { ExpenseItem } from '@/types/planner';

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
