/**
 * 저축 예상액 계산기 도메인 모델
 *
 * 금액 단위는 전부 "원(KRW)" 정수를 기준으로 한다.
 * UI 입력은 만원 단위를 쓰더라도 store 에 저장할 때 원 단위로 환산한다.
 * 비율(%)은 전부 "퍼센트 숫자"로 저장한다. (예: 3.5 => 3.5%)
 */

export type ID = string;

/* ------------------------------------------------------------------ */
/* 1. 현재 보유 자산                                                    */
/* ------------------------------------------------------------------ */

export type AssetType =
  | 'isa'
  | 'pension'
  | 'savings'
  | 'cash'
  | 'rentDeposit'
  | 'housingSubscription'
  | 'investment'
  | 'etc';

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  isa: 'ISA',
  pension: '연금저축 / IRP',
  savings: '적금 · 예금',
  cash: '현금 · 파킹통장',
  rentDeposit: '임대보증금',
  housingSubscription: '주택청약',
  investment: '주식 · ETF',
  etc: '기타',
};

/**
 * `liquid = false` 인 자산은 "묶인 돈"으로 간주한다.
 * (보증금·청약·연금처럼 만기 전 인출이 어려운 자산)
 * 총자산에는 포함되지만 매년 현금흐름 버퍼로는 잡히지 않는다.
 */
export interface AssetItem {
  id: ID;
  type: AssetType;
  name: string;
  /** 현재 평가액 (원) */
  amount: number;
  /** 연 기대 수익률 (%) — 복리로 누적된다 */
  annualReturnRate: number;
  liquid: boolean;
  /** 매년 추가 납입액 (원/월). 청약·연금처럼 자동이체되는 항목용 */
  monthlyContribution: number;
  memo?: string;
  /** 자산이 존재/납입을 시작하는 시뮬레이션 연차 (1 = 첫 해, 미지정 시 1) */
  startYear?: number;
  /** 만기/수령 시점 연차 (1 = 첫 해) */
  maturityYear?: number | null;
  /** 만기/수령 시점 나이 (전역 나이가 설정된 경우) */
  maturityAge?: number | null;
  /** 만기 시 유동 자산으로 자동 전환 여부 (기본값: true) */
  convertLiquidOnMaturity?: boolean;
}

/* ------------------------------------------------------------------ */
/* 2. 수입                                                             */
/* ------------------------------------------------------------------ */

export type IncomeType = 'salary' | 'bonus' | 'side' | 'etc';

export const INCOME_TYPE_LABEL: Record<IncomeType, string> = {
  salary: '근로소득(연봉)',
  bonus: '상여 · 성과급',
  side: '부수입',
  etc: '기타 수입',
};

export type GrowthMode = 'fixed' | 'manual' | 'custom';

export interface IncomeItem {
  id: ID;
  type: IncomeType;
  name: string;
  /** 세전 연간 금액 (원) */
  annualAmount: number;
  /** fixed: 고정 인상률 복리 / manual: 연도별 인상률 수동 입력 / custom: 연차별 금액 직접 지정 */
  growthMode: GrowthMode;
  /** growthMode === 'fixed' 일 때 사용하는 연 인상률 (%) */
  growthRate: number;
  /**
   * growthMode === 'manual' 일 때 사용.
   * 인덱스 0 = 시뮬레이션 1년차의 인상률(%). 배열이 짧으면 마지막 값을 계속 사용한다.
   */
  manualGrowthRates: number[];
  /**
   * growthMode === 'custom' 일 때 사용. 인상률이 아닌 그 해의 세전 금액(원)을 직접 지정.
   * 인덱스 0 = startYear 연차의 금액. 배열이 짧으면 마지막 값을 계속 사용한다.
   */
  customAnnualAmounts?: number[];
  /** 소득세 + 4대보험 공제 대상 여부 (false면 전액 실수령으로 계산) */
  taxable: boolean;
  /** 수입이 발생하기 시작하는 시뮬레이션 연차 (1 = 첫 해) */
  startYear: number;
  /** 수입이 종료되는 연차 (null = 기간 끝까지) */
  endYear: number | null;
  memo?: string;
}

/* ------------------------------------------------------------------ */
/* 3. 거주 비용                                                        */
/* ------------------------------------------------------------------ */

