import { useMemo } from 'react';
import type { AssetItem, SimulationResult, YearResult } from '@/types/planner';
import { ASSET_TYPE_LABEL } from '@/types/planner';
import { Card, CardHeader } from '@/components/ui/Card';
import { usePlannerStore } from '@/store/plannerStore';
import { isContributionActive } from '@/utils/simulation';
import { formatKRWShort } from '@/utils/format';

/* ------------------------------------------------------------------ */
/* 색 배정 — 고정 슬롯. 값은 항상 숫자/라벨과 함께 보여 색만으로 읽지 않게 한다. */
/* ------------------------------------------------------------------ */

const FLOW_COLORS = {
  living: '#eb6834', // 생활비 (orange)
  housing: '#eda100', // 주거비 (yellow)
  loan: '#d03b3b', // 대출 상환 (red — 부채)
  contribution: '#2a78d6', // 자동이체 (blue — 저축)
  leftover: '#1baf7a', // 남는 돈 (aqua)
} as const;

interface FlowSlice {
  key: keyof typeof FLOW_COLORS;
  label: string;
  monthly: number;
  hint: string;
}

/** 월 기준 비중 바 한 칸 */
function ShareBar({ slices, total }: { slices: FlowSlice[]; total: number }) {
  if (total <= 0) return null;

  return (
    <div
      className="flex h-3 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-slate-800"
      role="img"
      aria-label={slices
        .map(
          (s) =>
            `${s.label} ${Math.round((s.monthly / total) * 100)}퍼센트`,
        )
        .join(', ')}
    >
      {slices.map((slice) => {
        const pct = (slice.monthly / total) * 100;
        if (pct <= 0) return null;
        return (
          <span
            key={slice.key}
            style={{ width: `${pct}%`, backgroundColor: FLOW_COLORS[slice.key] }}
            title={`${slice.label} ${formatKRWShort(slice.monthly)}원`}
          />
        );
      })}
    </div>
  );
}

