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
        title="연말정산 절세 혜택"
        description="1년차 저축·주거 공제 예상 혜택"
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
            올해 예상 환급액
          </p>
          <p className="mt-1 break-keep text-2xl font-bold leading-tight text-emerald-700 dark:text-emerald-400 sm:text-3xl">
            {formatKRWShort(result.totalSaving)}원
          </p>
          <p className="mt-1.5 break-keep text-[11px] font-medium text-emerald-900/70 dark:text-emerald-300/80">
            월 약 {formatKRWShort(monthlyEquivalent)}원 추가 소득 효과 (과세표준 {formatKRWShort(result.taxableBase)}원 기준)
          </p>
        </div>

        {/* 남은 한도 */}
        {result.unusedRoom > 0 && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
            <p className="break-keep text-[11px] leading-relaxed text-amber-900 dark:text-amber-300">
              <strong className="font-bold">
                공제 한도 {formatKRWShort(result.unusedRoom)}원 남음
              </strong>
              {' '}(연금·IRP 연 900만, 청약 연 300만원 한도 내 추가 공제 가능)
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
          <p className="break-keep text-[11px] leading-relaxed text-ink-500 dark:text-slate-400">
            {settings.years}년 누적 절세액{' '}
            <strong className="font-semibold tabular-nums text-ink-800 dark:text-slate-200">
              {formatKRWShort(summary.totalTaxRefund)}원
            </strong>
            . 매년 저축액에 더해져 복리로 굴러갑니다.
          </p>
        )}

        <details className="text-[11px] text-ink-400 dark:text-slate-500">
          <summary className="cursor-pointer font-medium hover:text-ink-600 dark:hover:text-slate-400">
            * 2025년 귀속 세법 기준 간이 추정 (상세 기준 안내 ▾)
          </summary>
          <p className="mt-1 pl-2 break-keep leading-relaxed">
            부양가족·의료비·신용카드 공제 등은 제외된 기본 추정치입니다. 연금저축·IRP 합산 최대 900만원, 청약 최대 300만원, 전세대출(주택임차차입금) 원리금 상환액 40% 공제가 반영됩니다.
          </p>
        </details>
      </div>
    </Card>
  );
}
