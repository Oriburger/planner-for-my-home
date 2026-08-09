import type {
  AssetItem,
  ExpenseItem,
  HousingItem,
  IncomeItem,
  PlannerData,
  SimulationResult,
  SimulationSettings,
  YearResult,
} from '@/types/planner';
import { simulateLoanYear } from './loan';
import { estimateTax } from './tax';

/* ------------------------------------------------------------------ */
/* 공통 헬퍼                                                            */
/* ------------------------------------------------------------------ */

/** 해당 연차에 항목이 활성 상태인지 */
function isActive(
  item: { startYear: number; endYear: number | null },
  yearIndex: number,
): boolean {
  if (yearIndex < item.startYear) return false;
  if (item.endYear !== null && yearIndex > item.endYear) return false;
  return true;
}

/** 시작 시점 대비 경과 연수 (0 = 시작한 해) */
function elapsed(startYear: number, yearIndex: number): number {
  return Math.max(0, yearIndex - startYear);
}

/**
 * 수입 항목의 해당 연차 세전 금액.
 * `annualAmount` 는 항목의 startYear 시점 금액이며, 이후 복리로 인상된다.
 */
export function incomeForYear(item: IncomeItem, yearIndex: number): number {
  if (!isActive(item, yearIndex)) return 0;

  const steps = elapsed(item.startYear, yearIndex);

  if (item.growthMode === 'fixed') {
    return item.annualAmount * Math.pow(1 + item.growthRate / 100, steps);
  }

  // manual: 연도별 인상률을 순차 적용. 배열이 짧으면 마지막 값을 반복 사용한다.
  let amount = item.annualAmount;
  for (let i = 0; i < steps; i += 1) {
    const rate =
      item.manualGrowthRates.length === 0
        ? 0
        : (item.manualGrowthRates[i] ??
          item.manualGrowthRates[item.manualGrowthRates.length - 1]);
    amount *= 1 + rate / 100;
  }
  return amount;
}

/** 지출 항목의 해당 연차 연간 금액 (물가상승률 복리 반영) */
export function expenseForYear(
  item: ExpenseItem,
  yearIndex: number,
  defaultInflation: number,
): number {
  if (!isActive(item, yearIndex)) return 0;

  const rate = item.inflationRate ?? defaultInflation;
  const steps = elapsed(item.startYear, yearIndex);
  return item.monthlyAmount * 12 * Math.pow(1 + rate / 100, steps);
}

/** 주거 항목의 해당 연차 연간 비용 (보증금 제외, 월세 + 관리비) */
export function housingCostForYear(
  item: HousingItem,
  yearIndex: number,
): number {
  if (!isActive(item, yearIndex)) return 0;

  const steps = elapsed(item.startYear, yearIndex);
  const monthly = item.monthlyRent + item.monthlyMaintenance;
  return monthly * 12 * Math.pow(1 + item.annualIncreaseRate / 100, steps);
}

/* ------------------------------------------------------------------ */
/* 메인 시뮬레이터                                                      */
/* ------------------------------------------------------------------ */

/**
 * 연도별 자산 변화를 시뮬레이션한다.
 *
 * 핵심 식:
 *   당해 총자산 = 이전 총자산
 *               + 자산 운용수익(복리, 선택)
 *               + (당해 세전수입 - 세금/4대보험)
 *               - 연간 고정지출
 *               - 연간 주거비
 *               - 대출 상환액
 *
 * 보증금 납입/반환은 "자산 간 이동"이므로 총자산에 중립적으로 처리하고,
 * 유동자산 <-> 비유동자산 사이만 이동시킨다.
 */