/** 돈이 어디로 가는지 한 줄 */
function FlowRow({ slice, total }: { slice: FlowSlice; total: number }) {
  const pct = total > 0 ? (slice.monthly / total) * 100 : 0;

  return (
    <li className="flex items-start gap-2.5">
      <span
        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: FLOW_COLORS[slice.key] }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-xs font-bold text-ink-800 dark:text-slate-200">
            {slice.label}
          </span>
          <span className="shrink-0 text-xs font-bold tabular-nums text-ink-900 dark:text-slate-100">
            {formatKRWShort(slice.monthly)}원
            <span className="ml-1 font-semibold text-ink-400 dark:text-slate-500">
              {pct.toFixed(0)}%
            </span>
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-400 dark:text-slate-500">
          {slice.hint}
        </p>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */

interface AccountRow {
  asset: AssetItem;
  balance: number;
  monthlyContribution: number;
  contributing: boolean;
}

/** 통장(계좌) 한 장 */
function AccountCard({
  row,
  maxBalance,
  taxDeductible,
}: {
  row: AccountRow;
  maxBalance: number;
  taxDeductible: boolean;
}) {
  const { asset, balance, monthlyContribution, contributing } = row;
  const pct = maxBalance > 0 ? (balance / maxBalance) * 100 : 0;

  return (
    <div className="rounded-xl border border-white/50 bg-white/50 px-3 py-2.5 dark:border-white/5 dark:bg-slate-900/50">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs font-bold text-ink-900 dark:text-slate-100">
          {asset.name || ASSET_TYPE_LABEL[asset.type]}
        </span>
        <span className="shrink-0 text-xs font-bold tabular-nums text-ink-900 dark:text-slate-100">
          {formatKRWShort(balance)}원
        </span>
      </div>

      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-slate-800"
        aria-hidden="true"
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${Math.max(pct, balance > 0 ? 2 : 0)}%`,
            backgroundColor: asset.liquid
              ? FLOW_COLORS.leftover
              : FLOW_COLORS.contribution,
          }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500 dark:bg-slate-800 dark:text-slate-400">
          {ASSET_TYPE_LABEL[asset.type]}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
            asset.liquid
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
          }`}
        >
          {asset.liquid ? '바로 인출' : '묶인 돈'}
        </span>
        <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500 dark:bg-slate-800 dark:text-slate-400">
          연 {asset.annualReturnRate}%
        </span>
        {taxDeductible && (
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            세액공제
          </span>
        )}
      </div>

      <p className="mt-1.5 text-[11px] font-medium text-ink-500 dark:text-slate-400">
        {monthlyContribution > 0 ? (
          contributing ? (
            <>
              매달{' '}
              <strong className="font-bold text-brand-700 dark:text-brand-400">
                {formatKRWShort(monthlyContribution)}원
              </strong>{' '}
              자동이체
            </>
          ) : (
            <span className="text-ink-400 dark:text-slate-500">
              이 해에는 자동이체가 멈춤 (시작 전이거나 만기)
            </span>
          )
        ) : (
          <span className="text-ink-400 dark:text-slate-500">자동이체 없음</span>
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** 자동이체가 세액·소득공제로 이어지는 자산 유형 */
const DEDUCTIBLE_TYPES = ['pension', 'housingSubscription'];

interface MoneyFlowViewProps {
  rows: YearResult[];
  assetBalances: SimulationResult['assetBalances'];
  selectedYearIndex: number;
}

/**
 * 한 달치 돈이 어디로 흘러가는지, 통장별로 지금 얼마가 있고
 * 자동이체가 어디로 빠지는지를 한 화면에서 보여준다.
 */
export function MoneyFlowView({
  rows,
  assetBalances,
  selectedYearIndex,
}: MoneyFlowViewProps) {
  const assets = usePlannerStore((s) => s.assets);
  const currentAge = usePlannerStore((s) => s.settings.currentAge);

  const yearIndex = Math.min(Math.max(1, selectedYearIndex), rows.length);
  const row = rows[yearIndex - 1];

  const accounts: AccountRow[] = useMemo(() => {
    const balances = assetBalances.get(yearIndex);
    return assets
      .map((asset) => ({
        asset,
        balance: balances?.get(asset.id) ?? 0,
        monthlyContribution: asset.monthlyContribution,
        contributing: isContributionActive(asset, yearIndex, currentAge),
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [assets, assetBalances, yearIndex, currentAge]);

  const maxBalance = accounts.reduce((m, a) => Math.max(m, a.balance), 0);

  // 월 기준으로 환산해서 보여준다 (연간값 / 12)
  const monthly = (annual: number) => annual / 12;

  // 그 해에 실제로 남은 돈. contributionBalance 는 지난 해까지 쌓인 잔액까지
  // 포함한 누적치라 '이번 달 흐름'으로 쓰면 수입보다 커진다.
  const yearFlow = row.annualSavings - row.contribution;
  const leftover = Math.max(0, yearFlow);
  /** 그 해 수입만으로는 모자라 여유자금에서 꺼내 쓰는 금액 */
  const drawdown = Math.max(0, -yearFlow);
  /** 쌓인 여유자금까지 바닥난 상태 */
  const shortfall = Math.max(0, -row.contributionBalance);

  const slices: FlowSlice[] = [
    {
      key: 'living',
      label: '생활비',
      monthly: monthly(row.livingExpense),
      hint: '식비 · 교통 · 통신 등 월 고정 지출',
    },
    {
      key: 'housing',
      label: '주거비',
      monthly: monthly(row.housingCost),
      hint: '월세 + 관리비 (보증금 제외)',
    },
    {
      key: 'loan',
      label: '대출 상환',
      monthly: monthly(row.loanPayment),
      hint: '원금 + 이자',
    },
    {
      key: 'contribution',
      label: '자동이체 (저축)',
      monthly: monthly(row.contribution),
      hint: `${accounts.filter((a) => a.contributing).length}개 계좌로 빠져나감`,
    },
    {
      key: 'leftover',
      label: '남는 돈',
      monthly: monthly(leftover),
      hint:
        drawdown > 0
          ? '이 해엔 남는 돈이 없어요'
          : '여유자금으로 쌓여 수익률만큼 굴러감',
    },
  ];

  const outflowTotal = slices.reduce((sum, s) => sum + s.monthly, 0);
  const contributingAccounts = accounts.filter(
    (a) => a.contributing && a.monthlyContribution > 0,
  );
  const contributionTotal = contributingAccounts.reduce(
    (sum, a) => sum + a.monthlyContribution,
    0,
  );

  return (
    <div className="space-y-4">
      {/* 1. 들어오는 돈 */}
      <Card>
        <CardHeader
          title="한 달 돈의 흐름"
          description={`${row.year}년 (${yearIndex}년차) 기준 · 월 단위로 환산`}
        />

        <div className="space-y-4 px-4 py-4 sm:px-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              {
                label: '세전 월급',
                value: monthly(row.grossIncome),
                tone: 'text-ink-900 dark:text-slate-100',
              },
              {
                label: '세금 · 4대보험',
                value: -monthly(row.taxAndInsurance),
                tone: 'text-rose-600 dark:text-rose-400',
              },
              {
                label: '연말정산 환급',
                value: monthly(row.taxRefund),
                tone: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                label: '실제 쓸 수 있는 돈',
                value: monthly(row.netIncome + row.taxRefund),
                tone: 'text-brand-700 dark:text-brand-400',
              },
            ].map((tile) => (
              <div
                key={tile.label}
                className="rounded-xl border border-white/50 bg-white/50 px-3 py-2.5 dark:border-white/5 dark:bg-slate-900/50"
              >
                <p className="text-[11px] font-semibold text-ink-500 dark:text-slate-400">
                  {tile.label}
                </p>
                <p
                  className={`mt-1 break-keep text-sm font-bold leading-tight tabular-nums ${tile.tone}`}
                >
                  {tile.value < 0 ? '-' : ''}
                  {formatKRWShort(Math.abs(tile.value))}원
                </p>
              </div>
            ))}
          </div>

          <ShareBar slices={slices} total={outflowTotal} />

          <ul className="space-y-2.5">
            {slices.map((slice) => (
              <FlowRow key={slice.key} slice={slice} total={outflowTotal} />
            ))}
          </ul>

          {drawdown > 0 && (
            <p className="rounded-xl bg-amber-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              이 해에는 수입만으로 모자라 매달{' '}
              <strong className="font-bold">
                {formatKRWShort(monthly(drawdown))}원
              </strong>
              씩 그동안 쌓아둔 여유자금에서 꺼내 씁니다.
            </p>
          )}

          {shortfall > 0 && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 px-3 py-2.5 text-[11px] leading-relaxed text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
            >
              쌓아둔 여유자금까지 바닥나서{' '}
              <strong className="font-bold">
                {formatKRWShort(shortfall)}원
              </strong>{' '}
              모자랍니다. 자동이체를 줄이거나 지출을 조정해 주세요.
            </p>
          )}
        </div>
      </Card>

      {/* 2. 자동이체 흐름 */}
      <Card>
        <CardHeader
          title="자동이체가 가는 곳"
          description={
            contributionTotal > 0
              ? `매달 ${formatKRWShort(contributionTotal)}원이 ${
                  contributingAccounts.length
                }개 계좌로 나뉘어 들어갑니다.`
              : '아직 설정된 자동이체가 없어요.'
          }
        />

        <div className="px-4 py-4 sm:px-5">
          {contributingAccounts.length === 0 ? (
            <p className="text-xs leading-relaxed text-ink-500 dark:text-slate-400">
              자산 항목의 &lsquo;월 자동이체&rsquo;를 채우면 매달 어느 통장으로
              얼마가 빠지는지 여기에 표시됩니다. 연금저축·IRP와 주택청약은
              자동이체를 늘릴수록 연말정산 환급도 함께 늘어납니다.
            </p>
          ) : (
            <ul className="space-y-3">
              {contributingAccounts.map((account) => {
                const pct =
                  contributionTotal > 0
                    ? (account.monthlyContribution / contributionTotal) * 100
                    : 0;
                const deductible = DEDUCTIBLE_TYPES.includes(
                  account.asset.type,
                );

                return (
                  <li key={account.asset.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="text-ink-300 dark:text-slate-600"
                        >
                          →
                        </span>
                        <span className="truncate text-xs font-bold text-ink-800 dark:text-slate-200">
                          {account.asset.name ||
                            ASSET_TYPE_LABEL[account.asset.type]}
                        </span>
                        {deductible && (
                          <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                            공제
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs font-bold tabular-nums text-ink-900 dark:text-slate-100">
                        {formatKRWShort(account.monthlyContribution)}원
                        <span className="ml-1 font-semibold text-ink-400 dark:text-slate-500">
                          {pct.toFixed(0)}%
                        </span>
                      </span>
                    </div>
                    <div
                      className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-slate-800"
                      aria-hidden="true"
                    >
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          backgroundColor: FLOW_COLORS.contribution,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      {/* 3. 통장 현황 */}
      <Card>
        <CardHeader
          title="통장 현황"
          description={`${row.year}년 말 기준 계좌별 잔액`}
        />

        <div className="px-4 py-4 sm:px-5">
          {accounts.length === 0 ? (
            <p className="text-xs text-ink-500 dark:text-slate-400">
              자산 항목을 추가하면 통장별 잔액이 표시됩니다.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {accounts.map((account) => (
                  <AccountCard
                    key={account.asset.id}
                    row={account}
                    maxBalance={maxBalance}
                    taxDeductible={DEDUCTIBLE_TYPES.includes(
                      account.asset.type,
                    )}
                  />
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-white/50 bg-white/50 px-3 py-2.5 dark:border-white/5 dark:bg-slate-900/50">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-ink-800 dark:text-slate-200">
                    여유자금 (어느 통장에도 안 넣은 돈)
                  </span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-ink-900 dark:text-slate-100">
                    {formatKRWShort(row.contributionBalance)}원
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-400 dark:text-slate-500">
                  매년 남은 저축액이 쌓이는 자리입니다. 여기 있는 돈도 설정한
                  여유자금 수익률만큼 굴러갑니다.
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
