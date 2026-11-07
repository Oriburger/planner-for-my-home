import { usePlannerStore } from '@/store/plannerStore';
import { REPAYMENT_TYPE_LABEL, type RepaymentType } from '@/types/planner';
import { Accordion } from '@/components/ui/Accordion';
import { AddItemButton, EmptyState, ItemCard } from '@/components/ui/ItemCard';
import {
  CountInput,
  Field,
  MoneyInput,
  PercentInput,
  Select,
  MemoField,
  TextInput,
  Toggle,
} from '@/components/ui/Fields';
import { formatKRWShort } from '@/utils/format';
import { currentYear } from '@/utils/time';
import { estimateMonthlyLoanPayment } from '@/utils/loan';

const TYPE_OPTIONS = (
  Object.keys(REPAYMENT_TYPE_LABEL) as RepaymentType[]
).map((value) => ({ value, label: REPAYMENT_TYPE_LABEL[value] }));

export function LoanSection() {
  const loans = usePlannerStore((s) => s.loans);
  const addLoan = usePlannerStore((s) => s.addLoan);
  const updateLoan = usePlannerStore((s) => s.updateLoan);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const duplicateItem = usePlannerStore((s) => s.duplicateItem);

  const totalPrincipal = loans.reduce((sum, l) => sum + l.principal, 0);

  return (
    <Accordion
      title="대출"
      summary={`${loans.length}건 · 잔액 ${formatKRWShort(totalPrincipal)}원`}
      icon="landmark"
    >
      {loans.length === 0 && <EmptyState message="대출이 없다면 비워두세요." />}

      {loans.map((loan) => {
        const graceYears = loan.graceYears ?? 0;
        const estimatedMonthly = estimateMonthlyLoanPayment(loan);

        return (
          <ItemCard
            key={loan.id}
            title={
              <TextInput
                value={loan.name}
                onChange={(name) => updateLoan(loan.id, { name })}
                placeholder="대출 이름"
              />
            }
            onRemove={() => removeItem('loans', loan.id)}
            onDuplicate={() => duplicateItem('loans', loan.id)}
          >
            <div className="grid grid-cols-2 gap-2">
              <Field label="상환 방식" className="col-span-2">
                <Select
                  value={loan.repaymentType}
                  onChange={(repaymentType) =>
                    updateLoan(loan.id, { repaymentType })
                  }
                  options={TYPE_OPTIONS}
                />
              </Field>

              <Field label="대출 원금">
                <MoneyInput
                  value={loan.principal}
                  onChange={(principal) => updateLoan(loan.id, { principal })}
                />
              </Field>

              <Field label="연 이자율">
                <PercentInput
                  value={loan.annualRate}
                  onChange={(annualRate) => updateLoan(loan.id, { annualRate })}
                  min={0}
                  max={30}
                />
              </Field>

              <Field label="완납 시점" hint={`총 ${loan.termYears}년`}>
                <CountInput
                  value={loan.startYear + loan.termYears - 1}
                  onChange={(endYear) =>
                    updateLoan(loan.id, {
                      termYears: Math.max(1, endYear - loan.startYear + 1),
                    })
                  }
                  min={loan.startYear}
                  max={40}
                  suffix="년 후"
                />
              </Field>

              <Field label="거치 기간" hint="이자만 내는 기간">
                <CountInput
                  value={graceYears}
                  onChange={(g) =>
                    updateLoan(loan.id, {
                      graceYears: Math.min(g, Math.max(0, loan.termYears - 1)),
                    })
                  }
                  min={0}
                  max={Math.max(0, loan.termYears - 1)}
                  suffix="년"
                />
              </Field>

              <Field
                label="대출 실행/상환 시작 연차"
                hint={
                  loan.startYear > 1
                    ? `${currentYear() + loan.startYear - 1}년부터`
                    : '지금부터'
                }
                className="col-span-2"
              >
                <CountInput
                  value={loan.startYear}
                  onChange={(startYear) => updateLoan(loan.id, { startYear })}
                  min={1}
                  max={40}
                />
              </Field>

              {loan.startYear > 1 && (
                <p className="callout-info col-span-2 text-[11px] font-medium">
                  {loan.startYear - 1}년 후({currentYear() + loan.startYear - 1}년)부터 실행되는 미래 대출이에요.
                </p>
              )}

              {loan.repaymentType === 'fixedMonthly' && (
                <Field label="월 상환액" className="col-span-2">
                  <MoneyInput
                    value={loan.monthlyPayment}
                    onChange={(monthlyPayment) =>
                      updateLoan(loan.id, { monthlyPayment })
                    }
                  />
                </Field>
              )}

              <div className="col-span-2 space-y-2 pt-1">
                <Toggle
                  checked={loan.isDepositLinked ?? false}
                  onChange={(isDepositLinked) =>
                    updateLoan(loan.id, { isDepositLinked })
                  }
                  label="보증금으로 대출 자동 상환"
                  description="전세 만기 시 돌려받는 보증금으로 대출을 갚아요 (내 현금 지출 없음)."
                />

                {loan.isDepositLinked && (
                  <p className="rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                    💡 <strong>보증금 상환 연동 중:</strong> 만기 시 원금은 보증금 반환금에서 상쇄되므로, 내 유동 현금(월급·파킹통장)은 1원도 차감되지 않습니다.
                  </p>
                )}

                {loan.repaymentType === 'interestOnly' && (
                  <Toggle
                    checked={loan.autoRenew ?? false}
                    onChange={(autoRenew) => updateLoan(loan.id, { autoRenew })}
                    label="만기 시 원금 상환 없이 연장"
                    description="만기 시 원금을 갚지 않고 이자만 계속 납부합니다."
                  />
                )}
              </div>

              <MemoField value={loan.memo ?? ''} onChange={(memo) => updateLoan(loan.id, { memo })} />
            </div>

            <p className="callout-info mt-3">
              {graceYears > 0
                ? `거치 기간(첫 ${graceYears}년) 월 이자`
                : loan.repaymentType === 'equalPrincipal'
                  ? '첫 달 납입액'
                  : loan.repaymentType === 'interestOnly'
                    ? '월 이자'
                    : '월 납입액'}{' '}
              약{' '}
              <strong className="font-semibold tabular-nums">
                {formatKRWShort(estimatedMonthly)}원
              </strong>
            </p>
          </ItemCard>
        );
      })}

      <AddItemButton onClick={addLoan} label="대출 항목 추가" />
    </Accordion>
  );
}
