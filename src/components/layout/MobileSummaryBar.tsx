import { useEffect, useState } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { usePlannerStore } from '@/store/plannerStore';
import { formatKRWShort } from '@/utils/format';

/**
 * 모바일에서 입력 중에도 결과를 계속 볼 수 있게 하는 하단 플로팅 글래스 바.
 * 결과 영역이 화면에 들어오면 버튼이 '입력 수정'으로 바뀌어 위로 돌아갈 수 있다.
 */
export function MobileSummaryBar({ hideFrom = 'lg' }: { hideFrom?: 'md' | 'lg' }) {
  const years = usePlannerStore((s) => s.settings.years);
  const { summary } = useSimulation();
  const [resultVisible, setResultVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById('result');
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setResultVisible(entry.isIntersecting),
      { rootMargin: '0px 0px -55% 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const goTo = () => {
    if (resultVisible) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
        hideFrom === 'md' ? 'md:hidden' : 'lg:hidden'
      }`}
    >
      <div className="glass glass-strong pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-[22px] py-2 pl-4 pr-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-ink-500 dark:text-slate-400">
            {years}년 후 예상 순자산
          </p>
          <p className="text-aurora text-base font-bold leading-tight tracking-tight tabular-nums min-[360px]:text-lg">
            {formatKRWShort(summary.finalNetWorth)}
            <span className="ml-0.5 text-xs font-semibold">원</span>
          </p>
        </div>

        <button
          type="button"
          onClick={goTo}
          className={`${resultVisible ? 'btn-glass' : 'btn-primary'} min-h-[2.75rem] shrink-0 px-3.5 min-[360px]:px-4`}
        >
          {resultVisible ? '입력 수정' : '결과 보기'}
          <svg
            className={`h-4 w-4 transition-transform ${resultVisible ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 3a.75.75 0 01.75.75v10.64l3.47-3.47a.75.75 0 111.06 1.06l-4.75 4.75a.75.75 0 01-1.06 0l-4.75-4.75a.75.75 0 111.06-1.06l3.47 3.47V3.75A.75.75 0 0110 3z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
