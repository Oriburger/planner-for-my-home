/**
 * 연말정산 환급 예상 모듈
 *
 * "환급액"은 원천징수액과 결정세액의 차이지만, 월 급여에서 얼마를 떼였는지는
 * 사람마다 달라 추정이 불가능하다. 그래서 여기서는 **저축·주거 관련 공제로
 * 줄어드는 세금(절감세액)** 을 환급 기대치로 계산한다. 공제 항목을 하나도
 * 챙기지 않았을 때와 비교해 "덜 내는 세금"이며, 실무에서 환급으로 체감하는 금액이다.
 *
 * 2025년 귀속 기준이고 지방소득세(10%)를 포함한 세율을 쓴다.
 * 부양가족·의료비·기부금 등 사람마다 크게 갈리는 항목은 넣지 않았다.
 */

/** 공제 유형 */
export type DeductionKind = 'taxCredit' | 'incomeDeduction';

export interface TaxRefundItem {
  key: string;
  label: string;
  kind: DeductionKind;
  /** 연간 납입·지출액 (원) */
  paid: number;
  /** 한도를 적용한 공제 대상 금액 (원) */
  eligible: number;
  /** 세액공제율(%) 또는 소득공제율(%) */
  rate: number;
  /** 소득공제인 경우의 공제액 (과세표준에서 빠지는 금액) */
  deduction: number;
  /** 실제로 줄어드는 세금 (원) */
  saving: number;
  /** 한도·요건 안내 */
  note: string;
  /** 요건을 못 채워 0원이 된 이유 (없으면 null) */
  blockedReason: string | null;
}

export interface TaxRefundResult {
  /** 절감세액 합계 = 환급 예상액 */
  totalSaving: number;
  items: TaxRefundItem[];
  /** 추정 과세표준 (원) */
  taxableBase: number;
  /** 과세표준에 대응하는 한계세율 (%, 지방소득세 포함) */
  marginalRate: number;
  /** 아직 한도가 남아 더 넣을 수 있는 금액 (원) */
  unusedRoom: number;
}

export interface TaxRefundInput {
  /** 총급여 = 과세 대상 근로소득 (원) */
  grossSalary: number;
  /** 연금저축 + IRP 연 납입액 (원) */
  pensionPaid: number;
  /** 주택청약종합저축 연 납입액 (원) */
  housingSubscriptionPaid: number;
  /** 월세 연 지급액 (원) */
  rentPaid: number;
  /** 주택임차차입금(전세대출) 연 원리금 상환액 (원) */
  rentLoanRepaid: number;
  /** 무주택 세대주 여부 — 청약·월세·임차차입금 공제의 공통 요건 */
  houselessHead: boolean;
}

const 만 = 10_000;

/* ------------------------------------------------------------------ */
/* 한계세율 / 과세표준 추정                                             */
/* ------------------------------------------------------------------ */

/** [과세표준 상한(원), 한계세율(%) — 지방소득세 10% 포함] */
const MARGINAL_RATE_TABLE: Array<[number, number]> = [
  [14_000_000, 6.6],
  [50_000_000, 16.5],
  [88_000_000, 26.4],
  [150_000_000, 38.5],
  [300_000_000, 41.8],
  [500_000_000, 44.0],
  [1_000_000_000, 46.2],
];
const TOP_MARGINAL_RATE = 49.5;

/** 과세표준에 대한 한계세율(%) */
export function marginalRateFor(taxableBase: number): number {
  if (taxableBase <= 0) return 0;
  for (const [limit, rate] of MARGINAL_RATE_TABLE) {
    if (taxableBase <= limit) return rate;
  }
  return TOP_MARGINAL_RATE;
}

/** 총급여에 대한 근로소득공제액 (원) */
export function earnedIncomeDeduction(grossSalary: number): number {
  const g = Math.max(0, grossSalary);
  if (g <= 5_000_000) return g * 0.7;
  if (g <= 15_000_000) return 3_500_000 + (g - 5_000_000) * 0.4;
  if (g <= 45_000_000) return 7_500_000 + (g - 15_000_000) * 0.15;
  if (g <= 100_000_000) return 12_000_000 + (g - 45_000_000) * 0.05;
  return 14_750_000 + (g - 100_000_000) * 0.02;
}

