import { useEffect, useState } from 'react';
import { InputPanel } from '@/components/form/InputPanel';
import { ResultPanel } from '@/components/result/ResultPanel';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { usePlannerStore } from '@/store/plannerStore';
import { AppHeader } from './AppHeader';
import { MobileSummaryBar } from './MobileSummaryBar';

/**
 * 대시보드 레이아웃
 * - 모바일: 입력 폼(상단) -> 결과(하단) 세로 스택 + 하단 고정 요약 바
 * - PC(lg~): 좌측 입력 패널(고정 폭, 독립 스크롤) + 우측 결과 패널
 */
export function DashboardLayout() {
  const onboarded = usePlannerStore((s) => s.onboarded);
  const [wizardOpen, setWizardOpen] = useState(false);

  // 첫 방문이면 자동으로 띄운다. (localStorage 복원이 끝난 뒤 판단)
  useEffect(() => {
    if (!onboarded) setWizardOpen(true);
  }, [onboarded]);

  return (
    <div className="flex min-h-screen flex-col bg-ink-100">
      <AppHeader onOpenWizard={() => setWizardOpen(true)} />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(340px,400px)_minmax(0,1fr)] lg:gap-6">
          {/* 입력 패널 — PC 에서는 헤더 아래에 붙어 따로 스크롤된다 */}
          <div className="lg:sticky lg:top-[4.25rem] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1">
            <InputPanel />
          </div>

          {/* 결과 패널 */}
          <div id="result" className="scroll-mt-20">
            <ResultPanel />
          </div>
        </div>
      </main>

      <MobileSummaryBar />

      {wizardOpen && (
        <OnboardingModal onClose={() => setWizardOpen(false)} />
      )}
    </div>
  );
}
