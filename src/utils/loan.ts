import type { LoanItem } from '@/types/planner';

export interface LoanYearFlow {
  /** 해당 연도에 실제로 나간 총 상환액 (원금 + 이자) */
  payment: number;
  interest: number;
  principalPaid: number;
  /** 연말 잔액 */
  balance: number;
}

/** 원리금균등 상환 시 월 납입액 */
export function monthlyEqualPayment(
  principal: number,
  annualRatePercent: number,
  termYears: number,
): number {
  const n = Math.max(1, Math.round(termYears * 12));
  const r = annualRatePercent / 100 / 12;

  if (r === 0) return principal / n;

  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/**
 * 대출 1건의 특정 연차 현금흐름을 월 단위로 시뮬레이션한다.
 *
 * @param loan       대출 정보
 * @param yearIndex  시뮬레이션 연차 (1 = 첫 해)
 * @param balance    연초 잔액
 */
export function simulateLoanYear(
  loan: LoanItem,
  yearIndex: number,
  balance: number,
): LoanYearFlow {
  const empty: LoanYearFlow = {
    payment: 0,
    interest: 0,
    principalPaid: 0,
    balance,
  };

  // 아직 상환 시작 전이거나 이미 완제된 경우
  if (yearIndex < loan.startYear || balance <= 0) return empty;

  const endYear = loan.startYear + loan.termYears - 1;
  const monthlyRate = loan.annualRate / 100 / 12;

  let remaining = balance;
  let interestSum = 0;
  let principalSum = 0;

  // 만기 이후에도 잔액이 남아 있으면 이자만 계속 발생하는 것으로 처리
  const pastMaturity = yearIndex > endYear;

  for (let month = 0; month < 12; month += 1) {
    if (remaining <= 0) break;

    const interest = remaining * monthlyRate;
    let principal = 0;

    if (pastMaturity) {
      principal = 0;
    } else {
      switch (loan.repaymentType) {
        case 'equalPayment': {
          const payment = monthlyEqualPayment(
            loan.principal,
            loan.annualRate,
            loan.termYears,
          );
          principal = payment - interest;
          break;
        }
        case 'equalPrincipal': {
          principal = loan.principal / Math.max(1, loan.termYears * 12);
          break;
        }
        case 'interestOnly': {
          // 만기에 원금 일시 상환
          principal = yearIndex === endYear && month === 11 ? remaining : 0;
          break;
        }
        case 'fixedMonthly': {
          principal = loan.monthlyPayment - interest;
          break;
        }
      }
    }

    // 이자보다 적게 내면 원금이 늘어나는 상황이 되므로 0으로 막는다
    principal = Math.max(0, Math.min(principal, remaining));

    remaining -= principal;
    interestSum += interest;
    principalSum += principal;
  }

  return {
    payment: interestSum + principalSum,
    interest: interestSum,
    principalPaid: principalSum,
    balance: Math.max(0, remaining),
  };
}
