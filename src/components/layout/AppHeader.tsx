import { usePlannerStore } from '@/store/plannerStore';

export function AppHeader() {
  const years = usePlannerStore((s) => s.settings.years);

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-base text-white shadow-sm">
          📈
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-ink-900 sm:text-base">
            저축 예상액 계산기
          </h1>
          <p className="truncate text-[11px] text-ink-500">
            지금의 수입과 지출로 {years}년 뒤 자산을 예측해 보세요
          </p>
        </div>

        <span className="hidden shrink-0 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 sm:block">
          {years}년 시뮬레이션
        </span>
      </div>
    </header>
  );
}
