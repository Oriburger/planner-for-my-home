import { useState } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { useSimulation } from '@/hooks/useSimulation';
import { MilestoneHorizonSummary } from './MilestoneHorizonSummary';
import { TimelineView } from './TimelineView';
import { SummaryCards } from './SummaryCards';
import { AssetChart } from './AssetChart';
import { CashflowChart } from './CashflowChart';
import { YearTable } from './YearTable';

type ActiveTab = 'timeline' | 'charts' | 'table';

const TABS: Array<{ key: ActiveTab; icon: string; label: string; short: string }> = [
  { key: 'timeline', icon: '🗺️', label: '라이프 타임라인', short: '타임라인' },
  { key: 'charts', icon: '📊', label: '자산 · 현금흐름 차트', short: '차트' },
  { key: 'table', icon: '📋', label: '연도별 상세 데이터', short: '상세표' },
];

/** 우측(모바일에서는 하단) 결과 패널 */
export function ResultPanel() {
  const storeData = usePlannerStore((s) => ({
    settings: s.settings,
    assets: s.assets,
    incomes: s.incomes,
    housings: s.housings,
    loans: s.loans,
    expenses: s.expenses,
  }));

  const { rows, summary, start } = useSimulation();
  const [activeTab, setActiveTab] = useState<ActiveTab>('timeline');
  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(
    rows.length >= 5 ? 5 : rows.length >= 3 ? 3 : 1,
  );

  const handleSelectYear = (yearIndex: number) => {
    setSelectedYearIndex(yearIndex);
  };

  return (
    <div className="space-y-4">
      {/* 1. 언제 얼마나 모이는지: 핵심 시점별 가용 자금 & 순자산 로드맵 */}
      <MilestoneHorizonSummary
        rows={rows}
        start={start}
        selectedYearIndex={selectedYearIndex}
        onSelectYear={handleSelectYear}
      />

      {/* 2. 뷰 전환 세그먼트 컨트롤 */}
      <div className="sticky top-[4.75rem] z-20 -mx-1 px-1 sm:static sm:mx-0 sm:px-0">
        <div className="flex items-center gap-3">
          <div
            role="tablist"
            aria-label="결과 보기 방식"
            className="glass glass-strong flex flex-1 gap-0.5 rounded-2xl p-1 sm:flex-none"
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="segmented-item min-h-[2.5rem] px-3 text-[13px] sm:px-4"
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span className="sm:hidden">{tab.short}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <span className="ml-auto hidden text-xs font-medium text-ink-500 dark:text-slate-400 sm:block">
            총 {rows.length}개년 시뮬레이션
          </span>
        </div>
      </div>

      {/* 3. 활성화된 탭 내용 */}
      {activeTab === 'timeline' && (
        <TimelineView
          data={storeData}
          rows={rows}
          summary={summary}
          selectedYearIndex={selectedYearIndex}
          onSelectYear={handleSelectYear}
        />
      )}

      {activeTab === 'charts' && (
        <div className="space-y-4">
          <AssetChart rows={rows} start={start} />
          <CashflowChart rows={rows} />
        </div>
      )}

      {activeTab === 'table' && <YearTable rows={rows} />}

      {/* 4. 종합 재무 분석 카드 (누적 저축액, 수익률, 적자 전환 여부) */}
      <div className="pt-3">
        <h3 className="eyebrow mb-3 px-1">종합 재무 분석</h3>
        <SummaryCards
          summary={summary}
          years={storeData.settings.years}
          finalYear={rows[rows.length - 1].year}
          firstYear={rows[0]}
        />
      </div>

      <p className="px-1 pb-2 text-[11px] leading-relaxed text-ink-400 dark:text-slate-500">
        * 가정값 기반 추정치이며 실제 시장 수익률 및 세법 개정에 따라 차이가 발생할 수 있습니다.
      </p>
    </div>
  );
}
