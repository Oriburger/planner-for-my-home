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

      {/* 2. 뷰 전환 탭 (타임라인 / 차트 / 상세표) */}
      <div className="flex items-center justify-between border-b border-ink-200 pb-1 dark:border-slate-800">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === 'timeline'
                ? 'bg-brand-600 text-white shadow-xs dark:bg-brand-500'
                : 'text-ink-600 hover:bg-ink-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <span>🗺️</span> 라이프 타임라인
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === 'charts'
                ? 'bg-brand-600 text-white shadow-xs dark:bg-brand-500'
                : 'text-ink-600 hover:bg-ink-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <span>📊</span> 자산 & 현금흐름 차트
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === 'table'
                ? 'bg-brand-600 text-white shadow-xs dark:bg-brand-500'
                : 'text-ink-600 hover:bg-ink-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <span>📋</span> 연도별 상세 데이터
          </button>
        </div>

        <span className="hidden text-xs text-ink-500 dark:text-slate-400 sm:inline">
          총 {rows.length}개년 시뮬레이션
        </span>
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
      <div className="pt-2">
        <h4 className="mb-2 text-xs font-bold text-ink-500 dark:text-slate-400 px-1">
          종합 재무 성향 및 위험도 분석
        </h4>
        <SummaryCards
          summary={summary}
          years={storeData.settings.years}
          finalYear={rows[rows.length - 1].year}
          firstYear={rows[0]}
        />
      </div>

      <p className="px-1 pb-2 text-[11px] text-ink-400 dark:text-slate-500">
        * 가정값 기반 추정치이며 실제 시장 수익률 및 세법 개정에 따라 차이가 발생할 수 있습니다.
      </p>
    </div>
  );
}
