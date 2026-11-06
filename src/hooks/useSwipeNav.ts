import { useEffect, type RefObject } from 'react';

/**
 * 모바일에서 좌우로 밀어 화면을 넘긴다.
 * 가로 스크롤 영역·슬라이더·입력칸·차트·[data-no-swipe] 안에서 시작한 제스처는 무시한다.
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
      const node = target as HTMLElement | null;
      if (!node) return false;
      // data-no-swipe, 폼 입력, 슬라이더, 차트 컨테이너 내부면 차단
      if (
        node.closest(
          '[data-no-swipe], input, textarea, select, [role="slider"], .recharts-wrapper, svg',
        )
      ) {
        return true;
      }
      // 가로 스크롤 컨테이너 차단
      const scrollable = node.closest('.overflow-x-auto, .overflow-x-scroll') as HTMLElement | null;
      return Boolean(scrollable && scrollable.scrollWidth > scrollable.clientWidth + 2);
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
      // 사선 스크롤 오동작 방지를 위해 임계값 90px
      if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 2 && fast) {
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