/**
 * 과세표준 근사치.
 * 총급여에서 근로소득공제 · 본인 인적공제(150만) · 4대보험료 공제(약 9%)를 뺀다.
 * 부양가족·의료비·신용카드 공제는 사람마다 달라 넣지 않았으므로 실제보다 높게 나온다.
 */
export function estimateTaxableBase(grossSalary: number): number {
  const g = Math.max(0, grossSalary);
  const base =
    g - earnedIncomeDeduction(g) - 1_500_000 - g * 0.09;
  return Math.max(0, base);
}

/* ------------------------------------------------------------------ */
/* 항목별 계산                                                          */
/* ------------------------------------------------------------------ */

/** 연금계좌(연금저축 + IRP) 세액공제 한도 (원) */
const PENSION_LIMIT = 900 * 만;
/** 연금계좌 세액공제율 기준이 되는 총급여 경계 (원) */
const PENSION_RATE_THRESHOLD = 5500 * 만;

/** 주택청약 소득공제: 납입액 한도 (원) */
const SUBSCRIPTION_PAID_LIMIT = 300 * 만;
/** 주택청약·임차차입금 공제액 합산 한도 (원) */
const HOUSING_DEDUCTION_LIMIT = 400 * 만;
/** 주택청약 소득공제 요건: 총급여 상한 (원) */
const SUBSCRIPTION_SALARY_LIMIT = 7000 * 만;

/** 월세 세액공제: 연 지급액 한도 (원) */
const RENT_LIMIT = 1000 * 만;
/** 월세 세액공제 요건: 총급여 상한 (원) */
const RENT_SALARY_LIMIT = 8000 * 만;

/**
 * 저축·주거 공제로 줄어드는 세금을 추정한다.
 * 항목이 0원이거나 요건을 못 채워도 목록에는 남겨 왜 못 받는지 보여준다.
 */
