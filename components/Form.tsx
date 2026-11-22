"use client";

import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface FieldShell {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
}

function Shell({ id, label, hint, error, required, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="err" id={`${id}-err`}>{error}</span>}
    </div>
  );
}

const describedBy = (id: string, hint: unknown, error: unknown) => [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;

export function TextField({ label, hint, error, required, ...input }: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = input.id ?? auto;
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required}>
      <input {...input} id={id} className="input" required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} />
    </Shell>
  );
}

export function SelectField({ label, hint, error, required, children, ...select }: FieldShell & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const id = select.id ?? auto;
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required}>
      <select {...select} id={id} className="select" required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)}>
        {children}
      </select>
    </Shell>
  );
}

export function TextAreaField({ label, hint, error, required, ...area }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const id = area.id ?? auto;
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea {...area} id={id} className="textarea" required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} />
    </Shell>
  );
}

export function PasswordField({ label, hint, error, required, ...input }: FieldShell & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const auto = useId();
  const id = input.id ?? auto;
  const [shown, setShown] = useState(false);
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required}>
      <div className="pw">
        <input {...input} id={id} className="input" type={shown ? "text" : "password"} required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} />
        <button type="button" className="pw-toggle" onClick={() => setShown((v) => !v)} aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
            {shown && <path d="M3 3l18 18" />}
          </svg>
        </button>
      </div>
    </Shell>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Day / month / year dropdowns for dates of birth: pick instead of type, and unambiguous on any locale. */
export function DateParts({
  label,
  hint,
  error,
  value,
  onChange,
  required,
  disabled,
}: FieldShell & { value: { d: string; m: string; y: string }; onChange: (v: { d: string; m: string; y: string }) => void; disabled?: boolean }) {
  const id = useId();
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 1899 }, (_, i) => String(thisYear - i));
  // Stored values may be zero-padded ("05"); the options are not.
  const norm = (v: string) => (v ? String(Number(v)) : "");
  const y = value.y;
  const m = norm(value.m);
  const d = norm(value.d);
  const daysIn = m && y.length === 4 ? new Date(Number(y), Number(m), 0).getDate() : m ? new Date(2024, Number(m), 0).getDate() : 31;
  const change = (k: "d" | "m" | "y") => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = { d, m, y, [k]: e.target.value };
    const max = next.m ? new Date(next.y.length === 4 ? Number(next.y) : 2024, Number(next.m), 0).getDate() : 31;
    if (next.d && Number(next.d) > max) next.d = String(max);
    onChange(next);
  };
  const invalid = error ? true : undefined;
  return (
    <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }} aria-describedby={describedBy(id, hint, error)} disabled={disabled}>
      <legend className="lbl">
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </legend>
      <div className="row" style={{ gap: "var(--space-2)", flexWrap: "wrap" }}>
        <select className="input" aria-label="Day" style={{ width: 84 }} value={d} onChange={change("d")} aria-invalid={invalid}>
          <option value="">Day</option>
          {Array.from({ length: daysIn }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}</option>)}
        </select>
        <select className="input" aria-label="Month" style={{ width: 140 }} value={m} onChange={change("m")} aria-invalid={invalid}>
          <option value="">Month</option>
          {MONTHS.map((name, i) => <option key={name} value={String(i + 1)}>{name}</option>)}
        </select>
        <select className="input" aria-label="Year" style={{ width: 104 }} value={y} onChange={change("y")} aria-invalid={invalid}>
          <option value="">Year</option>
          {years.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
        </select>
      </div>
      {hint && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="err" id={`${id}-err`}>{error}</span>}
    </fieldset>
  );
}

/** A form-level error. Takes focus when it appears so a screen reader reads it. */
export function FormError({ message }: { message: string | null | undefined }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (message) ref.current?.focus();
  }, [message]);
  if (!message) return null;
  return (
    <div ref={ref} className="alert bad" role="alert" tabIndex={-1}>
      <div>{message}</div>
    </div>
  );
}

export function FormNotice({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div className="alert ok" role="status">
      <div>{message}</div>
    </div>
  );
}

export function Avatar({ children }: { children: ReactNode }) {
  return <div className="avatar" aria-hidden="true">{children}</div>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p className="muted sm" role="status">{label}</p>;
}
