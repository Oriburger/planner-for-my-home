const MAN = 10_000; // 만
const EOK = 100_000_000; // 억

/** 1234567890 -> "12억 3,456만" (대시보드 요약/차트 라벨용) */
export function formatKRWShort(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(Math.round(value));

  if (abs >= EOK) {
    const eok = Math.floor(abs / EOK);
    const man = Math.floor((abs % EOK) / MAN);
    return man > 0
      ? `${sign}${eok}억 ${man.toLocaleString('ko-KR')}만`
      : `${sign}${eok}억`;
  }
  if (abs >= MAN) {
    return `${sign}${Math.floor(abs / MAN).toLocaleString('ko-KR')}만`;
  }
  return `${sign}${abs.toLocaleString('ko-KR')}`;
}

/** 1234567890 -> "1,234,567,890원" */
export function formatKRW(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

/** 만원 단위 축약 (차트 y축) */
export function formatAxis(value: number): string {
  const abs = Math.abs(value);
  if (abs >= EOK) return `${(value / EOK).toFixed(1)}억`;
  if (abs >= MAN) return `${Math.round(value / MAN).toLocaleString('ko-KR')}만`;
  return `${value}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/** 원 -> 만원 (입력 폼 표시용) */
export const toMan = (won: number): number => Math.round(won / MAN);

/** 만원 -> 원 (입력 폼 저장용) */
export const fromMan = (man: number): number => Math.round(man * MAN);
