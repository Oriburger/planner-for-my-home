import type { LoanItem } from '@/types/planner';

export interface LoanYearFlow {
  /** 해당 연도에 실제로 유동 현금에서 나간 총 상환액 (현금 원금 + 이자) */
  payment: number;
  interest: number;
  principalPaid: number;
  /** 현금으로 납부된 원금 */
  cashPrincipalPaid: number;
  /** 보증금과 상쇄(Offset)되어 유동 현금 지출에서 제외된 원금 */
  depositLinkedPrincipalPaid: number;
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
    cashPrincipalPaid: 0,
    depositLinkedPrincipalPaid: 0,
    balance,
  };

  // 아직 상환 시작 전이거나 이미 완제된 경우
  if (yearIndex < loan.startYear || balance <= 0) return empty;

  const endYear = loan.startYear + loan.termYears - 1;
  const monthlyRate = loan.annualRate / 100 / 12;

  const graceYears = Math.min(
    Math.max(0, loan.graceYears ?? 0),
    Math.max(0, loan.termYears - 1),
  );
  const graceEndYear = loan.startYear + graceYears - 1;
  const inGracePeriod = yearIndex <= graceEndYear;

  // 거치기간 후 실제 상환 기간 (년)
  const amortizationYears = Math.max(1, loan.termYears - graceYears);

  let remaining = balance;
  let interestSum = 0;
  let principalSum = 0;

  const pastMaturity = yearIndex > endYear;

  for (let month = 0; month < 12; month += 1) {
    if (remaining <= 0) break;

    const interest = remaining * monthlyRate;
    let principal = 0;

    if (inGracePeriod) {
      // 거치 기간 중에는 이자만 납부 (원금 상환 0)
      principal = 0;
    } else if (pastMaturity) {
      // 만기 이후에는 만기 연장 여부에 관계없이 잔액에 대한 이자만 발생
      principal = 0;
    } else {
      switch (loan.repaymentType) {
        case 'equalPayment': {
          const payment = monthlyEqualPayment(
            loan.principal,
            loan.annualRate,
            amortizationYears,
          );
          principal = payment - interest;
          break;
        }
        case 'equalPrincipal': {
          principal = loan.principal / Math.max(1, amortizationYears * 12);
          break;
        }
        case 'interestOnly': {
          // 만기에 원금 일시 상환 (autoRenew 가 켜져있으면 만기에도 0)
          if (loan.autoRenew) {
            principal = 0;
          } else {
            principal = yearIndex === endYear && month === 11 ? remaining : 0;
          }
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

  const isDepositLinked = loan.isDepositLinked ?? false;
  const cashPrincipalPaid = isDepositLinked ? 0 : principalSum;
  const depositLinkedPrincipalPaid = isDepositLinked ? principalSum : 0;

  return {
    payment: interestSum + cashPrincipalPaid,
    interest: interestSum,
    principalPaid: principalSum,
    cashPrincipalPaid,
    depositLinkedPrincipalPaid,
    balance: Math.max(0, remaining),
  };
}
