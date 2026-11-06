import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 데스크톱 배치: 독 위 팝오버 / 화면 중앙 */
  desktop?: 'dock' | 'center';
}

/**
 * 모바일: 아래에서 올라오는 시트 — 손잡이/머리 부분을 끌어내리면 닫힌다.
 * 데스크톱: 독 위 팝오버 또는 중앙 패널.
 */
export function Sheet({ open, title, onClose, children, desktop = 'dock' }: SheetProps) {
  const [dragY, setDragY] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setDragY(0);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    if (window.innerWidth >= 1024) return;
    start.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (start.current === null) return;
    setDragY(Math.max(0, e.clientY - start.current));
  };
  const onPointerUp = () => {
    if (start.current === null) return;
    start.current = null;
    if (dragY > 90) onClose();
    else setDragY(0);
  };

  // 위치(translate)는 바깥 래퍼가, 등장 애니메이션·드래그(transform)는 안쪽 패널이 맡는다
  const placement =
    desktop === 'center'
      ? 'lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:w-[480px] lg:-translate-x-1/2 lg:-translate-y-1/2'
      : 'lg:inset-x-auto lg:bottom-[6.5rem] lg:left-1/2 lg:w-[440px] lg:-translate-x-1/2';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/25 lg:bg-slate-950/10"
      style={{ opacity: dragY ? Math.max(0.3, 1 - dragY / 400) : undefined }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`fixed inset-x-0 bottom-0 ${placement}`}>
      <div
        className="glass glass-solid animate-sheet-up flex max-h-[85vh] max-h-[85dvh] flex-col rounded-t-2xl lg:rounded-2xl"
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: start.current === null ? 'transform 0.2s ease' : 'none',
        }}
      >
        <div
          className="touch-none select-none px-4 pt-2 lg:px-5 lg:pt-5"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="flex justify-center pb-2 lg:hidden" aria-hidden="true">
            <span className="h-1 w-9 rounded-full bg-ink-900/20 dark:bg-white/25" />
          </div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink-900 dark:text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="닫기"
              className="btn-icon -mr-1.5"
            >
              <Icon name="close" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
        <div className="thin-scrollbar overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:px-5 lg:pb-5">
          {children}
        </div>
      </div>
      </div>
    </div>
  );
}