export type HousingType = 'jeonse' | 'wolse' | 'owned' | 'etc';

export const HOUSING_TYPE_LABEL: Record<HousingType, string> = {
  jeonse: '전세',
  wolse: '월세',
  owned: '자가',
  etc: '기타',
};

export interface HousingItem {
  id: ID;
  type: HousingType;
  name: string;
  /** 보증금 (원). 계약 시작 연차에 유동자산 -> 보증금 자산으로 이동한다 */
  deposit: number;
  /** 월세 (원/월) */
  monthlyRent: number;
  /** 관리비 등 월 고정 주거비 (원/월) */
  monthlyMaintenance: number;
  /** 주거비 연 상승률 (%) */
  annualIncreaseRate: number;
  startYear: number;
  endYear: number | null;
  memo?: string;
}

/* ------------------------------------------------------------------ */
/* 4. 대출                                                             */
/* ------------------------------------------------------------------ */

export type RepaymentType =
  | 'equalPayment' // 원리금균등
  | 'equalPrincipal' // 원금균등
  | 'interestOnly' // 만기일시(거치)
  | 'fixedMonthly'; // 월 상환액 직접 입력

export const REPAYMENT_TYPE_LABEL: Record<RepaymentType, string> = {
  equalPayment: '원리금균등',
  equalPrincipal: '원금균등',
  interestOnly: '만기일시상환',
  fixedMonthly: '월 상환액 직접입력',
};

export interface LoanItem {
  id: ID;
  name: string;
  /** 대출 잔액(원금) */
  principal: number;
  /** 연 이자율 (%) */
  annualRate: number;
  /** 총 상환 기간(년) */
  termYears: number;
  repaymentType: RepaymentType;
  /** repaymentType === 'fixedMonthly' 일 때만 사용하는 월 상환액 (원/월) */
  monthlyPayment: number;
  /** 상환이 시작되는 시뮬레이션 연차 */
  startYear: number;
  /** 거치 기간 (년) — 이 기간 동안은 원금 상환 없이 이자만 납부 */
  graceYears?: number;
  /** 보증금 상환 연동 여부 — 만기 원금 상환 시 유동 현금이 아닌 보증금 자산과 상쇄 */
  isDepositLinked?: boolean;
  /** 만기 자동 연장 여부 — 만기 시 원금을 갚지 않고 대출을 연장하여 이자만 지속 납부 */
  autoRenew?: boolean;
  memo?: string;
}

/* ------------------------------------------------------------------ */
/* 5. 월 고정 지출                                                     */
/* ------------------------------------------------------------------ */

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'insurance'
  | 'telecom'
  | 'subscription'
  | 'leisure'
  | 'etc';

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  food: '식비',
  transport: '교통비',
  insurance: '보험료',
  telecom: '통신비',
  subscription: '구독료',
  leisure: '여가 · 문화',
  etc: '기타',
};

export interface ExpenseItem {
  id: ID;
  category: ExpenseCategory;
  name: string;
  /** 월 지출액 (원/월) */
  monthlyAmount: number;
  /** 연 물가 상승률 (%) — 비우면 전역 물가상승률을 따른다 */
  inflationRate: number | null;
  startYear: number;
  endYear: number | null;
  memo?: string;
}

/* ------------------------------------------------------------------ */
/* 6. 전역 설정                                                        */
/* ------------------------------------------------------------------ */

export interface SimulationSettings {
  /** 시뮬레이션 시작 연도 (예: 2026) */
  startYear: number;
  /** 시뮬레이션 기간 (년). 1 ~ 40 */
  years: number;
  /** 전역 물가 상승률 (%) — 지출 항목의 기본값 */
  inflationRate: number;
  /**
   * 세금 계산 방식
   * - 'simplified': 간이 누진세 + 4대보험 테이블로 실수령액 추정
   * - 'flatRate': 사용자가 지정한 단일 공제율 사용
   */
  taxMode: 'simplified' | 'flatRate';
  /** taxMode === 'flatRate' 일 때 사용하는 총 공제율 (%) */
  flatTaxRate: number;
  /** 자산 수익률(복리) 반영 여부. 끄면 순수 저축액만 누적된다 */
  applyAssetReturn: boolean;
  /** 매년 남은 저축액이 쌓이는 여유자금의 운용 수익률 (%) */
  savingsReturnRate: number;
  /** 현재 나이 (선택) — 차트 x축 보조 표기용 */
  currentAge: number | null;
}

