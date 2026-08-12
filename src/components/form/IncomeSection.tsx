import { usePlannerStore } from '@/store/plannerStore';
import { INCOME_TYPE_LABEL, type IncomeItem, type IncomeType } from '@/types/planner';
import { Accordion } from '@/components/ui/Accordion';
import { AddItemButton, EmptyState, ItemCard } from '@/components/ui/ItemCard';
import {
  CountInput,
  Field,
  MoneyInput,
  PercentInput,
  SegmentedControl,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/ui/Fields';
import { useSimulation } from '@/hooks/useSimulation';
import { formatKRWShort } from '@/utils/format';

const TYPE_OPTIONS = (Object.keys(INCOME_TYPE_LABEL) as IncomeType[]).map(
  (value) => ({ value, label: INCOME_TYPE_LABEL[value] }),
);

/** 연도별 인상률 수동 입력 그리드 */
function ManualGrowthEditor({
  income,
  totalYears,
  onChange,
}: {
  income: IncomeItem;
  totalYears: number;
  onChange: (rates: number[]) => void;
}) {
  // 2년차부터 인상률이 적용되므로 (기간 - 시작연차) 개의 입력이 필요하다
  const steps = Math.max(0, totalYears - income.startYear);

  if (steps === 0) {
    return (
      <p className="text-[11px] text-ink-400">
        기간을 늘리면 연도별 인상률을 입력할 수 있어요.
      </p>
    );
  }

  const setAt = (index: number, value: number) => {
    const next = Array.from({ length: steps }, (_, i) =>
      i < income.manualGrowthRates.length ? income.manualGrowthRates[i] : 0,
    );
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      {Array.from({ length: steps }, (_, i) => (
        <div key={i}>
          <span className="mb-0.5 block text-[10px] text-ink-400">
            {income.startYear + i + 1}년차
          </span>
          <PercentInput
            value={income.manualGrowthRates[i] ?? 0}
            onChange={(v) => setAt(i, v)}
            min={-50}
            max={100}
          />
        </div>
      ))}
    </div>
  );
}

/** 연차별 금액 커스텀 직접 입력 그리드 (인상률이 아닌 그 해의 금액 자체를 지정) */
function CustomAmountEditor({
  income,
  totalYears,
  onChange,
}: {
  income: IncomeItem;
  totalYears: number;
  onChange: (amounts: number[]) => void;
}) {
  // 시작 연차부터 기간 끝까지 매년 금액을 입력한다
  const steps = Math.max(0, totalYears - income.startYear + 1);

  if (steps === 0) {
    return (
      <p className="text-[11px] text-ink-400">
        기간을 늘리면 연도별 금액을 입력할 수 있어요.
      </p>
    );
  }

  const existing = income.customAnnualAmounts ?? [];

  const setAt = (index: number, value: number) => {
    const next = Array.from({ length: steps }, (_, i) =>
      i < existing.length ? existing[i] : income.annualAmount,
    );
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      {Array.from({ length: steps }, (_, i) => (
        <div key={i}>
          <span className="mb-0.5 block text-[10px] text-ink-400">
            {income.startYear + i}년차
          </span>
          <MoneyInput
            value={existing[i] ?? income.annualAmount}
            onChange={(v) => setAt(i, v)}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * 세금·4대보험은 과세 대상 수입을 모두 합쳐서 계산하므로 항목별로 쪼갤 수 없다.
 * 그래서 섹션 단위로 첫 해 실수령액을 월 단위까지 풀어서 보여준다.
 */
function NetIncomeHint() {
  const { rows } = useSimulation();
  const first = rows[0];

  if (first.grossIncome <= 0) return null;

  return (
    <div className="rounded-xl bg-brand-50 px-3 py-2.5 text-xs text-brand-800 dark:bg-blue-950/40 dark:text-blue-200">
      <p>
        1년차 세후 월 실수령{' '}
        <strong className="font-semibold tabular-nums">
          {formatKRWShort(first.netIncome / 12)}원
        </strong>
      </p>
      <p className="mt-1 text-[11px] text-brand-700/80 dark:text-blue-300/80">
        세전 연 {formatKRWShort(first.grossIncome)}원 · 세금·4대보험{' '}
        {formatKRWShort(first.taxAndInsurance)}원 · 실수령 연{' '}
        {formatKRWShort(first.netIncome)}원
      </p>
    </div>
  );
}

export function IncomeSection() {
  const incomes = usePlannerStore((s) => s.incomes);
  const years = usePlannerStore((s) => s.settings.years);
  const addIncome = usePlannerStore((s) => s.addIncome);
  const updateIncome = usePlannerStore((s) => s.updateIncome);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const duplicateItem = usePlannerStore((s) => s.duplicateItem);

  const total = incomes.reduce((sum, i) => sum + i.annualAmount, 0);
  const { rows } = useSimulation();

  return (
    <Accordion
      title="수입"
      summary={`${incomes.length}개 · 세전 연 ${formatKRWShort(
        total,
      )}원 · 세후 월 ${formatKRWShort(rows[0].netIncome / 12)}원`}
      icon="💰"
    >
      {incomes.length === 0 && <EmptyState message="수입 항목을 추가해 주세요." />}

      {incomes.map((income) => (
        <ItemCard
          key={income.id}
          title={
            <TextInput
              value={income.name}
              onChange={(name) => updateIncome(income.id, { name })}
              placeholder="수입 이름"
            />
          }
          onRemove={() => removeItem('incomes', income.id)}
          onDuplicate={() => duplicateItem('incomes', income.id)}
        >
          <div className="grid grid-cols-2 gap-2">
            <Field label="분류" className="col-span-2">
              <Select
                value={income.type}
                onChange={(type) => updateIncome(income.id, { type })}
                options={TYPE_OPTIONS}
              />
            </Field>

            <Field label="연간 금액" hint="세전" className="col-span-2">
              <MoneyInput
                value={income.annualAmount}
                onChange={(annualAmount) =>
                  updateIncome(income.id, { annualAmount })
                }
              />
            </Field>

            <div className="col-span-2">
              <span className="mb-1 block text-xs font-medium text-ink-600">
                인상률 방식
              </span>
              <SegmentedControl
                value={income.growthMode}
                onChange={(growthMode) =>
                  updateIncome(income.id, { growthMode })
                }
                options={[
                  { value: 'fixed', label: '고정 비율' },
                  { value: 'manual', label: '연도별 입력' },
                  { value: 'custom', label: '커스텀' },
                ]}
              />
            </div>

            {income.growthMode === 'fixed' && (
              <Field label="연 인상률" hint="복리 적용" className="col-span-2">
                <PercentInput
                  value={income.growthRate}
                  onChange={(growthRate) =>
                    updateIncome(income.id, { growthRate })
                  }
                  min={-50}
                  max={100}
                />
              </Field>
            )}

            {income.growthMode === 'manual' && (
              <div className="col-span-2 rounded-lg bg-ink-50 p-2">
                <ManualGrowthEditor
                  income={income}
                  totalYears={years}
                  onChange={(manualGrowthRates) =>
                    updateIncome(income.id, { manualGrowthRates })
                  }
                />
              </div>
            )}

            {income.growthMode === 'custom' && (
              <div className="col-span-2 rounded-lg bg-ink-50 p-2">
                <CustomAmountEditor
                  income={income}
                  totalYears={years}
                  onChange={(customAnnualAmounts) =>
                    updateIncome(income.id, { customAnnualAmounts })
                  }
                />
              </div>
            )}

            <Field label="시작 연차">
              <CountInput
                value={income.startYear}
                onChange={(startYear) => updateIncome(income.id, { startYear })}
                min={1}
                max={40}
              />
            </Field>

            <Field label="종료 연차" hint="0 = 끝까지">
              <CountInput
                value={income.endYear ?? 0}
                onChange={(v) =>
                  updateIncome(income.id, { endYear: v === 0 ? null : v })
                }
                min={0}
                max={40}
                blankOnZero
                placeholder="끝까지"
              />
            </Field>

            <Field label="메모" className="col-span-2">
              <TextArea
                value={income.memo ?? ''}
                onChange={(memo) => updateIncome(income.id, { memo })}
                placeholder="선택 입력"
              />
            </Field>

            <div className="col-span-2">
              <Toggle
                checked={income.taxable}
                onChange={(taxable) => updateIncome(income.id, { taxable })}
                label="세금 · 4대보험 공제 대상"
                description="끄면 입력한 금액을 전액 실수령으로 계산합니다."
              />
            </div>
          </div>
        </ItemCard>
      ))}

      <NetIncomeHint />

      <AddItemButton onClick={addIncome} label="수입 항목 추가" />
    </Accordion>
  );
}
