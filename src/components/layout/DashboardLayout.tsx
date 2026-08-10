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

  return (
    <div className="flex min-h-screen flex-col bg-ink-100 dark:bg-slate-950">
      <AppHeader onOpenWizard={() => setWizardOpen(true)} />

      <main
        className={`w-full flex-1 px-4 py-4 sm:px-6 sm:py-6 transition-all duration-300 ${
          viewMode === 'mobile'
            ? 'mx-auto my-4 max-w-[420px] rounded-3xl border border-ink-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900'
            : 'mx-auto max-w-[1440px]'
        }`}
      >

        <div
          className={
            viewMode === 'mobile'
              ? 'flex flex-col gap-4'
              : viewMode === 'pc'
                ? 'grid grid-cols-[380px_minmax(0,1fr)] items-start gap-6'
                : 'grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(340px,400px)_minmax(0,1fr)] lg:gap-6'
          }
        >
          {/* 입력 패널 */}
          <div
            className={
              viewMode === 'mobile'
                ? 'w-full'
                : 'lg:sticky lg:top-[4.25rem] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1'
            }
          >
            <InputPanel />
          </div>

          {/* 결과 패널 */}
          <div id="result" className="scroll-mt-20">
            <ResultPanel />
          </div>
        </div>
      </main>

      <AppFooter />
      <MobileSummaryBar />

      {wizardOpen && (
        <OnboardingModal onClose={() => setWizardOpen(false)} />
      )}
    </div>
  );
}
