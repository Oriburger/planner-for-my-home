import { useEffect, useState } from 'react';
import { InputPanel } from '@/components/form/InputPanel';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { ViewContent } from '@/components/views/Views';
import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore } from '@/store/uiStore';
import { AppHeader } from './AppHeader';
import { DesktopDock, MobileDock } from './Dock';
import { SettingsSheet } from './SettingsSheet';
import { Wallpaper } from './Wallpaper';

export function DashboardLayout() {
  const onboarded = usePlannerStore((s) => s.onboarded);
  const view = useUIStore((s) => s.view);
  const inputPanelOpen = useUIStore((s) => s.inputPanelOpen);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [sheet, setSheet] = useState<'wallpaper' | 'more' | null>(null);

  // 첫 방문이면 자동으로 띄운다. (localStorage 복원이 끝난 뒤 판단)
  useEffect(() => {
    if (!onboarded) setWizardOpen(true);
  }, [onboarded]);

  // 화면을 바꾸면 맨 위에서 시작
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  // 데스크톱 좌측 입력 패널 ('입력' 화면이 선택돼 있으면 항상 표시)
  const showAside = inputPanelOpen || view === 'plan';

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] flex-col overflow-x-clip text-ink-900 dark:text-slate-100">
      <Wallpaper />
      <AppHeader />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 pb-32 pt-3 sm:px-6 sm:pt-4 lg:px-8 lg:pb-36">
        <div
          className={`lg:grid lg:items-start lg:gap-6 ${
            showAside ? 'lg:grid-cols-[minmax(340px,380px)_minmax(0,1fr)]' : 'lg:grid-cols-1'
          }`}
        >
          {showAside && (
            <aside className="thin-scrollbar hidden lg:sticky lg:top-[5.25rem] lg:-mx-3 lg:block lg:max-h-[calc(100dvh-11.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:px-3 lg:pb-4">
              <InputPanel />
            </aside>
          )}

          <div key={view} className="animate-view-in min-w-0">
            <ViewContent view={view} />
          </div>
        </div>
      </main>

      <DesktopDock
        onOpenWizard={() => setWizardOpen(true)}
        onOpenSettings={() => setSheet(sheet === 'wallpaper' ? null : 'wallpaper')}
      />
      <MobileDock onOpenMore={() => setSheet('more')} />

      <SettingsSheet
        open={sheet !== null}
        mode={sheet ?? 'wallpaper'}
        onClose={() => setSheet(null)}
        onOpenWizard={() => setWizardOpen(true)}
      />

      {wizardOpen && <OnboardingModal onClose={() => setWizardOpen(false)} />}
    </div>
  );
}
