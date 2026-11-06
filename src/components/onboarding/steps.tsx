import type { HousingType, RepaymentType } from '@/types/planner';
import {
  CountInput,
  Field,
  MoneyInput,
  PercentInput,
  SegmentedControl,
  Select,
} from '@/components/ui/Fields';
import { formatKRWShort } from '@/utils/format';
import { currentYear } from '@/utils/time';
import {
  ASSET_PRESETS,
  EXPENSE_PRESETS,
  type OnboardingDraft,
} from './draft';

interface StepProps {
  draft: OnboardingDraft;
  patch: (patch: Partial<OnboardingDraft>) => void;
}

/** 여러 칸의 합계를 보여주는 꼬리표 */
function TotalHint({ label, amount }: { label: string; amount: number }) {
  return (
    <p className="callout-info">
      {label}{' '}
      <strong className="font-semibold tabular-nums">
        {formatKRWShort(amount)}원
      </strong>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* 1. 기간 · 기본 가정                                                  */
/* ------------------------------------------------------------------ */


export function PeriodStep({ draft, patch }: StepProps) {
  const { settings } = draft;
  const set = (p: Partial<typeof settings>) =>
    patch({ settings: { ...settings, ...p } });

  return (
    <div className="space-y-4">
      <Field label="현재 나이" hint={`${currentYear()}년 기준 · 선택`}>
        <CountInput
          value={settings.currentAge ?? 0}
          onChange={(v) => set({ currentAge: v === 0 ? null : v })}
          min={0}
          max={100}
          suffix="세"
          blankOnZero
          placeholder="미입력"
        />
      </Field>

      <Field label="물가 상승률" hint="지출이 매년 오르는 정도">
        <PercentInput
          value={settings.inflationRate}
          onChange={(inflationRate) => set({ inflationRate })}
          min={-10}
          max={30}
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. 현재 보유 자산                                                    */
/* ------------------------------------------------------------------ */

export function AssetStep({ draft, patch }: StepProps) {
  const total = ASSET_PRESETS.reduce(
    (sum, preset) => sum + draft.assets[preset.key],
    0,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {ASSET_PRESETS.map((preset) => (
          <Field key={preset.key} label={preset.label}>
            <MoneyInput
              value={draft.assets[preset.key]}
              onChange={(amount) =>
                patch({ assets: { ...draft.assets, [preset.key]: amount } })
              }
            />
          </Field>
        ))}
      </div>

      <TotalHint label="지금까지 모은 돈" amount={total} />
      <p className="px-0.5 text-[11px] leading-relaxed text-ink-500 dark:text-slate-500">
        전·월세 보증금은 다음 &lsquo;주거&rsquo; 단계에서 한 번만 입력하면
        자동으로 자산에 잡힙니다.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. 수입                                                             */
/* ------------------------------------------------------------------ */

export function IncomeStep({ draft, patch }: StepProps) {
  const set = (p: Partial<OnboardingDraft['income']>) =>
    patch({ income: { ...draft.income, ...p } });

  return (
    <div className="space-y-3">
      <Field label="연봉" hint="세전">
        <MoneyInput
          value={draft.income.annualAmount}
          onChange={(annualAmount) => set({ annualAmount })}
        />
      </Field>

      <Field label="연 인상률" hint="복리로 적용됩니다">
        <PercentInput
          value={draft.income.growthRate}
          onChange={(growthRate) => set({ growthRate })}
          min={-50}
          max={100}
        />
      </Field>

      <Field label="부수입" hint="연간 · 없으면 비워두세요">
        <MoneyInput
          value={draft.income.sideAnnualAmount}
          onChange={(sideAnnualAmount) => set({ sideAnnualAmount })}
        />
      </Field>

      <p className="px-0.5 text-[11px] leading-relaxed text-ink-500 dark:text-slate-500">
        세금과 4대보험은 연봉 구간에 맞춰 자동으로 빼고 계산합니다. 공제율을
        직접 넣고 싶으면 나중에 대시보드에서 바꿀 수 있어요.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. 주거                                                             */
/* ------------------------------------------------------------------ */

const HOUSING_OPTIONS: Array<{ value: HousingType; label: string }> = [
  { value: 'jeonse', label: '전세' },
  { value: 'wolse', label: '월세' },
  { value: 'owned', label: '자가' },
];

export function HousingStep({ draft, patch }: StepProps) {
  const set = (p: Partial<OnboardingDraft['housing']>) =>
    patch({ housing: { ...draft.housing, ...p } });

  const isOwned = draft.housing.type === 'owned';

  return (
    <div className="space-y-3">
      <div>
        <span className="mb-1.5 block px-0.5 text-xs font-semibold text-ink-600 dark:text-slate-300">
          거주 형태
        </span>
        <SegmentedControl
          value={draft.housing.type}
          onChange={(type) => set({ type })}
          options={HOUSING_OPTIONS}
        />
      </div>

      {!isOwned && (
        <Field label="보증금">
          <MoneyInput
            value={draft.housing.deposit}
            onChange={(deposit) => set({ deposit })}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-2">
        {!isOwned && (
          <Field label="월세">
            <MoneyInput
              value={draft.housing.monthlyRent}
              onChange={(monthlyRent) => set({ monthlyRent })}
            />
          </Field>
        )}
        <Field
          label={isOwned ? '월 관리비 · 세금' : '관리비 등'}
          className={isOwned ? 'col-span-2' : undefined}
        >
          <MoneyInput
            value={draft.housing.monthlyMaintenance}
            onChange={(monthlyMaintenance) => set({ monthlyMaintenance })}
          />
        </Field>
      </div>

      <Field label="연 상승률" hint="월세·관리비가 오르는 정도">
        <PercentInput
          value={draft.housing.annualIncreaseRate}
          onChange={(annualIncreaseRate) => set({ annualIncreaseRate })}
          min={-20}
          max={30}
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. 대출                                                             */
/* ------------------------------------------------------------------ */

const REPAYMENT_OPTIONS: Array<{ value: RepaymentType; label: string }> = [
  { value: 'equalPayment', label: '원리금균등 (매달 같은 금액 · 추천)' },
  { value: 'equalPrincipal', label: '원금균등 (원금 균등 상환 · 초기 부담)' },
  { value: 'interestOnly', label: '만기일시 (이자만 납부 · 전세대출 흔함)' },
];

export function LoanStep({ draft, patch }: StepProps) {
  const set = (p: Partial<OnboardingDraft['loan']>) =>
    patch({ loan: { ...draft.loan, ...p } });

  const hasLoan = draft.loan.principal > 0;

  return (
    <div className="space-y-3">
      <Field label="대출 잔액" hint="없으면 비워두고 넘어가세요">
        <MoneyInput
          value={draft.loan.principal}
          onChange={(principal) => set({ principal })}
        />
      </Field>

      {hasLoan && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="연 이자율">
              <PercentInput
                value={draft.loan.annualRate}
                onChange={(annualRate) => set({ annualRate })}
                min={0}
                max={30}
              />
            </Field>
            <Field label="남은 기간">
              <CountInput
                value={draft.loan.termYears}
                onChange={(termYears) => set({ termYears })}
                min={1}
                max={40}
                suffix="년"
              />
            </Field>
          </div>

          <Field label="상환 방식">
            <Select
              value={draft.loan.repaymentType}
              onChange={(repaymentType) => set({ repaymentType })}
              options={REPAYMENT_OPTIONS}
            />
          </Field>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. 월 고정 지출                                                     */
/* ------------------------------------------------------------------ */

export function ExpenseStep({ draft, patch }: StepProps) {
  const total = EXPENSE_PRESETS.reduce(
    (sum, preset) => sum + draft.expenses[preset.key],
    0,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {EXPENSE_PRESETS.map((preset) => (
          <Field key={preset.key} label={preset.label}>
            <MoneyInput
              value={draft.expenses[preset.key]}
              onChange={(amount) =>
                patch({ expenses: { ...draft.expenses, [preset.key]: amount } })
              }
            />
          </Field>
        ))}
      </div>

      <TotalHint label="월 고정 지출 합계" amount={total} />
      <p className="px-0.5 text-[11px] leading-relaxed text-ink-500 dark:text-slate-500">
        주거비는 앞 단계에서 따로 넣었으니 여기서는 빼고 적어주세요.
      </p>
    </div>
  );
}
