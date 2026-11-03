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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-100/70 text-ink-900 transition-colors duration-300 dark:bg-[#0B0F19] dark:text-slate-100">
      {/* Liquid Glass Background Aurora Orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] top-[-5%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-400/25 to-indigo-500/20 blur-[130px] dark:from-blue-600/15 dark:to-indigo-700/15 animate-float-slow" />
        <div className="absolute right-[-5%] top-[15%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-sky-400/20 to-teal-400/15 blur-[140px] dark:from-sky-500/10 dark:to-emerald-600/10 animate-float-reverse" />
        <div className="absolute bottom-[-10%] left-[25%] h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-violet-400/20 to-pink-400/15 blur-[130px] dark:from-violet-600/10 dark:to-purple-800/10 animate-pulse-glow" />
      </div>

      <AppHeader onOpenWizard={() => setWizardOpen(true)} />

      <main
        className={`w-full flex-1 px-4 py-4 sm:px-6 sm:py-6 transition-all duration-300 ${
          viewMode === 'mobile'
            ? 'mx-auto my-4 max-w-[420px] rounded-3xl border border-white/60 bg-white/75 p-4 shadow-glass-lg backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-glass-dark'
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
                : 'lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1 thin-scrollbar'
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
