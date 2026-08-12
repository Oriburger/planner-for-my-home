import { usePlannerStore } from '@/store/plannerStore';
import { ASSET_TYPE_LABEL, type AssetType } from '@/types/planner';
import { Accordion } from '@/components/ui/Accordion';
import {
  AddItemButton,
  EmptyState,
  ItemCard,
} from '@/components/ui/ItemCard';
import {
  CountInput,
  Field,
  MoneyInput,
  PercentInput,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/ui/Fields';
import { useSimulation } from '@/hooks/useSimulation';
import { formatKRWShort } from '@/utils/format';

const TYPE_OPTIONS = (Object.keys(ASSET_TYPE_LABEL) as AssetType[]).map(
  (value) => ({ value, label: ASSET_TYPE_LABEL[value] }),
);

const HAS_MATURITY_TYPES: AssetType[] = [
  'pension',
  'savings',
  'housingSubscription',
];

export function AssetSection() {
  const assets = usePlannerStore((s) => s.assets);
  const settings = usePlannerStore((s) => s.settings);
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

      {assets.map((asset) => {
        const hasMaturity = HAS_MATURITY_TYPES.includes(asset.type);

        return (
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

              <Field label="시작 연차" hint="1 = 지금부터 보유">
                <CountInput
                  value={asset.startYear ?? 1}
                  onChange={(startYear) => updateAsset(asset.id, { startYear })}
                  min={1}
                  max={40}
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

              {hasMaturity && (
                <>
                  <Field label="만기/수령 연차" hint="비우면 미설정">
                    <CountInput
                      value={asset.maturityYear ?? 0}
                      onChange={(v) =>
                        updateAsset(asset.id, { maturityYear: v > 0 ? v : null })
                      }
                      min={0}
                      max={40}
                      blankOnZero
                      placeholder="만기 없음"
                    />
                  </Field>

                  {settings.currentAge !== null ? (
                    <Field label="만기 나이" hint="예: 만 55세">
                      <CountInput
                        value={asset.maturityAge ?? 0}
                        onChange={(v) =>
                          updateAsset(asset.id, { maturityAge: v > 0 ? v : null })
                        }
                        min={0}
                        max={100}
                        suffix="세"
                        blankOnZero
                        placeholder="미지정"
                      />
                    </Field>
                  ) : (
                    <div />
                  )}
                </>
              )}

              <Field label="메모" className="col-span-2">
                <TextArea
                  value={asset.memo ?? ''}
                  onChange={(memo) => updateAsset(asset.id, { memo })}
                  placeholder="선택 입력"
                />
              </Field>

              <div className="col-span-2 space-y-2 pt-1">
                <Toggle
                  checked={asset.liquid}
                  onChange={(liquid) => updateAsset(asset.id, { liquid })}
                  label="유동자산 (즉시 인출 가능)"
                  description="보증금·연금·청약처럼 묶인 돈이면 꺼주세요."
                />

                {!asset.liquid && hasMaturity && (
                  <Toggle
                    checked={asset.convertLiquidOnMaturity ?? true}
                    onChange={(convertLiquidOnMaturity) =>
                      updateAsset(asset.id, { convertLiquidOnMaturity })
                    }
                    label="만기 시 유동자산으로 자동 전환"
                    description="만기 시점에 자동이체가 중단되고 즉시 인출 가능한 현금으로 전환됩니다."
                  />
                )}
              </div>
            </div>
          </ItemCard>
        );
      })}

      <ContributionBalanceHint />

      <AddItemButton onClick={addAsset} label="자산 항목 추가" />
    </Accordion>
  );
}

/**
 * 자동이체는 전액 집행되므로, 여유자금이 이를 감당하는지 바로 보여준다.
 * 첫 해 기준으로 안내하고 부족해지는 해가 있으면 함께 알린다.
 */
function ContributionBalanceHint() {
  const { rows, summary } = useSimulation();
  const first = rows[0];

  if (first.contribution <= 0) return null;

  const shortfallYear = summary.firstContributionShortfallYear;
  const short = shortfallYear !== null;

  return (
    <div
      role={short ? 'alert' : undefined}
      className={`rounded-xl px-3 py-2.5 text-xs ${
        short
          ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
          : 'bg-brand-50 text-brand-800 dark:bg-blue-950/40 dark:text-blue-200'
      }`}
    >
      <p>
        1년차 자동이체{' '}
        <strong className="font-semibold tabular-nums">
          {formatKRWShort(first.contribution)}원
        </strong>{' '}
        · 남은 여유자금{' '}
        <strong className="font-semibold tabular-nums">
          {formatKRWShort(first.contributionBalance)}원
        </strong>
      </p>
      {short && (
        <p className="mt-1 leading-relaxed">
          {shortfallYear}년차에 여유자금이 최대{' '}
          {formatKRWShort(summary.maxContributionShortfall)}원 모자랍니다.
          자동이체 금액을 줄여주세요.
        </p>
      )}
    </div>
  );
}
