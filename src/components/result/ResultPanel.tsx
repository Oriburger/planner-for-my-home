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

/** 우측(모바일에서는 하단) 결과 패널 (Liquid Glass) */
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

      {/* 2. 뷰 전환 Liquid Glass Segmented Control */}
      <div className="flex flex-col gap-2 border-b border-white/40 pb-2 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-2xl border border-white/70 bg-white/60 p-1 shadow-glass-sm backdrop-blur-xl ring-1 ring-inset ring-white/30 dark:border-white/10 dark:bg-slate-900/60 dark:ring-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
              activeTab === 'timeline'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
                : 'text-ink-600 hover:text-ink-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>🗺️</span> 라이프 타임라인
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
              activeTab === 'charts'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
                : 'text-ink-600 hover:text-ink-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>📊</span> 자산 & 현금흐름 차트
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
              activeTab === 'table'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
                : 'text-ink-600 hover:text-ink-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>📋</span> 연도별 상세 데이터
          </button>
        </div>

        <span className="text-xs font-medium text-ink-500 dark:text-slate-400">
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
        <h4 className="mb-2.5 px-1 text-xs font-bold text-ink-500 dark:text-slate-400">
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