export function estimateTaxRefund(input: TaxRefundInput): TaxRefundResult {
  const {
    grossSalary,
    pensionPaid,
    housingSubscriptionPaid,
    rentPaid,
    rentLoanRepaid,
    houselessHead,
  } = input;

  const taxableBase = estimateTaxableBase(grossSalary);
  const marginalRate = marginalRateFor(taxableBase);
  const items: TaxRefundItem[] = [];

  /* --- 1. 연금저축 · IRP 세액공제 --- */
  const pensionRate = grossSalary <= PENSION_RATE_THRESHOLD ? 16.5 : 13.2;
  const pensionEligible = Math.min(Math.max(0, pensionPaid), PENSION_LIMIT);
  items.push({
    key: 'pension',
    label: '연금저축 · IRP',
    kind: 'taxCredit',
    paid: pensionPaid,
    eligible: pensionEligible,
    rate: pensionRate,
    deduction: 0,
    saving: pensionEligible * (pensionRate / 100),
    note: `납입액 연 900만원 한도 · 공제율 ${pensionRate}% (총급여 5,500만원 ${
      grossSalary <= PENSION_RATE_THRESHOLD ? '이하' : '초과'
    })`,
    blockedReason: pensionPaid <= 0 ? '납입액이 없습니다' : null,
  });

  /* --- 2. 주택청약종합저축 소득공제 --- */
  const subscriptionAllowed =
    houselessHead && grossSalary <= SUBSCRIPTION_SALARY_LIMIT;
  const subscriptionEligible = subscriptionAllowed
    ? Math.min(Math.max(0, housingSubscriptionPaid), SUBSCRIPTION_PAID_LIMIT)
    : 0;
  let subscriptionDeduction = subscriptionEligible * 0.4;

  /* --- 3. 주택임차차입금 원리금 상환액 소득공제 --- */
  // 청약 공제액과 합산해 연 400만원까지만 인정된다.
  const rentLoanAllowed = houselessHead;
  const rentLoanEligible = rentLoanAllowed ? Math.max(0, rentLoanRepaid) : 0;
  let rentLoanDeduction = rentLoanEligible * 0.4;

  const housingTotal = subscriptionDeduction + rentLoanDeduction;
  if (housingTotal > HOUSING_DEDUCTION_LIMIT) {
    // 청약 공제를 먼저 채우고 남은 한도만 임차차입금에 준다.
    subscriptionDeduction = Math.min(
      subscriptionDeduction,
      HOUSING_DEDUCTION_LIMIT,
    );
    rentLoanDeduction = HOUSING_DEDUCTION_LIMIT - subscriptionDeduction;
  }

  items.push({
    key: 'housingSubscription',
    label: '주택청약종합저축',
    kind: 'incomeDeduction',
    paid: housingSubscriptionPaid,
    eligible: subscriptionEligible,
    rate: 40,
    deduction: subscriptionDeduction,
    saving: subscriptionDeduction * (marginalRate / 100),
    note: '납입액 연 300만원의 40% 소득공제 · 무주택 세대주 & 총급여 7,000만원 이하',
    blockedReason: !houselessHead
      ? '무주택 세대주 요건을 켜야 합니다'
      : grossSalary > SUBSCRIPTION_SALARY_LIMIT
        ? '총급여 7,000만원을 넘습니다'
        : housingSubscriptionPaid <= 0
          ? '납입액이 없습니다'
          : null,
  });

  items.push({
    key: 'rentLoan',
    label: '전세대출 원리금 상환',
    kind: 'incomeDeduction',
    paid: rentLoanRepaid,
    eligible: rentLoanEligible,
    rate: 40,
    deduction: rentLoanDeduction,
    saving: rentLoanDeduction * (marginalRate / 100),
    note: '상환액의 40% 소득공제 · 청약 공제와 합산 연 400만원 한도 · 무주택 세대주',
    blockedReason: !houselessHead
      ? '무주택 세대주 요건을 켜야 합니다'
      : rentLoanRepaid <= 0
        ? '보증금 연동 대출이 없습니다'
        : null,
  });

  /* --- 4. 월세 세액공제 --- */
  const rentAllowed = houselessHead && grossSalary <= RENT_SALARY_LIMIT;
  const rentRate = grossSalary <= PENSION_RATE_THRESHOLD ? 17 : 15;
  const rentEligible = rentAllowed
    ? Math.min(Math.max(0, rentPaid), RENT_LIMIT)
    : 0;
  items.push({
    key: 'rent',
    label: '월세액 세액공제',
    kind: 'taxCredit',
    paid: rentPaid,
    eligible: rentEligible,
    rate: rentRate,
    deduction: 0,
    saving: rentEligible * (rentRate / 100),
    note: `연 1,000만원 한도 · 공제율 ${rentRate}% · 무주택 세대주 & 총급여 8,000만원 이하`,
    blockedReason: !houselessHead
      ? '무주택 세대주 요건을 켜야 합니다'
      : grossSalary > RENT_SALARY_LIMIT
        ? '총급여 8,000만원을 넘습니다'
        : rentPaid <= 0
          ? '월세 지출이 없습니다'
          : null,
  });

  const totalSaving = items.reduce((sum, item) => sum + item.saving, 0);

  // 더 넣을 수 있는 여력: 연금계좌 + 청약 납입 한도의 잔여분
  const pensionRoom = Math.max(0, PENSION_LIMIT - Math.max(0, pensionPaid));
  const subscriptionRoom = subscriptionAllowed
    ? Math.max(0, SUBSCRIPTION_PAID_LIMIT - Math.max(0, housingSubscriptionPaid))
    : 0;

  return {
    totalSaving,
    items,
    taxableBase,
    marginalRate,
    unusedRoom: pensionRoom + subscriptionRoom,
  };
}
