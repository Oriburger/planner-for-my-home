import type {
  PlannerData,
  SimulationSummary,
  YearResult,
} from '@/types/planner';
import { formatKRWShort } from './format';
import { initialSnapshot } from './simulation';

const 만 = 10_000;
const 억 = 100_000_000;

export interface AssetMilestone {
  target: number;
  targetLabel: string;
  reachedYearIndex: number;
  reachedCalendarYear: number;
  reachedAge: number | null;
  netWorth: number;
}

export interface HorizonSnapshot {
  yearIndex: number;
  calendarYear: number;
  age: number | null;
  label: string;
  netWorth: number;
  liquidAssets: number;
  totalAssets: number;
  loanBalance: number;
  growthFromStart: number;
  annualSavings: number;
}

export interface TimelineEvent {
  id: string;
  yearIndex: number;
  calendarYear: number;
  age: number | null;
  category: 'milestone' | 'maturity' | 'housing' | 'loan' | 'income';
  title: string;
  description: string;
  badge: string;
  badgeColor: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate';
  amount?: number;
}

const MILESTONE_THRESHOLDS = [
  5000 * 만,
  1 * 억,
  2 * 억,
  3 * 억,
  4 * 억,
  5 * 억,
  7 * 억,
  10 * 억,
  15 * 억,
  20 * 억,
  30 * 억,
];

/**
 * 순자산 목표 돌파 시점(1억, 2억 등)을 계산한다.
 */
export function extractAssetMilestones(
  rows: YearResult[],
  startNetWorth: number,
): AssetMilestone[] {
  if (rows.length === 0) return [];

  const milestones: AssetMilestone[] = [];
  const achieved = new Set<number>();

  for (const row of rows) {
    for (const threshold of MILESTONE_THRESHOLDS) {
      if (threshold <= startNetWorth) continue; // 시작 시점에 이미 넘은 목표는 제외
      if (row.netWorth >= threshold && !achieved.has(threshold)) {
        achieved.add(threshold);
        milestones.push({
          target: threshold,
          targetLabel: formatKRWShort(threshold) + '원',
          reachedYearIndex: row.index,
          reachedCalendarYear: row.year,
          reachedAge: row.age,
          netWorth: row.netWorth,
        });
      }
    }
  }

  return milestones;
}

/**
 * "현재", "3년 뒤", "5년 뒤 (내 집 마련 목표 시점)", "최종 시점" 등
 * 유저가 직관적으로 비교할 수 있는 시점별 스냅샷을 생성한다.
 */
export function extractHorizonSnapshots(
  rows: YearResult[],
  start: { totalAssets: number; netWorth: number; year: number; age?: number | null },
): HorizonSnapshot[] {
  if (rows.length === 0) return [];

  const snapshots: HorizonSnapshot[] = [];

  // 1. 현재 시점
  snapshots.push({
    yearIndex: 0,
    calendarYear: start.year,
    age: start.age ?? null,
    label: '지금',
    netWorth: start.netWorth,
    liquidAssets: 0,
    totalAssets: start.totalAssets,
    loanBalance: start.totalAssets - start.netWorth,
    growthFromStart: 0,
    annualSavings: rows[0]?.annualSavings ?? 0,
  });

  // 타깃 인덱스: 3년차, 5년차, 마지막 연차
  const targetIndices = [3, 5, rows[rows.length - 1].index];
  const addedIndices = new Set<number>([0]);

  for (const targetIdx of targetIndices) {
    const row = rows.find((r) => r.index === targetIdx);
    if (!row || addedIndices.has(row.index)) continue;
    addedIndices.add(row.index);

    let label = `${row.index}년 후`;
    if (row.index === 3) label = '3년 후 (단기 목돈)';
    else if (row.index === 5) label = '5년 후 (내 집 마련)';
    else if (row.index === rows[rows.length - 1].index) {
      label = `${row.index}년 후 (최종)`;
    }

    snapshots.push({
      yearIndex: row.index,
      calendarYear: row.year,
      age: row.age,
      label,
      netWorth: row.netWorth,
      liquidAssets: row.liquidAssets,
      totalAssets: row.totalAssets,
      loanBalance: row.loanBalance,
      growthFromStart: row.netWorth - start.netWorth,
      annualSavings: row.annualSavings,
    });
  }

  return snapshots;
}

/**
 * 연도별로 발생하는 중요한 라이프/금융 이벤트를 시간 순서대로 모은다.
 */
