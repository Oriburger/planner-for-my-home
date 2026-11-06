import { useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { usePlannerStore } from '@/store/plannerStore';
import { useSimulation } from '@/hooks/useSimulation';
import { incomeForYear, rentOnlyForYear } from '@/utils/simulation';
import { simulateLoanYear } from '@/utils/loan';
import { estimateTaxRefund, type TaxRefundItem } from '@/utils/taxRefund';
import { formatKRWShort } from '@/utils/format';

const KIND_LABEL: Record<TaxRefundItem['kind'], string> = {
  taxCredit: '세액공제',
  incomeDeduction: '소득공제',
};

/** 공제 항목 한 줄 */
function RefundRow({ item }: { item: TaxRefundItem }) {
  const blocked = item.saving <= 0;

  return (
    <li
      className={`rounded-xl border px-3 py-2.5 transition ${
        blocked
          ? 'border-white/40 bg-white/40 dark:border-white/5 dark:bg-slate-900/40'
          : 'border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={`truncate text-xs font-bold ${
              blocked
                ? 'text-ink-500 dark:text-slate-400'
                : 'text-ink-900 dark:text-slate-100'
            }`}
          >
            {item.label}
          </span>
          <span className="shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500 dark:bg-slate-800 dark:text-slate-400">
            {KIND_LABEL[item.kind]} {item.rate}%
          </span>
        </div>

        <span
          className={`shrink-0 text-sm font-bold tabular-nums ${
            blocked
              ? 'text-ink-400 dark:text-slate-500'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {blocked ? '—' : `+${formatKRWShort(item.saving)}원`}
        </span>
      </div>

      {blocked ? (
        <p className="mt-1 text-[11px] leading-relaxed text-ink-400 dark:text-slate-500">
          {item.blockedReason ?? item.note}
        </p>
      ) : (
        <p className="mt-1 text-[11px] leading-relaxed text-ink-500 dark:text-slate-400">
          납입 {formatKRWShort(item.paid)}원 → 공제대상{' '}
          {formatKRWShort(item.eligible)}원
          {item.kind === 'incomeDeduction'
            ? ` → 소득공제 ${formatKRWShort(item.deduction)}원`
            : ''}
        </p>
      )}
    </li>
  );
}

/**
 * 연말정산 환급 예상 카드.
 *
 * 1년차 입력값을 기준으로 저축·주거 공제를 항목별로 뜯어 보여준다.
 * 요건을 못 채운 항목도 남겨서 "왜 못 받는지"를 알 수 있게 한다.
 */
export function TaxRefundCard() {
  const settings = usePlannerStore((s) => s.settings);
  const assets = usePlannerStore((s) => s.assets);
  const incomes = usePlannerStore((s) => s.incomes);
  const housings = usePlannerStore((s) => s.housings);
  const loans = usePlannerStore((s) => s.loans);
  const updateSettings = usePlannerStore((s) => s.updateSettings);
  const { summary } = useSimulation();

  // 1년차 기준 입력값을 모아 환급을 계산한다.
  const result = useMemo(() => {
    const taxableGross = incomes
      .filter((i) => i.taxable)
      .reduce((sum, i) => sum + incomeForYear(i, 1), 0);

    const contributionOf = (type: string) =>
      assets
        .filter((a) => a.type === type && (a.startYear ?? 1) <= 1)
        .reduce((sum, a) => sum + a.monthlyContribution * 12, 0);

    return estimateTaxRefund({
      grossSalary: taxableGross,
      pensionPaid: contributionOf('pension'),
      housingSubscriptionPaid: contributionOf('housingSubscription'),
      rentPaid: housings.reduce((sum, h) => sum + rentOnlyForYear(h, 1), 0),
      rentLoanRepaid: loans
        .filter((l) => l.isDepositLinked && l.startYear <= 1)
        .reduce(
          (sum, l) =>
            sum +
            (l.monthlyPayment > 0
              ? l.monthlyPayment * 12
              : simulateLoanYear(l, 1, l.principal).payment),
          0,
        ),
      houselessHead: settings.houselessHead,
    });
  }, [assets, incomes, housings, loans, settings.houselessHead]);

  const monthlyEquivalent = result.totalSaving / 12;

  return (
    <Card>
      <CardHeader
        title="연말정산 환급 예상"
        description="1년차 입력값 기준 · 저축과 주거 공제로 덜 내는 세금"
        action={
          <button
            type="button"
            onClick={() =>
              updateSettings({ applyTaxRefund: !settings.applyTaxRefund })
            }
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              settings.applyTaxRefund
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-ink-100 text-ink-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {settings.applyTaxRefund ? '시뮬레이션 반영 중' : '반영 안 함'}
          </button>
        }
      />

      <div className="space-y-3 px-4 py-4 sm:px-5">
        {/* 합계 */}
        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-900/60 dark:from-emerald-950/40 dark:to-slate-900/60">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            올해 돌려받을 것으로 기대되는 세금
          </p>
          <p className="mt-1 break-keep text-2xl font-bold leading-tight text-emerald-700 dark:text-emerald-400 sm:text-3xl">
            {formatKRWShort(result.totalSaving)}원
          </p>
          <p className="mt-1.5 text-[11px] font-medium text-emerald-900/70 dark:text-emerald-300/80">
            월 {formatKRWShort(monthlyEquivalent)}원을 더 버는 효과 · 추정
            과세표준 {formatKRWShort(result.taxableBase)}원 · 한계세율{' '}
            {result.marginalRate}%
          </p>
        </div>

        {/* 남은 한도 */}
        {result.unusedRoom > 0 && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
            <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-300">
              <strong className="font-bold">
                한도 {formatKRWShort(result.unusedRoom)}원
              </strong>
              이 남아 있어요. 연금저축·IRP는 연 900만원, 주택청약은 연 300만원까지
              넣은 만큼 공제됩니다. 자동이체를 늘리면 환급도 같이 늘어납니다.
            </p>
          </div>
        )}

        {/* 항목별 내역 */}
        <ul className="space-y-2">
          {result.items.map((item) => (
            <RefundRow key={item.key} item={item} />
          ))}
        </ul>

        {settings.applyTaxRefund && (
          <p className="text-[11px] leading-relaxed text-ink-500 dark:text-slate-400">
            {settings.years}년 누적 환급 예상{' '}
            <strong className="font-semibold tabular-nums text-ink-800 dark:text-slate-200">
              {formatKRWShort(summary.totalTaxRefund)}원
            </strong>
            . 매년 저축액에 더해져 복리로 굴러갑니다.
          </p>
        )}

        <p className="text-[11px] leading-relaxed text-ink-400 dark:text-slate-500">
          * 2025년 귀속 기준 간이 추정입니다. 부양가족·의료비·기부금·신용카드
          공제는 사람마다 크게 달라 넣지 않았으므로 실제 환급액은 이보다 클 수
          있습니다. 연금저축 단독 한도는 연 600만원이고, 여기서는 IRP 합산 한도
          900만원으로 계산합니다. ISA는 세액공제 대상이 아니라 운용수익
          비과세·분리과세 혜택이라 이 목록에 없습니다.
        </p>
      </div>
    </Card>
  );
}
