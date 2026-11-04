/** 가벼운 햅틱 (안드로이드 등 지원 기기에서만) */
export function haptic(pattern: number | number[] = 8) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    /* 무시 */
  }
}
