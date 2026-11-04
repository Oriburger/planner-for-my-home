import { usePlannerStore } from '@/store/plannerStore';
import { CountInput, MoneyInput, TextInput } from '@/components/ui/Fields';
import { AddItemButton, EmptyState } from '@/components/ui/ItemCard';
import { Icon } from '@/components/ui/Icon';

/** 연도별 목표 목록 편집 (시트·입력 패널 공용) */
export function GoalEditor() {
  const goals = usePlannerStore((s) => s.goals);
  const startYear = usePlannerStore((s) => s.settings.startYear);
  const addGoal = usePlannerStore((s) => s.addGoal);
  const updateGoal = usePlannerStore((s) => s.updateGoal);
  const removeGoal = usePlannerStore((s) => s.removeGoal);
  const sorted = [...goals].sort((a, b) => a.yearIndex - b.yearIndex);

  return (
    <div className="space-y-2">
      {sorted.length === 0 && <EmptyState message="모으고 싶은 금액과 시점을 정해 보세요." />}

      {sorted.map((g) => (
        <div key={g.id} className="glass-tile animate-pop rounded-xl p-2.5">
          <div className="flex items-center gap-1">
            <div className="min-w-0 flex-1">
              <TextInput
                value={g.name}
                onChange={(name) => updateGoal(g.id, { name })}
                placeholder="목표 이름"
              />
            </div>
            <button
              type="button"
              onClick={() => removeGoal(g.id)}
              aria-label={`${g.name} 삭제`}
              className="btn-icon hover:!bg-rose-500/10 hover:!text-rose-600"
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block px-0.5 text-[11px] font-medium text-ink-600 dark:text-slate-400">
                언제까지 · {startYear + g.yearIndex - 1}년
              </span>
              <CountInput
                value={g.yearIndex}
                onChange={(yearIndex) => updateGoal(g.id, { yearIndex })}
                min={1}
                max={40}
              />
            </label>
            <label className="block">
              <span className="mb-1 block px-0.5 text-[11px] font-medium text-ink-600 dark:text-slate-400">
                얼마를
              </span>
              <MoneyInput value={g.amount} onChange={(amount) => updateGoal(g.id, { amount })} />
            </label>
          </div>
        </div>
      ))}

      <AddItemButton onClick={() => addGoal()} label="목표 추가" />
    </div>
  );
}
