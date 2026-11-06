import { useSimulation } from '@/hooks/useSimulation';
import { useUIStore } from '@/store/uiStore';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { formatKRWShort } from '@/utils/format';
import { IncomeSection } from '@/components/form/IncomeSection';
import { TaxRefundCard } from '@/components/result/TaxRefundCard';

export function IncomeView() {
  const { rows } = useSimulation();
  const setView = useUIStore((s) => s.setView);

  const firstYear = rows[0];
  const grossMonthly = firstYear ? firstYear.grossIncome / 12 : 0;
  const taxMonthly = firstYear ? firstYear.taxAndInsurance / 12 : 0;
  const netMonthly = firstYear ? firstYear.netIncome / 12 : 0;
  const refundMonthly = firstYear ? firstYear.taxRefund / 12 : 0;
  const taxRate = grossMonthly > 0 ? (taxMonthly / grossMonthly) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* 1. 수입 대시보드 요약 카드 */}
      <Card className="relative overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
                  <Icon name="banknote" className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold text-ink-600 dark:text-slate-400">
                  기준 월 소득 구조 (1년차 기준)
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-slate-100 sm:text-3xl tabular-nums">
                  {formatKRWShort(netMonthly)}원
                </span>
                <span className="text-xs font-medium text-ink-500 dark:text-slate-400">
                  / 월 실수령액 (세후)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setView('budget')}
                className="flex items-center gap-1.5 rounded-xl border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-brand-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span>지출·저축 계획 세우기</span>
                <Icon name="chevronRight" className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 수입/공제/세금 3단 분해 */}
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="rounded-xl border border-white/60 bg-white/60 p-3 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-slate-800/50">
              <p className="text-[11px] font-medium text-ink-500 dark:text-slate-400">월 세전 총소득</p>
              <p className="mt-0.5 text-base font-bold text-ink-900 dark:text-slate-100 tabular-nums">
                {formatKRWShort(grossMonthly)}원
              </p>
              <p className="text-[10px] text-ink-400 dark:text-slate-500">
                연 {formatKRWShort(firstYear ? firstYear.grossIncome : 0)}원
              </p>
            </div>

            <div className="rounded-xl border border-white/60 bg-white/60 p-3 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-slate-800/50">
              <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400">세금 및 4대보험 공제</p>
              <p className="mt-0.5 text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                -{formatKRWShort(taxMonthly)}원
              </p>
              <p className="text-[10px] text-rose-400/80 dark:text-rose-400/70">
                실효세율 {taxRate.toFixed(1)}%
              </p>
            </div>

            <div className="rounded-xl border border-white/60 bg-white/60 p-3 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-slate-800/50">
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">월 환산 연말정산 환급</p>
              <p className="mt-0.5 text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{formatKRWShort(refundMonthly)}원
              </p>
              <p className="text-[10px] text-emerald-500/80 dark:text-emerald-400/70">
                연 {formatKRWShort(firstYear ? firstYear.taxRefund : 0)}원 환급 추정
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. 연말정산 세액공제 카드 */}
      <TaxRefundCard />

      {/* 3. 소득 원천 및 인상률 상세 입력 */}
      <Card>
        <div className="p-4 sm:p-5">
          <IncomeSection />
        </div>
      </Card>
    </div>
  );
}
