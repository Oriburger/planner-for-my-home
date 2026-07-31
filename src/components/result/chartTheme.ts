/**
 * 차트 공통 토큰.
 *
 * 카테고리 색은 고정 슬롯 순서로만 배정한다(순환 금지).
 * 대시보드 표면(#ffffff) 기준으로 CVD/대비 검증을 통과한 조합이며,
 * 대비가 3:1 미만인 슬롯(aqua/yellow)은 연도별 표 뷰로 보완한다.
 */
export const SERIES = {
  slot1: '#2a78d6', // blue
  slot2: '#eb6834', // orange
  slot3: '#1baf7a', // aqua
  slot4: '#eda100', // yellow
} as const;

export const CHART = {
  surface: '#ffffff',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#898781',
  textPrimary: '#0f172a',
  textSecondary: '#52514e',
} as const;

export const axisTick = {
  fill: CHART.muted,
  fontSize: 11,
} as const;
