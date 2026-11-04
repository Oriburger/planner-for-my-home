import { useEffect, type RefObject } from 'react';

/**
 * 모바일에서 좌우로 밀어 화면을 넘긴다.
 * 가로 스크롤 영역·슬라이더·입력칸·[data-no-swipe] 안에서 시작한 제스처는 무시한다.
 */
export function useSwipeNav(
  ref: RefObject<HTMLElement>,
  onSwipe: (direction: 'left' | 'right') => void,
  enabled = true,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let sx = 0;
    let sy = 0;
    let st = 0;
    let active = false;

    const blocked = (target: EventTarget | null) => {
      let node = target as HTMLElement | null;
      while (node && node !== el) {
        if (
          node.dataset?.noSwipe !== undefined ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName) ||
          (node.scrollWidth > node.clientWidth + 2 &&
            /(auto|scroll)/.test(getComputedStyle(node).overflowX))
        ) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || blocked(e.target)) {
        active = false;
        return;
      }
      active = true;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      st = Date.now();
    };
    const onEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const fast = Date.now() - st < 600;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2 && fast) {
        onSwipe(dx < 0 ? 'left' : 'right');
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [ref, onSwipe, enabled]);
}
