import { useUIStore } from '@/store/uiStore';

/**
 * 차트 공통 토큰.
 *
 * 카테고리 색은 고정 슬롯 순서로만 배정한다(순환 금지).
 * 대비가 3:1 미만인 슬롯(aqua/yellow)은 연도별 표 뷰로 보완한다.
 */
export const SERIES = {
  slot1: '#2a78d6', // blue
  slot2: '#eb6834', // orange
  slot3: '#1baf7a', // aqua
  slot4: '#eda100', // yellow
} as const;

export interface ChartTokens {
  /** 유리 카드 위의 근사 표면색 (스택 막대 사이 간격, 활성 점 테두리) */
  surface: string;
  grid: string;
  axis: string;
  muted: string;
  textPrimary: string;
  textSecondary: string;
  cursorFill: string;
}

const LIGHT: ChartTokens = {
  surface: '#f4f7fc',
  grid: 'rgba(15, 23, 42, 0.07)',
  axis: 'rgba(15, 23, 42, 0.16)',
  muted: '#7b8496',
  textPrimary: '#0f172a',
  textSecondary: '#52607a',
  cursorFill: 'rgba(59, 130, 246, 0.06)',
};

const DARK: ChartTokens = {
  surface: '#172033',
  grid: 'rgba(255, 255, 255, 0.07)',
  axis: 'rgba(255, 255, 255, 0.16)',
  muted: '#8b95a8',
  textPrimary: '#f1f5f9',
  textSecondary: '#a3adbf',
  cursorFill: 'rgba(148, 163, 184, 0.08)',
};

/** 현재 테마에 맞는 차트 토큰 */
export function useChartTheme(): ChartTokens {
  const theme = useUIStore((s) => s.theme);
  return theme === 'dark' ? DARK : LIGHT;
}

export function axisTick(tokens: ChartTokens) {
  return { fill: tokens.muted, fontSize: 11 } as const;
}
