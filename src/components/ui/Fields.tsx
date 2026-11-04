import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import { fromMan, toMan } from '@/utils/format';
import { InfoTip } from './InfoTip';
import { Icon } from './Icon';

/* ------------------------------------------------------------------ */
/* 라벨 래퍼                                                           */
/* ------------------------------------------------------------------ */

interface FieldProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className = '',
}: FieldProps) {
  return (
    <label className={`block ${className}`} htmlFor={htmlFor}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2 px-0.5">
        <span className="min-w-0 break-keep text-xs font-medium text-ink-600 dark:text-slate-300">{label}</span>
        {/* 짧은 힌트는 그대로, 긴 설명은 ⓘ 뒤로 */}
        {hint &&
          (hint.length <= 6 ? (
            <span className="min-w-0 shrink truncate text-[11px] text-ink-500 dark:text-slate-500">
              {hint}
            </span>
          ) : (
            <InfoTip text={hint} label={`${label} 설명`} />
          ))}
      </span>
      {children}
    </label>
  );
}

const inputClass = 'glass-field';

/* ------------------------------------------------------------------ */
/* 숫자 입력 (포커스 중에는 draft 문자열을 그대로 유지)                 */
/* ------------------------------------------------------------------ */

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  /** 0 을 값이 아니라 '미입력'으로 취급해 placeholder 를 보여준다 */
  blankOnZero?: boolean;
}

function NumericInput({
  value,
  onChange,
  suffix,
  step = 1,
  min,
  max,
  placeholder,
  disabled,
  id,
  blankOnZero,
}: NumericInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const display = focused
    ? draft
    : blankOnZero && value === 0
      ? ''
      : Number.isFinite(value)
        ? String(Number(value.toFixed(2)))
        : '';

  const clamp = (n: number) => {
    let next = n;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return next;
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        placeholder={placeholder}
        className={`${inputClass} ${suffix ? 'pr-12' : ''} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        value={display}
        onFocus={() => {
          setDraft(value === 0 ? '' : String(Number(value.toFixed(2))));
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const parsed = raw === '' || raw === '-' ? 0 : Number(raw);
          if (!Number.isNaN(parsed)) onChange(clamp(parsed));
        }}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-500 dark:text-slate-500">
          {suffix}
        </span>
      )}
    </div>
  );
}

/** 금액 입력 — 화면에는 만원 단위, store 에는 원 단위로 저장 */
export function MoneyInput({
  value,
  onChange,
  disabled,
  id,
}: {
  value: number;
  onChange: (won: number) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <NumericInput
      id={id}
      value={toMan(value)}
      onChange={(man) => onChange(fromMan(man))}
      suffix="만원"
      step={10}
      min={0}
      placeholder="0"
      disabled={disabled}
    />
  );
}

export function PercentInput({
  value,
  onChange,
  min = -100,
  max = 100,
  disabled,
  id,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <NumericInput
      id={id}
      value={value}
      onChange={onChange}
      suffix="%"
      step={0.1}
      min={min}
      max={max}
      placeholder="0"
      disabled={disabled}
    />
  );
}

export function CountInput({
  value,
  onChange,
  min = 1,
  max = 40,
  suffix = '년차',
  disabled,
  id,
  blankOnZero,
  placeholder,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
  id?: string;
  blankOnZero?: boolean;
  placeholder?: string;
}) {
  return (
    <NumericInput
      id={id}
      value={value}
      onChange={(v) => onChange(Math.round(v))}
      suffix={suffix}
      step={1}
      min={min}
      max={max}
      disabled={disabled}
      blankOnZero={blankOnZero}
      placeholder={placeholder}
    />
  );
}

/* ------------------------------------------------------------------ */
/* 텍스트 / 셀렉트 / 토글                                              */
/* ------------------------------------------------------------------ */

export function TextInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      className={inputClass}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** 메모 등 짧은 자유 서술용 입력 (여러 줄, 리사이즈 불가) */
export function TextArea({
  value,
  onChange,
  placeholder,
  id,
  rows = 2,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  rows?: number;
  autoFocus?: boolean;
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      autoFocus={autoFocus}
      className={`${inputClass} resize-none`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  id,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  id?: string;
}) {
  // 화살표는 인라인 SVG 로 겹쳐 그린다.
  // (data-URI 를 Tailwind arbitrary value 로 넣으면 값 안의 공백 때문에
  //  클래스가 통째로 버려져 화살표가 사라진다)
  return (
    <div className="relative">
      <select
        id={id}
        className={`${inputClass} appearance-none pr-9`}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500 dark:text-slate-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-900/[0.06] px-3 py-2.5 dark:border-white/[0.07]">
      <span className="flex min-w-0 items-center gap-1.5">
        <label
          htmlFor={id}
          className="min-w-0 cursor-pointer text-[13px] font-medium text-ink-800 dark:text-slate-100"
        >
          {label}
        </label>
        {description && <InfoTip text={description} label={`${label} 설명`} />}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="switch"
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}

/** 세그먼트 컨트롤 (2~3개 선택지) */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="segmented" role="group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className="segmented-item"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** 채워진 트랙이 있는 레인지 슬라이더 */
export function RangeInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
}) {
  const progress = ((value - min) / Math.max(1, max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={label}
      style={{ '--range-progress': `${progress}%` } as CSSProperties}
    />
  );
}

/** 빠른 선택용 프리셋 버튼 묶음 (예: 5년 · 10년 · 20년) */
export function PresetGroup<T extends number | string>({
  value,
  onChange,
  options,
  format,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  format: (value: T) => string;
}) {
  return (
    <div className="segmented">
      {options.map((opt) => (
        <button
          key={String(opt)}
          type="button"
          aria-pressed={value === opt}
          onClick={() => onChange(opt)}
          className="segmented-item"
        >
          {format(opt)}
        </button>
      ))}
    </div>
  );
}

/** 메모 — 비어 있으면 '+ 메모' 버튼만 보여 입력 화면을 짧게 유지한다 */
export function MemoField({
  value,
  onChange,
  className = 'col-span-2',
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!value && !open) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-ml-1 inline-flex min-h-[2rem] items-center gap-1 rounded-md px-1.5 text-xs font-medium text-ink-500 transition-colors hover:bg-ink-900/[0.04] hover:text-ink-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          <Icon name="plus" className="h-3.5 w-3.5" />
          메모
        </button>
      </div>
    );
  }
  return (
    <Field label="메모" className={className}>
      <TextArea value={value} onChange={onChange} placeholder="선택 입력" autoFocus={open && !value} />
    </Field>
  );
}
