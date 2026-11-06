import { useCallback, useEffect, useRef, useState } from 'react';
import { InputPanel } from '@/components/form/InputPanel';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { GoalEditor } from '@/components/home/GoalEditor';
import { Sheet } from '@/components/ui/Sheet';
import { ViewContent } from '@/components/views/Views';
import { useSwipeNav } from '@/hooks/useSwipeNav';
import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore, type AppView } from '@/store/uiStore';
import { haptic } from '@/utils/feedback';
import { AppHeader } from './AppHeader';
import { DesktopDock, MobileDock } from './Dock';
import { SettingsSheet } from './SettingsSheet';
import { Wallpaper } from './Wallpaper';

/** 모바일에서 좌우로 밀 때의 화면 순서 */
const SWIPE_ORDER: AppView[] = ['overview', 'income', 'budget', 'timeline', 'charts', 'table'];

export function DashboardLayout() {
  const onboarded = usePlannerStore((s) => s.onboarded);
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const inputPanelOpen = useUIStore((s) => s.inputPanelOpen);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [sheet, setSheet] = useState<'wallpaper' | 'more' | null>(null);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // 첫 방문이면 자동으로 띄운다. (localStorage 복원이 끝난 뒤 판단)
  useEffect(() => {
    if (!onboarded) setWizardOpen(true);
  }, [onboarded]);

  // 화면 전환 방향 → 들어오는 애니메이션 방향
  const prevView = useRef(view);
  const order = (v: AppView) => SWIPE_ORDER.indexOf(v);
  const enterClass =
    prevView.current === view
      ? 'animate-view-in'
      : order(view) > order(prevView.current)
        ? 'animate-from-right'
        : 'animate-from-left';
  useEffect(() => {
    prevView.current = view;
    window.scrollTo({ top: 0 });
  }, [view]);

  // 모바일: 좌우 스와이프로 화면 넘기기
  const onSwipe = useCallback(
    (dir: 'left' | 'right') => {
      const i = order(view);
      const next = SWIPE_ORDER[i + (dir === 'left' ? 1 : -1)];
      if (next) {
        haptic(6);
        setView(next);
      }
    },
    [view, setView],
  );
  useSwipeNav(mainRef, onSwipe, !wizardOpen && !sheet && !goalsOpen);

  // PC: 포인터를 따라가는 하이라이트 (.spotlight)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const el = (e.target as HTMLElement | null)?.closest?.('.spotlight') as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, []);

  const showAside = inputPanelOpen;
  const closeSheet = useCallback(() => setSheet(null), []);
  const closeGoals = useCallback(() => setGoalsOpen(false), []);

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] flex-col overflow-x-clip text-ink-900 dark:text-slate-100">
      <Wallpaper />
      <AppHeader />

      <main
        ref={mainRef}
        className="mx-auto w-full max-w-[1440px] flex-1 px-3 pb-44 pt-3 sm:px-6 sm:pt-4 lg:px-8 lg:pb-36"
      >
        <div
          className={`lg:grid lg:items-start lg:gap-6 ${
            showAside ? 'lg:grid-cols-[minmax(340px,380px)_minmax(0,1fr)]' : 'lg:grid-cols-1'
          }`}
        >
          {showAside && (
            <aside className="aside-fade thin-scrollbar hidden lg:sticky lg:top-[5.25rem] lg:-mx-3 lg:block lg:max-h-[calc(100dvh-11.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:px-3 lg:pb-4">
              <InputPanel />
            </aside>
          )}

          <div key={view} className={`${enterClass} min-w-0`}>
            <ViewContent view={view} onEditGoals={() => setGoalsOpen(true)} />
          </div>
        </div>
      </main>

      <DesktopDock
        onOpenWizard={() => setWizardOpen(true)}
        onOpenSettings={() => setSheet(sheet === 'wallpaper' ? null : 'wallpaper')}
        onOpenGoals={() => setGoalsOpen(true)}
      />
      <MobileDock onOpenMore={() => setSheet('more')} />

      <SettingsSheet
        open={sheet !== null}
        mode={sheet ?? 'wallpaper'}
        onClose={closeSheet}
        onOpenWizard={() => setWizardOpen(true)}
      />

      <Sheet open={goalsOpen} title="연도별 목표" onClose={closeGoals} desktop="center">
        <GoalEditor />
      </Sheet>

      {wizardOpen && <OnboardingModal onClose={() => setWizardOpen(false)} />}
    </div>
  );
}
