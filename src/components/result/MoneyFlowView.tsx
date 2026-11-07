import { useMemo } from 'react';
import type { AssetItem, SimulationResult, YearResult } from '@/types/planner';
import { ASSET_TYPE_LABEL, type AssetType } from '@/types/planner';
import { Card, CardHeader } from '@/components/ui/Card';
import { MoneyInput } from '@/components/ui/Fields';
import { Icon } from '@/components/ui/Icon';
import { usePlannerStore } from '@/store/plannerStore';
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

const ASSET_TYPE_OPTIONS = (Object.keys(ASSET_TYPE_LABEL) as AssetType[]).map(
  (value) => ({ value, label: ASSET_TYPE_LABEL[value] }),
);

/** 통장(계좌) 한 장 — 이름·분류·잔액·자동이체액을 바로 수정할 수 있다 */
function AccountCard({
  row,
  maxBalance,
  taxDeductible,
}: {
  row: AccountRow;
  maxBalance: number;
  taxDeductible: boolean;
}) {
  const { asset, balance } = row;
  const updateAsset = usePlannerStore((s) => s.updateAsset);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const pct = maxBalance > 0 ? (balance / maxBalance) * 100 : 0;

  return (
    <div className="glass-tile rounded-2xl p-3.5">
      <div className="flex items-center justify-between gap-1.5">
        <input
          type="text"
          value={asset.name}
          onChange={(e) => updateAsset(asset.id, { name: e.target.value })}
          placeholder="계좌 이름 입력"
          aria-label="계좌 이름"
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-xs font-bold text-ink-900 transition hover:border-ink-900/15 hover:bg-white/80 focus:border-brand-500 focus:bg-white focus:outline-none dark:text-slate-100 dark:hover:border-white/15 dark:hover:bg-slate-900/60 dark:focus:bg-slate-900"
        />
        <select
          value={asset.type}
          onChange={(e) => updateAsset(asset.id, { type: e.target.value as AssetType })}
          aria-label="계좌 분류"
          className="shrink-0 cursor-pointer rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-700 focus:outline-none dark:bg-slate-800 dark:text-slate-300"
        >
          {ASSET_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => removeItem('assets', asset.id)}
          className="btn-icon h-6 w-6 text-ink-400 hover:text-rose-600 dark:text-slate-500"
          title="삭제"
          aria-label="계좌 삭제"
        >
          <Icon name="trash" className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-slate-800"
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

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div>
          <span className="mb-1 block text-[10px] font-medium text-ink-500 dark:text-slate-400">
            현재 잔액
          </span>
          <MoneyInput
            value={asset.amount}
            onChange={(amount) => updateAsset(asset.id, { amount })}
          />
        </div>
        <div>
          <span className="mb-1 block text-[10px] font-medium text-ink-500 dark:text-slate-400">
            월 자동이체
          </span>
          <MoneyInput
            value={asset.monthlyContribution}
            onChange={(monthlyContribution) =>
              updateAsset(asset.id, { monthlyContribution })
            }
          />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => updateAsset(asset.id, { liquid: !asset.liquid })}
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
            asset.liquid
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
          }`}
          title="클릭하여 입출금 가능 여부 전환"
        >
          {asset.liquid ? '입출금 가능' : '묶인 돈'}
        </button>
        <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600 dark:bg-slate-800 dark:text-slate-400">
          연 {asset.annualReturnRate}%
        </span>
        {taxDeductible && (
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            세액공제
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** 자동이체가 세액·소득공제로 이어지는 자산 유형 */
const DEDUCTIBLE_TYPES = ['pension', 'housingSubscription'];

interface MoneyFlowViewProps {
  rows: YearResult[];
  assetBalances?: SimulationResult['assetBalances'];
  selectedYearIndex?: number;
}

/**
 * 한 달치 돈이 어디로 흘러가는지, 통장별로 '현재' 얼마가 있고
 * 자동이체가 어디로 빠지는지를 '현재 시점'만 기준으로 보여준다.
 */
export function MoneyFlowView({ rows }: MoneyFlowViewProps) {
  const addAsset = usePlannerStore((s) => s.addAsset);
  const assets = usePlannerStore((s) => s.assets);
  const loans = usePlannerStore((s) => s.loans);

  // '통장' 부분은 무조건 '현재(지금 / 1년차)' 시점만 본다. (사용자 요청 2 반영)
  const row = rows[0] ?? {
    grossIncome: 0,
    taxAndInsurance: 0,
    netIncome: 0,
    livingExpense: 0,
    housingCost: 0,
    loanPayment: 0,
    contribution: 0,
    annualSavings: 0,
    contributionBalance: 0,
    year: new Date().getFullYear(),
  };

  const accounts: AccountRow[] = useMemo(() => {
    // 미래 시뮬레이션 잔액이 아닌, '현재 실제 보유 잔액'을 사용한다.
    return assets
      .map((asset) => ({
        asset,
        balance: asset.amount,
        monthlyContribution: asset.monthlyContribution,
        contributing: asset.monthlyContribution > 0,
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [assets]);

  const maxBalance = accounts.reduce((m, a) => Math.max(m, a.balance), 0);

  // 월 기준으로 환산해서 보여준다 (연간값 / 12)
  const monthly = (annual: number) => annual / 12;

  const yearFlow = row.annualSavings - row.contribution;
  const leftover = Math.max(0, yearFlow);
  const drawdown = Math.max(0, -yearFlow);
  const shortfall = Math.max(0, -row.contributionBalance);

  const hasDepositLinkedLoan = loans.some((l) => l.isDepositLinked);
  const allLoansDepositLinked =
    loans.length > 0 && loans.every((l) => l.isDepositLinked);
  const loanHint = allLoansDepositLinked
    ? '이자만 납부 (원금은 만기 시 보증금에서 상환)'
    : hasDepositLinkedLoan
      ? '원금 + 이자 (전세대출은 이자만)'
      : '원금 + 이자';

  const slices: FlowSlice[] = [
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
      hint: loanHint,
    },
    {
      key: 'living',
      label: '생활비',
      monthly: monthly(row.livingExpense),
      hint: '식비·교통·통신 등 고정 생활비',
    },
    {
      key: 'contribution',
      label: '자동이체 (저축)',
      monthly: monthly(row.contribution),
      hint: `${accounts.filter((a) => a.contributing).length}개 계좌로 이체`,
    },
    {
      key: 'leftover',
      label: '남는 돈',
      monthly: monthly(leftover),
      hint:
        drawdown > 0
          ? '현재 남는 돈이 없어요'
          : '비상금 파킹통장 자동 적립',
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
          title="월 현금흐름"
          description="월 소득에서 지출과 저축으로 배분되는 흐름"
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
                label: '연말정산 절세(월 환산)',
                value: monthly(row.taxRefund),
                tone: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                label: '실수령액',
                value: monthly(row.netIncome),
                tone: 'text-brand-700 dark:text-brand-400',
              },
            ].map((tile) => (
              <div
                key={tile.label}
                className="glass-tile rounded-2xl p-3"
              >
                <p className="break-keep text-[11px] font-semibold text-ink-500 dark:text-slate-400">
                  {tile.label}
                </p>
                <p
                  className={`mt-1 text-sm font-extrabold tabular-nums sm:text-base ${tile.tone}`}
                >
                  {tile.value < 0 ? '-' : ''}
                  {formatKRWShort(Math.abs(tile.value))}원
                </p>
              </div>
            ))}
          </div>

          <ShareBar slices={slices} total={outflowTotal} />

          <ul className="space-y-2 border-t border-ink-100 pt-3 dark:border-white/5">
            {slices.map((slice) => (
              <FlowRow key={slice.key} slice={slice} total={outflowTotal} />
            ))}
          </ul>

          {shortfall > 0 && (
            <p
              role="alert"
              className="break-keep rounded-xl bg-rose-50 px-3 py-2.5 text-[11px] leading-relaxed text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
            >
              현재 자동이체와 지출의 합이 소득을 초과하여{' '}
              <strong className="font-bold">
                {formatKRWShort(shortfall)}원
              </strong>{' '}
              모자랍니다.
            </p>
          )}
        </div>
      </Card>

      {/* 2. 자동이체 흐름 */}
      <Card>
        <CardHeader
          title="자동이체가 나가는 통장들"
          description={
            contributionTotal > 0
              ? `매달 총 ${formatKRWShort(contributionTotal)}원이 ${
                  contributingAccounts.length
                }개 통장으로 자동이체됩니다.`
              : '현재 설정된 자동이체가 없어요.'
          }
        />

        <div className="px-4 py-4 sm:px-5">
          {contributingAccounts.length === 0 ? (
            <p className="text-xs leading-relaxed text-ink-500 dark:text-slate-400">
              계획 탭이나 자산 항목에서 &lsquo;월 자동이체&rsquo;를 설정하면
              매달 어느 통장으로 얼마가 빠지는지 여기에 표시됩니다.
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

      {/* 3. 보유 계좌 잔액 */}
      <Card>
        <CardHeader
          title="보유 계좌 잔액"
          description="계좌별 이름 · 분류 · 잔액 · 자동이체 현황 직접 편집"
          action={
            <button
              type="button"
              onClick={() =>
                addAsset({
                  type: 'cash',
                  name: '새 계좌',
                  annualReturnRate: 2.5,
                  liquid: true,
                })
              }
              className="flex items-center gap-1 rounded-xl border border-emerald-300/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-xs transition hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/80 dark:text-emerald-300"
            >
              <Icon name="plus" className="h-3.5 w-3.5" />
              <span>계좌 추가</span>
            </button>
          }
        />

        <div className="px-4 py-4 sm:px-5">
          {accounts.length === 0 ? (
            <p className="text-xs text-ink-500 dark:text-slate-400">
              등록된 통장/자산 항목이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
          )}
        </div>
      </Card>
    </div>
  );
}