export function runSimulation(data: PlannerData): SimulationResult {
  const { settings, assets, incomes, housings, loans, expenses } = data;
  const years = Math.max(1, Math.min(40, Math.round(settings.years)));

  // ---- 초기 상태 ----------------------------------------------------
  /** 자산 항목별 잔액 */
  const assetBalances = new Map<string, number>(
    assets.map((a) => [a.id, a.amount]),
  );
  /** 연도별/자산별 잔액 스냅샷 이력 (만기 시점 평가액 추적용) */
  const assetHistoryByYear = new Map<number, Map<string, number>>();

  /** 대출별 잔액 (시작 연차가 1년차 이하인 대출만 초기 잔액으로 설정) */
  const loanBalances = new Map<string, number>(
    loans.map((l) => [l.id, l.startYear <= 1 ? l.principal : 0]),
  );
  /** 주거 계약별로 "지금 묶여 있는 보증금" (1년차 시작 계약은 기존 자산에 이미 반영된 것으로 본다) */
  const depositHeld = new Map<string, number>(
    housings.map((h) => [h.id, 0]),
  );

  /** 매년 남는 저축액이 쌓이는 여유자금 풀 */
  let savingsPool = 0;

  const initialTotalAssets =
    assets.reduce((sum, a) => sum + a.amount, 0);
  const initialLoanBalance = loans
    .filter((l) => l.startYear <= 1)
    .reduce((sum, l) => sum + l.principal, 0);

  const rows: YearResult[] = [];
  let totalSaved = 0;
  let totalReturn = 0;

  for (let yearIndex = 1; yearIndex <= years; yearIndex += 1) {
    /* ---- 1. 자산 운용수익 (연초 잔액 기준 복리) ---- */
    let investmentReturn = 0;

    if (settings.applyAssetReturn) {
      for (const asset of assets) {
        const balance = assetBalances.get(asset.id) ?? 0;
        const gain = balance * (asset.annualReturnRate / 100);
        assetBalances.set(asset.id, balance + gain);
        investmentReturn += gain;
      }
      const poolGain = savingsPool * (settings.savingsReturnRate / 100);
      savingsPool += poolGain;
      investmentReturn += poolGain;
    }

    /* ---- 2. 수입과 세금 ---- */
    let taxableGross = 0;
    let nonTaxableGross = 0;

    for (const income of incomes) {
      const amount = incomeForYear(income, yearIndex);
      if (income.taxable) taxableGross += amount;
      else nonTaxableGross += amount;
    }

    const grossIncome = taxableGross + nonTaxableGross;
    const taxAndInsurance = estimateTax(taxableGross, settings);
    const netIncome = grossIncome - taxAndInsurance;

    /* ---- 3. 지출 ---- */
    const livingExpense = expenses.reduce(
      (sum, e) => sum + expenseForYear(e, yearIndex, settings.inflationRate),
      0,
    );

    /* ---- 4. 주거비 + 보증금 이동 ---- */
    let housingCost = 0;

    for (const housing of housings) {
      housingCost += housingCostForYear(housing, yearIndex);

      // 계약 시작: 보증금을 여유자금에서 빼서 묶인 자산으로 이동
      // (1년차 시작 계약은 이미 '현재 보유 자산'에 임대보증금으로 입력된 것으로 간주)
      if (yearIndex === housing.startYear && housing.startYear > 1) {
        savingsPool -= housing.deposit;
        depositHeld.set(housing.id, housing.deposit);
      }

      // 계약 종료 다음 해: 보증금 반환
      if (housing.endYear !== null && yearIndex === housing.endYear + 1) {
        savingsPool += depositHeld.get(housing.id) ?? 0;
        depositHeld.set(housing.id, 0);
      }
    }

    /* ---- 5. 대출 상환 ---- */
    let loanPayment = 0;
    let loanInterest = 0;
    let loanPrincipalPaid = 0;

    for (const loan of loans) {
      let balance = loanBalances.get(loan.id) ?? 0;

      // 미래 대출 시작 연차 도달 시 원금 대출 실행
      if (yearIndex === loan.startYear && balance === 0) {
        balance = loan.principal;
        // 보증금 연동이 아닌 현금 대출이면 대출 실행금이 유동 현금으로 유입
        if (!loan.isDepositLinked) {
          savingsPool += loan.principal;
        }
      }

      if (yearIndex < loan.startYear) {
        loanBalances.set(loan.id, 0);
        continue;
      }

      const flow = simulateLoanYear(loan, yearIndex, balance);
      loanBalances.set(loan.id, flow.balance);
      loanPayment += flow.payment;
      loanInterest += flow.interest;
      loanPrincipalPaid += flow.principalPaid;

      // 보증금 연동 원금 상환 발생 시, 비유동 임대보증금 자산에서 차감 상쇄
      if (flow.depositLinkedPrincipalPaid > 0) {
        let toOffset = flow.depositLinkedPrincipalPaid;
        for (const asset of assets) {
          if (asset.type === 'rentDeposit' && toOffset > 0) {
            const current = assetBalances.get(asset.id) ?? 0;
            const reduce = Math.min(current, toOffset);
            assetBalances.set(asset.id, current - reduce);
            toOffset -= reduce;
          }
        }
        if (toOffset > 0) {
          for (const [hId, held] of depositHeld.entries()) {
            if (held > 0 && toOffset > 0) {
              const reduce = Math.min(held, toOffset);
              depositHeld.set(hId, held - reduce);
              toOffset -= reduce;
            }
          }
        }
      }
    }

    /* ---- 6. 연간 저축액 ---- */
    const annualSavings =
      netIncome - livingExpense - housingCost - loanPayment;

    /* ---- 7. 자동이체 납입 (여유자금 -> 개별 자산) ---- */
    // 만기 연차에 도달한 자산은 정기 납입 중단
    const activeAssetsForContribution = assets.filter((a) => {
      if (a.monthlyContribution <= 0) return false;
      const matIndex = getAssetMaturityYearIndex(a, settings.currentAge);
      if (matIndex !== null && yearIndex >= matIndex) return false;
      return true;
    });

    const desiredContribution = activeAssetsForContribution.reduce(
      (sum, a) => sum + a.monthlyContribution * 12,
      0,
    );
    const availableForContribution =
      Math.max(0, annualSavings) + Math.max(0, savingsPool);
    const contributionScale =
      desiredContribution > 0 && desiredContribution > availableForContribution
        ? availableForContribution / desiredContribution
        : 1;

    let contribution = 0;
    for (const asset of activeAssetsForContribution) {
      const yearly = asset.monthlyContribution * 12 * contributionScale;
      assetBalances.set(asset.id, (assetBalances.get(asset.id) ?? 0) + yearly);
      contribution += yearly;
    }

    savingsPool += annualSavings - contribution;

    // 해당 연차 말 자산 잔액 스냅샷 기록
    assetHistoryByYear.set(
      yearIndex,
      new Map<string, number>(assetBalances.entries()),
    );

    /* ---- 8. 집계 ---- */
    let liquidAssets = savingsPool;
    let lockedAssets = 0;

    for (const asset of assets) {
      const balance = assetBalances.get(asset.id) ?? 0;
      const matIndex = getAssetMaturityYearIndex(asset, settings.currentAge);
      const isMatured = matIndex !== null && yearIndex >= matIndex;

      // 만기가 되었고 유동자산 전환 옵션이 켜져있으면(기본값 true) 유동자산으로 분류
      const convertLiquid = asset.convertLiquidOnMaturity ?? true;
      if (asset.liquid || (isMatured && convertLiquid)) {
        liquidAssets += balance;
      } else {
        lockedAssets += balance;
      }
    }
    for (const held of depositHeld.values()) {
      lockedAssets += held;
    }

    const totalAssets = liquidAssets + lockedAssets;
    const loanBalance = Array.from(loanBalances.values()).reduce(
      (sum, v) => sum + v,
      0,
    );

    totalSaved += annualSavings;
    totalReturn += investmentReturn;

    rows.push({
      index: yearIndex,
      year: settings.startYear + yearIndex - 1,
      age:
        settings.currentAge === null ? null : settings.currentAge + yearIndex - 1,
      grossIncome,
      taxAndInsurance,
      netIncome,
      livingExpense,
      housingCost,
      loanPayment,
      loanInterest,
      loanPrincipalPaid,
      investmentReturn,
      contribution,
      annualSavings,
      liquidAssets,
      lockedAssets,
      totalAssets,
      loanBalance,
      netWorth: totalAssets - loanBalance,
    });
  }

  /* ---- 요약 ---- */
  const last = rows[rows.length - 1];
  const firstRow = rows[0];
  const initialNetWorth = initialTotalAssets - initialLoanBalance;

  const firstNegative = rows.find((row) => row.netWorth < 0);

  // 연금저축/IRP/ISA 만기 요약 생성
  const pensionMaturities: SimulationResult['summary']['pensionMaturities'] = [];
  for (const asset of assets) {
    const matIndex = getAssetMaturityYearIndex(asset, settings.currentAge);
    if (matIndex !== null && matIndex >= 1 && matIndex <= years) {
      const yearSnapshot = assetHistoryByYear.get(matIndex);
      const estimatedAmountAtMaturity =
        yearSnapshot?.get(asset.id) ?? asset.amount;
      pensionMaturities.push({
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type,
        maturityYearIndex: matIndex,
        maturityCalendarYear: settings.startYear + matIndex - 1,
        maturityAge:
          settings.currentAge === null
            ? null
            : settings.currentAge + matIndex - 1,
        estimatedAmountAtMaturity,
        convertedToLiquid: asset.convertLiquidOnMaturity ?? true,
      });
    }
  }

  return {
    rows,
    summary: {
      finalTotalAssets: last.totalAssets,
      finalNetWorth: last.netWorth,
      totalGrowth: last.netWorth - initialNetWorth,
      totalSaved,
      totalReturn,
      averageAnnualSavings: totalSaved / rows.length,
      savingsRate:
        firstRow.netIncome > 0
          ? (firstRow.annualSavings / firstRow.netIncome) * 100
          : 0,
      firstNegativeYear: firstNegative ? firstNegative.index : null,
      pensionMaturities,
    },
  };
}

/** 자산의 만기 시점 연차 계산 헬퍼 */
export function getAssetMaturityYearIndex(
  asset: AssetItem,
  currentAge: number | null,
): number | null {
  if (asset.maturityYear && asset.maturityYear > 0) {
    return asset.maturityYear;
  }
  if (asset.maturityAge && currentAge && asset.maturityAge > currentAge) {
    return asset.maturityAge - currentAge + 1;
  }
  return null;
}

/** 시작 시점(0년차) 스냅샷 — 차트의 출발점으로 사용한다 */
export function initialSnapshot(data: PlannerData): {
  year: number;
  totalAssets: number;
  netWorth: number;
} {
  const totalAssets = data.assets.reduce((sum, a) => sum + a.amount, 0);
  const loanBalance = data.loans.reduce((sum, l) => sum + l.principal, 0);
  return {
    year: data.settings.startYear - 1,
    totalAssets,
    netWorth: totalAssets - loanBalance,
  };
}

export type { SimulationSettings };
