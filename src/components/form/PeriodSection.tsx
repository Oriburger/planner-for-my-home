import { usePlannerStore } from '@/store/plannerStore';
import { Card, CardHeader } from '@/components/ui/Card';
import {
  CountInput,
  Field,
  PercentInput,
  SegmentedControl,
  Toggle,
} from '@/components/ui/Fields';

const PRESETS = [5, 10, 20, 30];

/** 시뮬레이션 기간 + 전역 가정치 */
export function PeriodSection() {
  const settings = usePlannerStore((s) => s.settings);
  const setYears = usePlannerStore((s) => s.setYears);
  const updateSettings = usePlannerStore((s) => s.updateSettings);

  return (
    <Card>
      <CardHeader
        title="시뮬레이션 기간"
        description="1년 단위로 최대 40년까지 조절할 수 있어요."
      />

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-xs font-medium text-ink-600">기간</span>
            <span className="text-2xl font-bold tabular-nums text-brand-700">
              {settings.years}
              <span className="ml-0.5 text-sm font-semibold text-ink-500">
                년
              </span>
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={40}
            step={1}
            value={settings.years}
            onChange={(e) => setYears(Number(e.target.value))}
            aria-label="시뮬레이션 기간(년)"
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-brand-600"
          />

          <div className="mt-2 flex gap-1.5">
            {PRESETS.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYears(y)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                  settings.years === y
                    ? 'bg-brand-600 text-white'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                {y}년
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="시작 연도">
            <CountInput
              value={settings.startYear}
              onChange={(v) => updateSettings({ startYear: v })}
              min={2000}
              max={2100}
              suffix="년"
            />
          </Field>
          <Field label="현재 나이" hint="선택">
            <CountInput
              value={settings.currentAge ?? 0}
              onChange={(v) =>
                updateSettings({ currentAge: v === 0 ? null : v })
              }
              min={0}
              max={100}
              suffix="세"
              blankOnZero
              placeholder="미입력"
            />
          </Field>
        </div>

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
          <span className="mb-1 block text-xs font-medium text-ink-600">
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
      </div>
    </Card>
  );
}