export function extractTimelineEvents(
  data: PlannerData,
  rows: YearResult[],
  summary: SimulationSummary,
): TimelineEvent[] {
  if (rows.length === 0) return [];
  const events: TimelineEvent[] = [];

  // 1. 순자산 마일스톤 이벤트
  // 기준은 '지금' 순자산 — 1년차 중에 넘는 마일스톤도 잡는다
  const milestones = extractAssetMilestones(rows, initialSnapshot(data).netWorth);
  for (const m of milestones) {
    events.push({
      id: `milestone-${m.target}`,
      yearIndex: m.reachedYearIndex,
      calendarYear: m.reachedCalendarYear,
      age: m.reachedAge,
      category: 'milestone',
      title: `순자산 ${m.targetLabel} 달성`,
      description: `예상 순자산이 ${formatKRWShort(m.netWorth)}원에 도달합니다.`,
      badge: '목표 달성',
      badgeColor: 'emerald',
      amount: m.netWorth,
    });
  }

  // 2. ISA / 연금저축 만기 이벤트
  if (summary.pensionMaturities) {
    for (const p of summary.pensionMaturities) {
      events.push({
        id: `maturity-${p.assetId}-${p.maturityYearIndex}`,
        yearIndex: p.maturityYearIndex,
        calendarYear: p.maturityCalendarYear,
        age: p.maturityAge,
        category: 'maturity',
        title: `${p.assetName} 만기 / 수령`,
        description: `예상 만기 금액 ${formatKRWShort(p.estimatedAmountAtMaturity)}원${
          p.convertedToLiquid ? ' (유동 현금으로 전환)' : ''
        }`,
        badge: '만기 도래',
        badgeColor: 'blue',
        amount: p.estimatedAmountAtMaturity,
      });
    }
  }

  // 3. 대출 이벤트 (거치 종료, 완납)
  for (const loan of data.loans) {
    // 거치 종료
    if (loan.graceYears && loan.graceYears > 0) {
      // 거치는 (startYear + grace - 1)년차의 끝에 끝나고 다음 해부터 원금 상환
      const graceEndIndex = loan.startYear + loan.graceYears - 1;
      const targetRow = rows.find((r) => r.index === graceEndIndex);
      if (targetRow) {
        events.push({
          id: `loan-grace-${loan.id}`,
          yearIndex: graceEndIndex,
          calendarYear: targetRow.year,
          age: targetRow.age,
          category: 'loan',
          title: `${loan.name} 거치기간 종료`,
          description: `원금 상환이 시작되어 월 상환 부담이 늘어납니다.`,
          badge: '상환 전환',
          badgeColor: 'amber',
        });
      }
    }

    // 대출 완납
    const payoffIndex = loan.startYear + loan.termYears - 1;
    const payoffRow = rows.find((r) => r.index === payoffIndex);
    if (payoffRow && !loan.autoRenew) {
      const isDeposit = loan.isDepositLinked ?? false;
      events.push({
        id: `loan-payoff-${loan.id}`,
        yearIndex: payoffIndex,
        calendarYear: payoffRow.year,
        age: payoffRow.age,
        category: 'loan',
        title: isDeposit ? `${loan.name} 완납 (보증금 차감 상환)` : `${loan.name} 완납`,
        description: isDeposit
          ? `보증금에서 대출 원금 ${formatKRWShort(loan.principal)}원이 자동 차감·상환되었습니다. (내 유동 현금 지출 없음)`
          : `대출 원리금 상환이 종료되어 매월 잉여 자금이 증가합니다.`,
        badge: isDeposit ? '보증금 상환' : '대출 완납',
        badgeColor: 'emerald',
      });
    }
  }

  // 4. 주거 이벤트 (전세 2년 갱신 주기 알림 등)
  for (const housing of data.housings) {
    if (housing.type === 'jeonse') {
      // h년차에 시작한 계약은 (h-1)년 후에 시작 → 2년 뒤인 (h+1)년차 끝에 갱신
      for (let y = housing.startYear + 1; y <= data.settings.years; y += 2) {
        const row = rows.find((r) => r.index === y);
        if (row && (housing.endYear === null || y <= housing.endYear)) {
          events.push({
            id: `housing-renewal-${housing.id}-${y}`,
            yearIndex: y,
            calendarYear: row.year,
            age: row.age,
            category: 'housing',
            title: `${housing.name} 갱신 / 이사 검토`,
            description: `전세 계약 2년 주기 만기. 보증금 증액 또는 이사 여부를 결정하는 시점입니다.`,
            badge: '주거 갱신',
            badgeColor: 'purple',
            amount: housing.deposit,
          });
        }
      }
    }
  }

  // 5. 연도순, 카테고리순 정렬
  return events.sort((a, b) => {
    if (a.yearIndex !== b.yearIndex) return a.yearIndex - b.yearIndex;
    return a.id.localeCompare(b.id);
  });
}
