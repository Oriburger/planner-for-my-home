import { usePlannerStore } from '@/store/plannerStore';
import { HOUSING_TYPE_LABEL, type HousingType } from '@/types/planner';
import { Accordion } from '@/components/ui/Accordion';
import { AddItemButton, EmptyState, ItemCard } from '@/components/ui/ItemCard';
import {
  CountInput,
  Field,
  MoneyInput,
  PercentInput,
  Select,
  TextArea,
  TextInput,
} from '@/components/ui/Fields';
import { formatKRWShort } from '@/utils/format';

const TYPE_OPTIONS = (Object.keys(HOUSING_TYPE_LABEL) as HousingType[]).map(
  (value) => ({ value, label: HOUSING_TYPE_LABEL[value] }),
);

export function HousingSection() {
  const housings = usePlannerStore((s) => s.housings);
  const addHousing = usePlannerStore((s) => s.addHousing);
  const updateHousing = usePlannerStore((s) => s.updateHousing);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const duplicateItem = usePlannerStore((s) => s.duplicateItem);

  const monthly = housings
    .filter((h) => h.startYear <= 1 && (h.endYear === null || h.endYear >= 1))
    .reduce((sum, h) => sum + h.monthlyRent + h.monthlyMaintenance, 0);

  return (
    <Accordion
      title="거주 비용"
      summary={`${housings.length}개 계약 · 월 ${formatKRWShort(monthly)}원`}
      icon="🏠"
    >
      {housings.length === 0 && (
        <EmptyState message="전세·월세·자가 등 주거 계약을 추가해 주세요." />
      )}

      {housings.map((housing) => (
        <ItemCard
          key={housing.id}
          title={
            <TextInput
              value={housing.name}
              onChange={(name) => updateHousing(housing.id, { name })}
              placeholder="계약 이름"
            />
          }
          badge={`${housing.startYear}년차~`}
          onRemove={() => removeItem('housings', housing.id)}
          onDuplicate={() => duplicateItem('housings', housing.id)}
        >
          <div className="grid grid-cols-2 gap-2">
            <Field label="거주 형태" className="col-span-2">
              <Select
                value={housing.type}
                onChange={(type) => updateHousing(housing.id, { type })}
                options={TYPE_OPTIONS}
              />
            </Field>

            <Field label="보증금" className="col-span-2">
              <MoneyInput
                value={housing.deposit}
                onChange={(deposit) => updateHousing(housing.id, { deposit })}
              />
            </Field>

            <Field label="월세">
              <MoneyInput
                value={housing.monthlyRent}
                onChange={(monthlyRent) =>
                  updateHousing(housing.id, { monthlyRent })
                }
              />
            </Field>

            <Field label="관리비 등">
              <MoneyInput
                value={housing.monthlyMaintenance}
                onChange={(monthlyMaintenance) =>
                  updateHousing(housing.id, { monthlyMaintenance })
                }
              />
            </Field>

            <Field label="연 상승률" className="col-span-2">
              <PercentInput
                value={housing.annualIncreaseRate}
                onChange={(annualIncreaseRate) =>
                  updateHousing(housing.id, { annualIncreaseRate })
                }
                min={-20}
                max={30}
              />
            </Field>

            <Field label="시작 연차">
              <CountInput
                value={housing.startYear}
                onChange={(startYear) =>
                  updateHousing(housing.id, { startYear })
                }
                min={1}
                max={40}
              />
            </Field>

            <Field label="종료 연차" hint="0 = 끝까지">
              <CountInput
                value={housing.endYear ?? 0}
                onChange={(v) =>
                  updateHousing(housing.id, { endYear: v === 0 ? null : v })
                }
                min={0}
                max={40}
                blankOnZero
                placeholder="끝까지"
              />
            </Field>

            <Field label="메모" className="col-span-2">
              <TextArea
                value={housing.memo ?? ''}
                onChange={(memo) => updateHousing(housing.id, { memo })}
                placeholder="선택 입력"
              />
            </Field>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
            2년차 이후 시작하는 계약의 보증금은 해당 연차에 여유자금에서
            빠져나가 묶인 자산으로 이동합니다. 1년차 계약의 보증금은 이미
            &lsquo;현재 보유 자산&rsquo;에 입력된 것으로 봅니다.
          </p>
        </ItemCard>
      ))}

      <AddItemButton onClick={addHousing} label="주거 계약 추가" />
    </Accordion>
  );
}
