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
  TextInput,
  Toggle,
} from '@/components/ui/Fields';
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

export function IncomeSection() {
  const incomes = usePlannerStore((s) => s.incomes);
  const years = usePlannerStore((s) => s.settings.years);
  const addIncome = usePlannerStore((s) => s.addIncome);
  const updateIncome = usePlannerStore((s) => s.updateIncome);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const duplicateItem = usePlannerStore((s) => s.duplicateItem);

  const total = incomes.reduce((sum, i) => sum + i.annualAmount, 0);

  return (
    <Accordion
      title="수입"
      summary={`${incomes.length}개 · 첫 해 세전 ${formatKRWShort(total)}원`}
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
                ]}
              />
            </div>

            {income.growthMode === 'fixed' ? (
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
            ) : (
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

      <AddItemButton onClick={addIncome} label="수입 항목 추가" />
    </Accordion>
  );
}
