import type { YearResult } from '@/types/planner';

/** 한 시점의 순자산을 '어디서 온 돈인지'로 나눈 값 */
export interface YearPoint {
  /** 0 = 지금 */
  index: number;
  year: number;
  netWorth: number;
  /** 시작 순자산 */
  base: number;
  /** 지금까지 쌓인 운용수익 (불어난 돈) */
  grown: number;
  /** 순자산 − 시작 − 불어난 돈 = 내가 모은 돈 (저축 + 대출 원금 상환 등) */
  saved: number;
  /** 연간 저축액 누적 */
  savingsCum: number;
  /** 그 해 저축률 (%) — 지금(0)은 null */
  savingsRate: number | null;
}

export function buildYearPoints(
  rows: YearResult[],
  start: { year: number; netWorth: number },
): YearPoint[] {
  const points: YearPoint[] = [
    {
      index: 0,
      year: start.year,
      netWorth: start.netWorth,
      base: start.netWorth,
      grown: 0,
      saved: 0,
      savingsCum: 0,
      savingsRate: null,
    },
  ];
  let grown = 0;
  let savingsCum = 0;
  for (const r of rows) {
    grown += r.investmentReturn;
    savingsCum += r.annualSavings;
    points.push({
      index: r.index,
      year: r.year,
      netWorth: r.netWorth,
      base: start.netWorth,
      grown,
      saved: r.netWorth - start.netWorth - grown,
      savingsCum,
      savingsRate: r.netIncome > 0 ? (r.annualSavings / r.netIncome) * 100 : null,
    });
  }
  return points;
}

/**
 * 막대 한 개를 세 층으로 쌓을 높이 (합 = max(0, 순자산)).
 * 음수 구간은 아래 층부터 깎아낸다.
 */
export function stackLayers(p: YearPoint) {
  const total = Math.max(0, p.netWorth);
  const base = Math.min(Math.max(0, p.base), total);
  const grown = Math.min(Math.max(0, p.grown), total - base);
  const saved = Math.max(0, total - base - grown);
  return { base, saved, grown, total };
}
