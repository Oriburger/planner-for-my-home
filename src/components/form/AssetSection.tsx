import { usePlannerStore } from '@/store/plannerStore';
import { ASSET_TYPE_LABEL, type AssetType } from '@/types/planner';
import { Accordion } from '@/components/ui/Accordion';
import {
  AddItemButton,
  EmptyState,
  ItemCard,
} from '@/components/ui/ItemCard';
import {
  Field,
  MoneyInput,
  PercentInput,
  Select,
  TextInput,
  Toggle,
} from '@/components/ui/Fields';
import { formatKRWShort } from '@/utils/format';

const TYPE_OPTIONS = (Object.keys(ASSET_TYPE_LABEL) as AssetType[]).map(
  (value) => ({ value, label: ASSET_TYPE_LABEL[value] }),
);

export function AssetSection() {
  const assets = usePlannerStore((s) => s.assets);
  const addAsset = usePlannerStore((s) => s.addAsset);
  const updateAsset = usePlannerStore((s) => s.updateAsset);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const duplicateItem = usePlannerStore((s) => s.duplicateItem);

  const total = assets.reduce((sum, a) => sum + a.amount, 0);

  return (
    <Accordion
      title="현재 보유 자산"
      summary={`${assets.length}개 · 총 ${formatKRWShort(total)}원`}
      icon="🏦"
      defaultOpen
    >
      {assets.length === 0 && (
        <EmptyState message="보유 자산을 추가해 주세요." />
      )}

      {assets.map((asset) => (
        <ItemCard
          key={asset.id}
          title={
            <TextInput
              value={asset.name}
              onChange={(name) => updateAsset(asset.id, { name })}
              placeholder="자산 이름"
            />
          }
          onRemove={() => removeItem('assets', asset.id)}
          onDuplicate={() => duplicateItem('assets', asset.id)}
        >
          <div className="grid grid-cols-2 gap-2">
            <Field label="분류" className="col-span-2">
              <Select
                value={asset.type}
                onChange={(type) => updateAsset(asset.id, { type })}
                options={TYPE_OPTIONS}
              />
            </Field>

            <Field label="현재 평가액">
              <MoneyInput
                value={asset.amount}
                onChange={(amount) => updateAsset(asset.id, { amount })}
              />
            </Field>

            <Field label="연 기대수익률">
              <PercentInput
                value={asset.annualReturnRate}
                onChange={(annualReturnRate) =>
                  updateAsset(asset.id, { annualReturnRate })
                }
                min={-30}
                max={50}
              />
            </Field>

            <Field label="월 자동이체" hint="정기 납입" className="col-span-2">
              <MoneyInput
                value={asset.monthlyContribution}
                onChange={(monthlyContribution) =>
                  updateAsset(asset.id, { monthlyContribution })
                }
              />
            </Field>

            <div className="col-span-2">
              <Toggle
                checked={asset.liquid}
                onChange={(liquid) => updateAsset(asset.id, { liquid })}
                label="유동자산 (즉시 인출 가능)"
                description="보증금·연금·청약처럼 묶인 돈이면 꺼주세요."
              />
            </div>
          </div>
        </ItemCard>
      ))}

      <AddItemButton onClick={addAsset} label="자산 항목 추가" />
    </Accordion>
  );
}
