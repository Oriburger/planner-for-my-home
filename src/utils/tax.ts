import type { SimulationSettings } from '@/types/planner';

/**
 * 세금 / 4대보험 단순화 모듈
 *
 * 실제 연말정산은 부양가족·공제항목에 따라 크게 달라지므로,
 * 여기서는 "연봉 구간별 실효 공제율"을 선형 보간하는 간이 모델을 사용한다.
 * 정확한 세액 계산기가 아니라 장기 시뮬레이션용 근사치다.
 */

/** [세전 연봉(원), 총 공제율(%)] — 소득세 + 지방소득세 + 4대보험 합산 실효율 근사 */
const EFFECTIVE_DEDUCTION_TABLE: Array<[number, number]> = [
  [20_000_000, 9.5],
  [30_000_000, 11.0],
  [40_000_000, 13.0],
  [50_000_000, 15.0],
  [60_000_000, 17.0],
  [70_000_000, 19.0],
  [80_000_000, 21.0],
  [100_000_000, 24.0],
  [150_000_000, 29.0],
  [200_000_000, 33.0],
  [300_000_000, 37.0],
];

/** 세전 연봉에 대한 실효 공제율(%)을 구간 선형 보간으로 추정한다. */
export function estimateDeductionRate(grossAnnual: number): number {
  if (grossAnnual <= 0) return 0;

  const first = EFFECTIVE_DEDUCTION_TABLE[0];
  if (grossAnnual <= first[0]) return first[1];

  const last = EFFECTIVE_DEDUCTION_TABLE[EFFECTIVE_DEDUCTION_TABLE.length - 1];
  if (grossAnnual >= last[0]) return last[1];

  for (let i = 0; i < EFFECTIVE_DEDUCTION_TABLE.length - 1; i += 1) {
    const [lowAmount, lowRate] = EFFECTIVE_DEDUCTION_TABLE[i];
    const [highAmount, highRate] = EFFECTIVE_DEDUCTION_TABLE[i + 1];

    if (grossAnnual >= lowAmount && grossAnnual <= highAmount) {
      const ratio = (grossAnnual - lowAmount) / (highAmount - lowAmount);
      return lowRate + (highRate - lowRate) * ratio;
    }
  }
  return last[1];
}

/** 세전 금액 -> 공제액(원) */
export function estimateTax(
  grossAnnual: number,
  settings: Pick<SimulationSettings, 'taxMode' | 'flatTaxRate'>,
): number {
  if (grossAnnual <= 0) return 0;

  const rate =
    settings.taxMode === 'flatRate'
      ? Math.max(0, Math.min(100, settings.flatTaxRate))
      : estimateDeductionRate(grossAnnual);

  return grossAnnual * (rate / 100);
}

/** 세전 금액 -> 실수령액(원) */
export function estimateNetIncome(
  grossAnnual: number,
  settings: Pick<SimulationSettings, 'taxMode' | 'flatTaxRate'>,
): number {
  return grossAnnual - estimateTax(grossAnnual, settings);
}
