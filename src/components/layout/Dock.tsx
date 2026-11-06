import { useRef, useState, type ReactNode } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore, type AppView } from '@/store/uiStore';
import { Icon, type IconName } from '@/components/ui/Icon';
import { formatKRWShort } from '@/utils/format';
import { haptic } from '@/utils/feedback';

const NAV: Array<{ view: AppView; icon: IconName; label: string }> = [
  { view: 'overview', icon: 'home', label: '메인' },
  { view: 'income', icon: 'banknote', label: '수입 관리' },
  { view: 'budget', icon: 'sliders', label: '계획' },
  { view: 'timeline', icon: 'timeline', label: '타임라인' },
  { view: 'charts', icon: 'chart', label: '차트' },
  { view: 'table', icon: 'table', label: '상세표' },
];

const BASE = 44;
const GROW = 16;
const RANGE = 120;

interface DockProps {
  onOpenWizard: () => void;
  onOpenSettings: () => void;
  onOpenGoals: () => void;
}

/* ------------------------------------------------------------------ */
/* 데스크톱 — macOS 스타일 확대 독                                      */
/* ------------------------------------------------------------------ */

export function DesktopDock({ onOpenWizard, onOpenSettings, onOpenGoals }: DockProps) {
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const inputPanelOpen = useUIStore((s) => s.inputPanelOpen);
  const toggleInputPanel = useUIStore((s) => s.toggleInputPanel);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const [mouseX, setMouseX] = useState<number | null>(null);

  return (
    <nav
      aria-label="주 메뉴"
      className="fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 lg:block"
    >
      <div
        className="glass glass-strong spotlight flex items-end gap-2 rounded-[22px] px-2.5 pb-2.5 pt-2.5"
        onMouseMove={(e) => setMouseX(e.clientX)}
        onMouseLeave={() => setMouseX(null)}
      >
        {NAV.map((item) => (
          <DockItem
            key={item.view}
            mouseX={mouseX}
            label={item.label}
            active={view === item.view}
            indicator
            onClick={() => setView(item.view)}
          >
            <Icon name={item.icon} className="h-5 w-5" />
          </DockItem>
        ))}

        <span className="mx-1 mb-2 h-8 w-px self-end bg-ink-900/10 dark:bg-white/10" aria-hidden="true" />

        <DockItem
          mouseX={mouseX}
          label={inputPanelOpen ? '입력 패널 숨기기' : '입력 패널 보기'}
          active={inputPanelOpen}
          onClick={toggleInputPanel}
        >
          <Icon name="sliders" className="h-5 w-5" />
        </DockItem>
        <DockItem mouseX={mouseX} label="목표 편집" onClick={onOpenGoals}>
          <Icon name="target" className="h-5 w-5" />
        </DockItem>
        <DockItem mouseX={mouseX} label="배경화면" onClick={onOpenSettings}>
          <Icon name="image" className="h-5 w-5" />
        </DockItem>
        <DockItem
          mouseX={mouseX}
          label={theme === 'dark' ? '라이트 모드' : '다크 모드'}
          onClick={toggleTheme}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
        </DockItem>
        <DockItem mouseX={mouseX} label="초기 설정 마법사" onClick={onOpenWizard}>
          <Icon name="sparkle" className="h-5 w-5" />
        </DockItem>
      </div>
    </nav>
  );
}

function DockItem({
  mouseX,
  label,
  active = false,
  indicator = false,
  onClick,
  children,
}: {
  mouseX: number | null;
  label: string;
  active?: boolean;
  indicator?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  // 포인터와의 거리에 따라 커지는 확대 효과
  let size = BASE;
  if (mouseX !== null && ref.current) {
    const rect = ref.current.getBoundingClientRect();
    const d = Math.abs(mouseX - (rect.left + rect.width / 2));
    const t = Math.max(0, 1 - d / RANGE);
    size = BASE + GROW * t * t;
  }

  return (
    <div className="group relative flex flex-col items-center">
      <span className="pointer-events-none absolute -top-10 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-white dark:text-ink-900">
        {label}
      </span>
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        data-active={active}
        className="dock-tile active:scale-90"
        style={{ width: size, height: size }}
      >
        {children}
      </button>
      {indicator && (
        <span
          aria-hidden="true"
          className={`absolute -bottom-[7px] h-1 w-1 rounded-full bg-ink-900 transition-opacity dark:bg-white ${
            active ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 모바일 — 하단 플로팅 독 (탭 바)                                       */
/* ------------------------------------------------------------------ */

const MOBILE_NAV: Array<{ view: AppView; icon: IconName; label: string }> = [
  { view: 'overview', icon: 'home', label: '메인' },
  { view: 'income', icon: 'banknote', label: '수입' },
  { view: 'budget', icon: 'sliders', label: '계획' },
  { view: 'timeline', icon: 'timeline', label: '타임라인' },
];

export function MobileDock({ onOpenMore }: { onOpenMore: () => void }) {
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const years = usePlannerStore((s) => s.settings.years);
  const { summary } = useSimulation();

  return (
    <nav
      aria-label="주 메뉴"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="mx-auto max-w-md">
        {/* 입력 및 계획 중에는 결과를 바로 볼 수 있는 미리보기 */}
        {(view === 'budget' || view === 'income') && (
          <button
            type="button"
            onClick={() => setView('overview')}
            className="glass glass-strong animate-sheet-up pointer-events-auto mx-auto mb-2 flex items-center gap-2 rounded-full py-1.5 pl-3.5 pr-2 text-xs"
          >
            <span className="text-ink-600 dark:text-slate-400">{years}년 후 순자산</span>
            <span className="font-semibold tabular-nums text-ink-900 dark:text-white">
              {formatKRWShort(summary.finalNetWorth)}원
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-white dark:bg-white dark:text-ink-900">
              <Icon name="chevronRight" className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          </button>
        )}

        <div className="glass glass-strong pointer-events-auto grid grid-cols-5 rounded-[22px] p-1.5">
          {MOBILE_NAV.map((item) => (
            <MobileDockButton
              key={item.view}
              icon={item.icon}
              label={item.label}
              active={view === item.view}
              onClick={() => setView(item.view)}
            />
          ))}
          <MobileDockButton
            icon="more"
            label="더보기"
            active={view === 'charts' || view === 'table'}
            onClick={onOpenMore}
          />
        </div>
      </div>
    </nav>
  );
}

function MobileDockButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic(5);
        onClick();
      }}
      aria-current={active ? 'page' : undefined}
      className={`flex min-w-0 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-medium transition-colors ${
        active ? 'text-ink-900 dark:text-white' : 'text-ink-500 dark:text-slate-500'
      }`}
    >
      <span
        className={`flex h-7 w-11 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
          active ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900' : ''
        }`}
      >
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}
