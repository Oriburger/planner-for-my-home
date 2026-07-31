import { useId, useState, type ReactNode } from 'react';
import { fromMan, toMan } from '@/utils/format';

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
      <span className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-ink-600">{label}</span>
        {hint && <span className="text-[11px] text-ink-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 tabular-nums transition placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-ink-100 disabled:text-ink-400';

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
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">
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
  return (
    <select
      id={id}
      className={`${inputClass} appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2394a3b8'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")] bg-[length:1.25rem] bg-[right_0.6rem_center] bg-no-repeat pr-9`}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-3 py-2.5">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-xs font-medium text-ink-700">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11px] text-ink-400">
            {description}
          </span>
        )}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
          checked ? 'bg-brand-600' : 'bg-ink-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[1.375rem]' : 'left-0.5'
          }`}
        />
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
    <div className="flex rounded-xl border border-ink-200 bg-ink-100 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-[0.625rem] px-2 py-1.5 text-xs font-medium transition ${
            value === opt.value
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
