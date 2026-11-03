import { useEffect, useMemo, useRef, useState } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { formatKRWShort } from '@/utils/format';
import { runSimulation } from '@/utils/simulation';
import {
  draftToPlannerData,
  plannerDataToDraft,
  type OnboardingDraft,
} from './draft';
import {
  AssetStep,
  ExpenseStep,
  HousingStep,
  IncomeStep,
  LoanStep,
  PeriodStep,
} from './steps';

const STEPS = [
  {
    key: 'period',
    title: '얼마나 내다볼까요?',
    description: '시뮬레이션 기간과 기본 가정을 정합니다.',
    Body: PeriodStep,
  },
  {
    key: 'assets',
    title: '지금 가진 돈',
    description: '계좌별로 대략적인 금액을 넣어주세요.',
    Body: AssetStep,
  },
  {
    key: 'income',
    title: '버는 돈',
    description: '세전 연봉과 인상률을 넣어주세요.',
    Body: IncomeStep,
  },
  {
    key: 'housing',
    title: '사는 곳',
    description: '보증금과 매달 나가는 주거비를 넣어주세요.',
    Body: HousingStep,
  },
  {
    key: 'loan',
    title: '갚을 돈',
    description: '대출이 있다면 잔액과 조건을 넣어주세요.',
    Body: LoanStep,
  },
  {
    key: 'expenses',
    title: '매달 쓰는 돈',
    description: '고정적으로 나가는 생활비를 넣어주세요.',
    Body: ExpenseStep,
  },
] as const;

interface OnboardingModalProps {
  onClose: () => void;
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const importData = usePlannerStore((s) => s.importData);
  const setOnboarded = usePlannerStore((s) => s.setOnboarded);
  const loadSample = usePlannerStore((s) => s.loadSample);

  // 다시 열었을 때는 현재 입력값에서 이어서 고칠 수 있게 채워둔다.
  // 첫 방문이면 store 가 비어 있으므로 자연히 빈 값으로 시작한다.
  const [draft, setDraft] = useState<OnboardingDraft>(() =>
    plannerDataToDraft(usePlannerStore.getState()),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const patch = (p: Partial<OnboardingDraft>) =>
    setDraft((prev) => ({ ...prev, ...p }));

  // 지금까지 넣은 값으로 계산한 결과 — 마지막 단계에서 미리 보여준다
  const preview = useMemo(() => {
    const data = draftToPlannerData(draft);
    if (data.incomes.length === 0 && data.assets.length === 0) return null;
    return runSimulation(data).summary;
  }, [draft]);

  const finish = () => {
    importData(draftToPlannerData(draft));
    setOnboarded(true);
    onClose();
  };

  const skipAll = () => {
    setOnboarded(true);
    onClose();
  };

  // Esc 로 닫기 (나중에 하기와 같은 동작)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skipAll();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // 모달이 열려 있는 동안 배경 스크롤을 잠근다 (모바일 바운스 방지)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // 단계가 바뀌면 본문을 맨 위로
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [stepIndex]);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 backdrop-blur-[6px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) skipAll();
      }}
    >
      <div className="glass glass-strong animate-sheet-up flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] sm:max-h-[min(860px,92dvh)] sm:rounded-[28px]">
        {/* 모바일 시트 손잡이 */}
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden="true">
          <span className="h-1 w-9 rounded-full bg-ink-900/15 dark:bg-white/20" />
        </div>

        {/* 헤더 */}
        <header className="px-5 pb-4 pt-3 sm:px-6 sm:pt-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow text-brand-600 dark:text-brand-400">
                초기 설정 · {stepIndex + 1} / {STEPS.length}
              </p>
              <h2
                id="onboarding-title"
                className="mt-1 text-xl font-bold tracking-tight text-ink-900 dark:text-white"
              >
                {step.title}
              </h2>
              <p className="mt-0.5 text-[13px] text-ink-500 dark:text-slate-400">{step.description}</p>
            </div>

            <button
              type="button"
              onClick={skipAll}
              aria-label="설정 창 닫기"
              className="btn-icon -mr-2 -mt-1"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* 진행 표시 */}
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span
                key={s.key}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i <= stepIndex
                    ? 'bg-gradient-to-r from-brand-500 to-indigo-500'
                    : 'bg-ink-900/[0.08] dark:bg-white/10'
                }`}
              />
            ))}
          </div>
        </header>

        {/* 본문 */}
        <div
          ref={bodyRef}
          className="hairline thin-scrollbar flex-1 overflow-y-auto overscroll-contain border-t px-5 py-5 sm:px-6"
        >
          <step.Body draft={draft} patch={patch} />

          {isLast && preview && (
            <div className="mt-4 rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-indigo-500/[0.06] to-transparent p-4 dark:border-brand-400/25 dark:from-brand-400/15">
              <p className="text-xs font-semibold text-ink-500 dark:text-slate-400">
                {draft.settings.years}년 후 예상 순자산
              </p>
              <p className="mt-1 text-[28px] font-bold leading-tight tracking-tight tabular-nums text-ink-900 dark:text-white">
                {formatKRWShort(preview.finalNetWorth)}
                <span className="ml-0.5 text-base font-semibold text-ink-400">원</span>
              </p>
              <p className="mt-1 text-[11px] text-ink-500 dark:text-slate-400">
                완료를 누르면 대시보드에서 자세히 볼 수 있어요.
              </p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <footer className="hairline pb-safe border-t px-5 pt-4 sm:px-6 sm:pb-5">
          <div className="flex gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIndex((i) => i - 1)}
                className="btn-glass min-h-[3rem] px-5"
              >
                이전
              </button>
            )}

            <button
              type="button"
              onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}
              className="btn-primary min-h-[3rem] flex-1 text-[15px]"
            >
              {isLast ? '완료하고 결과 보기' : '다음'}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                loadSample();
                onClose();
              }}
              className="py-1 text-xs font-medium text-ink-500 underline-offset-4 transition hover:text-ink-800 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
            >
              예시 데이터로 둘러보기
            </button>

            {!isLast && (
              <button
                type="button"
                onClick={skipAll}
                className="py-1 text-xs font-medium text-ink-500 underline-offset-4 transition hover:text-ink-800 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
              >
                나중에 하기
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
