import { describe, expect, it } from 'vitest';
import {
  earnedIncomeDeduction,
  estimateTaxRefund,
  estimateTaxableBase,
  marginalRateFor,
  type TaxRefundInput,
} from '@/utils/taxRefund';

const 만 = 10_000;

const base: TaxRefundInput = {
  grossSalary: 5000 * 만,
  pensionPaid: 0,
  housingSubscriptionPaid: 0,
  rentPaid: 0,
  rentLoanRepaid: 0,
  houselessHead: true,
};

const item = (input: TaxRefundInput, key: string) => {
  const found = estimateTaxRefund(input).items.find((i) => i.key === key);
  if (!found) throw new Error(`항목 없음: ${key}`);
  return found;
};

describe('근로소득공제 / 과세표준 / 한계세율', () => {
  it('구간별 근로소득공제 공식을 따른다', () => {
    expect(earnedIncomeDeduction(4_000_000)).toBeCloseTo(2_800_000, 0);
    // 1,500~4,500만 구간: 750만 + (3000만-1500만)*15%
    expect(earnedIncomeDeduction(3000 * 만)).toBeCloseTo(975 * 만, 0);
    // 4,500만~1억 구간: 1,200만 + (5000만-4500만)*5%
    expect(earnedIncomeDeduction(5000 * 만)).toBeCloseTo(1225 * 만, 0);
  });

  it('과세표준은 총급여보다 낮고 음수가 되지 않는다', () => {
    const g = 5000 * 만;
    const taxableBase = estimateTaxableBase(g);
    expect(taxableBase).toBeLessThan(g);
    expect(taxableBase).toBeGreaterThan(0);
    expect(estimateTaxableBase(0)).toBe(0);
    expect(estimateTaxableBase(500 * 만)).toBe(0);
  });

  it('한계세율은 과세표준 구간을 따라 올라간다', () => {
    expect(marginalRateFor(0)).toBe(0);
    expect(marginalRateFor(1000 * 만)).toBe(6.6);
    expect(marginalRateFor(4000 * 만)).toBe(16.5);
    expect(marginalRateFor(8000 * 만)).toBe(26.4);
    expect(marginalRateFor(20_0000 * 만)).toBe(49.5);
  });
});

describe('연금저축 · IRP 세액공제', () => {
  it('총급여 5,500만원 이하면 16.5%, 초과면 13.2% 를 적용한다', () => {
    const low = item({ ...base, grossSalary: 5000 * 만, pensionPaid: 600 * 만 }, 'pension');
    expect(low.rate).toBe(16.5);
    expect(low.saving).toBeCloseTo(600 * 만 * 0.165, 0);

    const high = item({ ...base, grossSalary: 7000 * 만, pensionPaid: 600 * 만 }, 'pension');
    expect(high.rate).toBe(13.2);
    expect(high.saving).toBeCloseTo(600 * 만 * 0.132, 0);
  });

  it('연 900만원을 넘게 넣어도 한도까지만 공제한다', () => {
    const over = item({ ...base, pensionPaid: 1500 * 만 }, 'pension');
    expect(over.eligible).toBe(900 * 만);
    expect(over.saving).toBeCloseTo(900 * 만 * 0.165, 0);
  });
});

describe('주거 관련 공제', () => {
  it('무주택 세대주가 아니면 청약 · 월세 · 전세대출 공제가 모두 0 이 된다', () => {
    const input: TaxRefundInput = {
      ...base,
      houselessHead: false,
      housingSubscriptionPaid: 300 * 만,
      rentPaid: 600 * 만,
      rentLoanRepaid: 500 * 만,
    };
    for (const key of ['housingSubscription', 'rent', 'rentLoan']) {
      const found = item(input, key);
      expect(found.saving).toBe(0);
      expect(found.blockedReason).toBe('무주택 세대주 요건을 켜야 합니다');
    }
    // 연금 공제는 무주택 요건과 무관하다
    expect(item({ ...input, pensionPaid: 100 * 만 }, 'pension').saving).toBeGreaterThan(0);
  });

  it('청약은 납입액 300만원까지의 40% 를 한계세율로 환산한다', () => {
    const input = { ...base, housingSubscriptionPaid: 400 * 만 };
    const found = item(input, 'housingSubscription');
    const { marginalRate } = estimateTaxRefund(input);
    expect(found.eligible).toBe(300 * 만);
    expect(found.deduction).toBeCloseTo(120 * 만, 0);
    expect(found.saving).toBeCloseTo(120 * 만 * (marginalRate / 100), 0);
  });

  it('총급여가 7,000만원을 넘으면 청약 공제를 받지 못한다', () => {
    const found = item(
      { ...base, grossSalary: 8000 * 만, housingSubscriptionPaid: 300 * 만 },
      'housingSubscription',
    );
    expect(found.saving).toBe(0);
    expect(found.blockedReason).toBe('총급여 7,000만원을 넘습니다');
  });

  it('청약과 전세대출 공제액 합계는 400만원을 넘지 않는다', () => {
    const input = {
      ...base,
      housingSubscriptionPaid: 300 * 만, // 공제액 120만
      rentLoanRepaid: 2000 * 만, // 공제액 800만 -> 280만으로 깎임
    };
    const sub = item(input, 'housingSubscription');
    const loan = item(input, 'rentLoan');
    expect(sub.deduction + loan.deduction).toBeCloseTo(400 * 만, 0);
    expect(loan.deduction).toBeCloseTo(280 * 만, 0);
  });

  it('월세는 연 1,000만원 한도이고 총급여 8,000만원 초과면 받지 못한다', () => {
    const found = item({ ...base, rentPaid: 1500 * 만 }, 'rent');
    expect(found.eligible).toBe(1000 * 만);
    expect(found.rate).toBe(17);
    expect(found.saving).toBeCloseTo(1000 * 만 * 0.17, 0);

    const blocked = item({ ...base, grossSalary: 9000 * 만, rentPaid: 600 * 만 }, 'rent');
    expect(blocked.saving).toBe(0);
    expect(blocked.blockedReason).toBe('총급여 8,000만원을 넘습니다');
  });
});

describe('합계와 남은 한도', () => {
  it('환급 합계는 항목별 절감세액의 합이다', () => {
    const result = estimateTaxRefund({
      ...base,
      pensionPaid: 900 * 만,
      housingSubscriptionPaid: 240 * 만,
      rentPaid: 600 * 만,
    });
    const sum = result.items.reduce((acc, i) => acc + i.saving, 0);
    expect(result.totalSaving).toBeCloseTo(sum, 0);
    expect(result.totalSaving).toBeGreaterThan(0);
  });

  it('아무것도 넣지 않으면 환급이 0 이고 한도 여력이 전부 남는다', () => {
    const result = estimateTaxRefund(base);
    expect(result.totalSaving).toBe(0);
    expect(result.unusedRoom).toBe(1200 * 만); // 연금 900만 + 청약 300만
  });

  it('무주택 세대주가 아니면 청약 한도는 여력으로 세지 않는다', () => {
    const result = estimateTaxRefund({ ...base, houselessHead: false });
    expect(result.unusedRoom).toBe(900 * 만);
  });
});
