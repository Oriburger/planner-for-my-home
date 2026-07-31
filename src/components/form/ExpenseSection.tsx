import { usePlannerStore } from '@/store/plannerStore';
import {
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategory,
} from '@/types/planner';
import { Accordion } from '@/components/ui/Accordion';
import { AddItemButton, EmptyState, ItemCard } from '@/components/ui/ItemCard';
import {
  CountInput,
  Field,
  MoneyInput,
  PercentInput,
  Select,
  TextInput,
  Toggle,
} from '@/components/ui/Fields';
import { formatKRWShort } from '@/utils/format';

const CATEGORY_OPTIONS = (
  Object.keys(EXPENSE_CATEGORY_LABEL) as ExpenseCategory[]
).map((value) => ({ value, label: EXPENSE_CATEGORY_LABEL[value] }));

export function ExpenseSection() {
  const expenses = usePlannerStore((s) => s.expenses);
  const inflationRate = usePlannerStore((s) => s.settings.inflationRate);
  const addExpense = usePlannerStore((s) => s.addExpense);
  const updateExpense = usePlannerStore((s) => s.updateExpense);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const duplicateItem = usePlannerStore((s) => s.duplicateItem);

  const monthlyTotal = expenses
    .filter((e) => e.startYear <= 1 && (e.endYear === null || e.endYear >= 1))
    .reduce((sum, e) => sum + e.monthlyAmount, 0);

  return (
    <Accordion
      title="월 고정 지출"
      summary={`${expenses.length}개 · 월 ${formatKRWShort(monthlyTotal)}원`}
      icon="🧾"
    >
      {expenses.length === 0 && (
        <EmptyState message="식비·교통비 등 고정 지출을 추가해 주세요." />
      )}

      {expenses.map((expense) => (
        <ItemCard
          key={expense.id}
          title={
            <TextInput
              value={expense.name}
              onChange={(name) => updateExpense(expense.id, { name })}
              placeholder="지출 이름"
            />
          }
          onRemove={() => removeItem('expenses', expense.id)}
          onDuplicate={() => duplicateItem('expenses', expense.id)}
        >
          <div className="grid grid-cols-2 gap-2">
            <Field label="카테고리">
              <Select
                value={expense.category}
                onChange={(category) => updateExpense(expense.id, { category })}
                options={CATEGORY_OPTIONS}
              />
            </Field>

            <Field label="월 지출액">
              <MoneyInput
                value={expense.monthlyAmount}
                onChange={(monthlyAmount) =>
                  updateExpense(expense.id, { monthlyAmount })
                }
              />
            </Field>

            <Field label="시작 연차">
              <CountInput
                value={expense.startYear}
                onChange={(startYear) =>
                  updateExpense(expense.id, { startYear })
                }
                min={1}
                max={40}
              />
            </Field>

            <Field label="종료 연차" hint="0 = 끝까지">
              <CountInput
                value={expense.endYear ?? 0}
                onChange={(v) =>
                  updateExpense(expense.id, { endYear: v === 0 ? null : v })
                }
                min={0}
                max={40}
                blankOnZero
                placeholder="끝까지"
              />
            </Field>

            <div className="col-span-2">
              <Toggle
                checked={expense.inflationRate === null}
                onChange={(useDefault) =>
                  updateExpense(expense.id, {
                    inflationRate: useDefault ? null : inflationRate,
                  })
                }
                label="전역 물가상승률 따르기"
                description={`현재 ${inflationRate}% 적용 중`}
              />
            </div>

            {expense.inflationRate !== null && (
              <Field label="개별 상승률" className="col-span-2">
                <PercentInput
                  value={expense.inflationRate}
                  onChange={(v) =>
                    updateExpense(expense.id, { inflationRate: v })
                  }
                  min={-20}
                  max={30}
                />
              </Field>
            )}
          </div>
        </ItemCard>
      ))}

      <AddItemButton onClick={addExpense} label="지출 항목 추가" />
    </Accordion>
  );
}
