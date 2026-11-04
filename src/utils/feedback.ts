/** 가벼운 햅틱 (안드로이드 등 지원 기기에서만) */
export function haptic(pattern: number | number[] = 8) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    /* 무시 */
  }
}

const COLORS = ['#111827', '#2563eb', '#10b981', '#f59e0b', '#e11d48', '#94a3b8'];

/** 화면 좌표 (x, y) 에서 터지는 작은 컨페티 */
export function confetti(x: number, y: number, count = 28) {
  if (typeof document === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.style.left = `${x}px`;
  layer.style.top = `${y}px`;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 90;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist - 40}px`);
    p.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    p.style.background = COLORS[i % COLORS.length];
    p.style.animationDelay = `${Math.random() * 60}ms`;
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  window.setTimeout(() => layer.remove(), 1300);
}
