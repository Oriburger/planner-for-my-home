import { usePlannerStore } from '@/store/plannerStore';
import { currentYear, effectiveAge } from '@/utils/time';
import { Card, CardHeader } from '@/components/ui/Card';
import {
  CountInput,
  Field,
  PercentInput,
  SegmentedControl,
  Toggle,
} from '@/components/ui/Fields';


/** 전역 가정치 (기간은 헤더의 기간 컨트롤에서 조절) */
export function PeriodSection() {
  const settings = usePlannerStore((s) => s.settings);
  const updateSettings = usePlannerStore((s) => s.updateSettings);

  return (
    <Card>
      <CardHeader
        title="기본 가정"
        icon="sliders"
      />

      <div className="space-y-4 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <Field label="현재 나이" hint={`${currentYear()}년 기준`}>
          <CountInput
            value={effectiveAge(settings) ?? 0}
            onChange={(v) => updateSettings({ currentAge: v === 0 ? null : v })}
            min={0}
            max={100}
            suffix="세"
            blankOnZero
            placeholder="미입력"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="물가 상승률" hint="지출 기본값">
            <PercentInput
              value={settings.inflationRate}
              onChange={(v) => updateSettings({ inflationRate: v })}
              min={-10}
              max={30}
            />
          </Field>
          <Field label="여유자금 수익률" hint="남은 저축분">
            <PercentInput
              value={settings.savingsReturnRate}
              onChange={(v) => updateSettings({ savingsReturnRate: v })}
              min={-20}
              max={30}
            />
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block px-0.5 text-xs font-semibold text-ink-600 dark:text-slate-300">
            세금 · 4대보험 계산 방식
          </span>
          <SegmentedControl
            value={settings.taxMode}
            onChange={(v) => updateSettings({ taxMode: v })}
            options={[
              { value: 'simplified', label: '연봉 구간 자동' },
              { value: 'flatRate', label: '공제율 직접입력' },
            ]}
          />
          {settings.taxMode === 'flatRate' && (
            <div className="mt-2">
              <Field label="총 공제율" hint="소득세 + 4대보험">
                <PercentInput
                  value={settings.flatTaxRate}
                  onChange={(v) => updateSettings({ flatTaxRate: v })}
                  min={0}
                  max={60}
                />
              </Field>
            </div>
          )}
        </div>

        <Toggle
          checked={settings.applyAssetReturn}
          onChange={(v) => updateSettings({ applyAssetReturn: v })}
          label="자산 운용수익 반영"
          description="끄면 수익률 없이 저축액만 단순 누적합니다."
        />

        <Toggle
          checked={settings.applyTaxRefund}
          onChange={(v) => updateSettings({ applyTaxRefund: v })}
          label="연말정산 환급 반영"
          description="연금저축·청약·월세 공제로 덜 내는 세금을 매년 현금흐름에 더합니다."
        />

        <Toggle
          checked={settings.houselessHead}
          onChange={(v) => updateSettings({ houselessHead: v })}
          label="무주택 세대주"
          description="청약·월세·전세대출 공제의 공통 요건입니다. 자가라면 꺼주세요."
        />
      </div>
    </Card>
  );
}
