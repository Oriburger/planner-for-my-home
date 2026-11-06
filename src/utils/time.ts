import type { SimulationSettings } from '@/types/planner';

/**
 * 시간 모델 (단일 기준)
 *
 * - 0 = '지금' = 올해(baseYear), 나이 = 현재 나이
 * - N = 'N년 후' = baseYear + N, 나이 = 현재 나이 + N
 *   N년차의 흐름은 지금부터 N번째 12개월 동안 일어나고, 잔액은 그 끝(N년 후) 시점이다.
 * - 기준 연도는 저장하지 않고 실행 시점의 올해를 쓴다 → 해가 바뀌어도 '지금'이 낡지 않는다.
 */
export function currentYear(): number {
  return new Date().getFullYear();
}

/**
 * 입력한 '현재 나이'를 올해 기준으로 보정한다.
 * (2025년에 30세로 입력했다면 2026년에는 31세)
 */
export function effectiveAge(
  settings: Pick<SimulationSettings, 'currentAge' | 'asOfYear'>,
  baseYear = currentYear(),
): number | null {
  if (settings.currentAge === null) return null;
  const asOf = Math.min(settings.asOfYear ?? baseYear, baseYear);
  return settings.currentAge + (baseYear - asOf);
}

export function yearOf(baseYear: number, index: number): number {
  return baseYear + index;
}

export function ageOf(age: number | null, index: number): number | null {
  return age === null ? null : age + index;
}
