import { useEffect, useState } from 'react';
import { InputPanel } from '@/components/form/InputPanel';
import { ResultPanel } from '@/components/result/ResultPanel';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore } from '@/store/uiStore';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { MobileSummaryBar } from './MobileSummaryBar';

export function DashboardLayout() {
  const viewMode = useUIStore((s) => s.viewMode);
  const onboarded = usePlannerStore((s) => s.onboarded);
  const [wizardOpen, setWizardOpen] = useState(false);

  // 첫 방문이면 자동으로 띄운다. (localStorage 복원이 끝난 뒤 판단)
  useEffect(() => {
    if (!onboarded) setWizardOpen(true);
  }, [onboarded]);

  const isMobilePreview = viewMode === 'mobile';

  const gridClass = isMobilePreview
    ? 'flex flex-col gap-4'
    : viewMode === 'pc'
      ? 'grid grid-cols-[380px_minmax(0,1fr)] items-start gap-6'
      : 'grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(340px,400px)_minmax(0,1fr)] lg:gap-6';

  const inputColumnClass = isMobilePreview
    ? 'w-full'
    : viewMode === 'pc'
      ? 'thin-scrollbar sticky top-[5.75rem] -mx-3 max-h-[calc(100dvh-6.75rem)] overflow-y-auto overscroll-contain px-3 pb-4'
      : 'lg:thin-scrollbar lg:sticky lg:top-[5.75rem] lg:-mx-3 lg:max-h-[calc(100dvh-6.75rem)] lg:overflow-y-auto lg:overscroll-contain lg:px-3 lg:pb-4';

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] flex-col overflow-x-clip text-ink-900 dark:text-slate-100">
      <div className="app-backdrop" aria-hidden="true" />
      <div className="app-grain" aria-hidden="true" />

      <AppHeader onOpenWizard={() => setWizardOpen(true)} />

      <main
        className={`w-full flex-1 pb-32 pt-4 sm:pt-6 lg:pb-10 ${
          isMobilePreview ? 'px-3 sm:px-6' : 'mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8'
        }`}
      >
        <div
          className={
            isMobilePreview
              ? 'mx-auto max-w-[420px] rounded-[36px] border border-white/50 bg-white/20 p-3 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/[0.02]'
              : ''
          }
        >
          <div className={gridClass}>
            {/* 입력 패널 */}
            <div className={inputColumnClass}>
              <InputPanel />
            </div>

            {/* 결과 패널 */}
            <div id="result" className="min-w-0 scroll-mt-24">
              <ResultPanel />
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
      {viewMode !== 'pc' && <MobileSummaryBar />}

      {wizardOpen && <OnboardingModal onClose={() => setWizardOpen(false)} />}
    </div>
  );
}
