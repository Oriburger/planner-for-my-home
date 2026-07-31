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
  TextInput,
} from '@/components/ui/Fields';
import { formatKRWShort } from '@/utils/format';
import { monthlyEqualPayment } from '@/utils/loan';

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
      icon="🏛️"
    >
      {loans.length === 0 && <EmptyState message="대출이 없다면 비워두세요." />}

      {loans.map((loan) => {
        // 상환 방식별 예상 월 납입액 (직접입력 방식은 입력값 그대로)
        const estimatedMonthly =
          loan.repaymentType === 'fixedMonthly'
            ? loan.monthlyPayment
            : loan.repaymentType === 'equalPayment'
              ? monthlyEqualPayment(loan.principal, loan.annualRate, loan.termYears)
              : loan.repaymentType === 'equalPrincipal'
                ? loan.principal / Math.max(1, loan.termYears * 12) +
                  (loan.principal * loan.annualRate) / 100 / 12
                : (loan.principal * loan.annualRate) / 100 / 12;

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

              <Field label="상환 기간">
                <CountInput
                  value={loan.termYears}
                  onChange={(termYears) => updateLoan(loan.id, { termYears })}
                  min={1}
                  max={40}
                  suffix="년"
                />
              </Field>

              <Field label="상환 시작 연차">
                <CountInput
                  value={loan.startYear}
                  onChange={(startYear) => updateLoan(loan.id, { startYear })}
                  min={1}
                  max={40}
                />
              </Field>

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
            </div>

            <p className="mt-2 rounded-lg bg-brand-50 px-2.5 py-2 text-[11px] text-brand-800">
              {loan.repaymentType === 'equalPrincipal'
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