/* ------------------------------------------------------------------ */
/* 7. 시뮬레이션 결과                                                  */
/* ------------------------------------------------------------------ */

export interface YearResult {
  /** 시뮬레이션 연차 (1 = 첫 해) */
  index: number;
  /** 실제 연도 (예: 2026) */
  year: number;
  age: number | null;

  /** 세전 총수입 */
  grossIncome: number;
  /** 세금 + 4대보험 공제액 */
  taxAndInsurance: number;
  /** 실수령 총수입 */
  netIncome: number;

  /** 생활비(월 고정 지출) 연 합계 */
  livingExpense: number;
  /** 주거비(월세 + 관리비) 연 합계 — 보증금은 제외 */
  housingCost: number;
  /** 대출 상환 총액 (원금 + 이자) */
  loanPayment: number;
  loanInterest: number;
  loanPrincipalPaid: number;

  /** 자산 수익 (복리) */
  investmentReturn: number;
  /** 자동이체 납입액 합계 (유동자산 -> 비유동자산 이동, 순자산 중립) */
  contribution: number;

  /** 연간 저축액 = netIncome - 생활비 - 주거비 - 대출상환 */
  annualSavings: number;

  /**
   * 자동이체를 전부 집행하고 남은 여유자금.
   * = (이전까지 쌓인 여유자금 + 당해 연간 저축액) - 당해 자동이체 총계
   * 음수면 자동이체를 감당할 현금이 부족하다는 뜻이다.
   */
  contributionBalance: number;

  /** 유동자산 (즉시 인출 가능) */
  liquidAssets: number;
  /** 비유동자산 (보증금·연금·청약 등) */
  lockedAssets: number;
  /** 총자산 = liquid + locked */
  totalAssets: number;
  /** 대출 잔액 */
  loanBalance: number;
  /** 순자산 = 총자산 - 대출잔액 */
  netWorth: number;
}

export interface PensionMaturityInfo {
  assetId: string;
  assetName: string;
  assetType: AssetType;
  /** 만기 시점 시뮬레이션 연차 */
  maturityYearIndex: number;
  /** 만기 시점 실제 연도 */
  maturityCalendarYear: number;
  /** 만기 시점 사용자 나이 (나이가 설정된 경우) */
  maturityAge: number | null;
  /** 만기 시점 예상 자산 평가액 (원금 + 누적 복리 수익) */
  estimatedAmountAtMaturity: number;
  /** 만기 시 유동자산 전환 여부 */
  convertedToLiquid: boolean;
}

export interface SimulationSummary {
  /** 최종 연차의 총자산 */
  finalTotalAssets: number;
  finalNetWorth: number;
  /** 시작 시점 대비 증가액 */
  totalGrowth: number;
  /** 누적 저축액 (수익 제외) */
  totalSaved: number;
  /** 누적 자산 수익 */
  totalReturn: number;
  /** 연평균 저축액 */
  averageAnnualSavings: number;
  /** 첫 해 저축률 (%) = 연간저축액 / 실수령액 */
  savingsRate: number;
  /** 순자산이 마이너스로 떨어지는 첫 연차 (없으면 null) */
  firstNegativeYear: number | null;
  /** 자동이체가 여유자금을 초과하는 첫 연차 (없으면 null) */
  firstContributionShortfallYear: number | null;
  /** 자동이체 부족액이 가장 큰 해의 부족 금액 (양수, 부족이 없으면 0) */
  maxContributionShortfall: number;
  /** 연금저축/IRP/ISA 만기 정보 리스트 */
  pensionMaturities: PensionMaturityInfo[];
}

export interface SimulationResult {
  rows: YearResult[];
  summary: SimulationSummary;
}

/** store 에 저장되는 전체 입력 상태 */
export interface PlannerData {
  settings: SimulationSettings;
  assets: AssetItem[];
  incomes: IncomeItem[];
  housings: HousingItem[];
  loans: LoanItem[];
  expenses: ExpenseItem[];
}
