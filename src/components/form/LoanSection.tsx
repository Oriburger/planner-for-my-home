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
  TextArea,
  TextInput,
  Toggle,
} from '@/components/ui/Fields';
import { formatKRWShort } from '@/utils/format';
import { monthlyEqualPayment } from '@/utils/loan';

const TYPE_OPTIONS = (
  Object.keys(REPAYMENT_TYPE_LABEL) as RepaymentType[]
).map((value) => ({ value, label: REPAYMENT_TYPE_LABEL[value] }));

export function LoanSection() {
  const loans = usePlannerStore((s) => s.loans);
  const settings = usePlannerStore((s) => s.settings);
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
        const graceYears = loan.graceYears ?? 0;
        const amortizationYears = Math.max(1, loan.termYears - graceYears);

        // 상환 방식별 예상 월 납입액 (거치 기간 중이면 이자만)
        const estimatedMonthly =
          graceYears > 0
            ? (loan.principal * loan.annualRate) / 100 / 12
            : loan.repaymentType === 'fixedMonthly'
              ? loan.monthlyPayment
              : loan.repaymentType === 'equalPayment'
                ? monthlyEqualPayment(loan.principal, loan.annualRate, amortizationYears)
                : loan.repaymentType === 'equalPrincipal'
                  ? loan.principal / Math.max(1, amortizationYears * 12) +
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

              <Field label="종료 연차" hint={`총 ${loan.termYears}년`}>
                <CountInput
                  value={loan.startYear + loan.termYears - 1}
                  onChange={(endYear) =>
                    updateLoan(loan.id, {
                      termYears: Math.max(1, endYear - loan.startYear + 1),
                    })
                  }
                  min={loan.startYear}
                  max={40}
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
                    ? `미래 대출 (${settings.startYear + loan.startYear - 1}년)`
                    : '1년차부터 시작'
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
                <p className="col-span-2 rounded-lg bg-brand-50/80 px-2.5 py-1.5 text-[11px] font-medium text-brand-700">
                  💡 시뮬레이션 {loan.startYear}년 차({settings.startYear + loan.startYear - 1}년)부터 실행되는 미래 대출입니다.
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
                  label="보증금 상환 연동"
                  description="만기 시 유동 현금이 아닌 임대보증금 자산에서 차감 상쇄됩니다."
                />

                {loan.repaymentType === 'interestOnly' && (
                  <Toggle
                    checked={loan.autoRenew ?? false}
                    onChange={(autoRenew) => updateLoan(loan.id, { autoRenew })}
                    label="만기 자동 연장"
                    description="만기 시 원금을 갚지 않고 이자만 지속 납부합니다."
                  />
                )}
              </div>

              <Field label="메모" className="col-span-2">
                <TextArea
                  value={loan.memo ?? ''}
                  onChange={(memo) => updateLoan(loan.id, { memo })}
                  placeholder="선택 입력"
                />
              </Field>
            </div>

            <p className="mt-2 rounded-lg bg-brand-50 px-2.5 py-2 text-[11px] text-brand-800">
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
