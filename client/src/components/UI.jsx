import React from 'react';

export const Card = ({ children, className = '', onClick = null, ...p }) => (
  <div className={`card ${className}`} onClick={onClick} {...p}>
    {children}
  </div>
);

export const Btn = ({ children, variant = '', type = 'button', disabled = false, loading = false, ...p }) => (
  <button type={type} disabled={disabled || loading} className={`btn ${variant}`} {...p}>
    {loading ? 'Please wait...' : children}
  </button>
);

export const Pill = ({ children, tone = '', className = '' }) => (
  <span className={`pill ${tone} ${className}`}>
    {children}
  </span>
);

export const Field = ({ label, required = false, children, error, hint }) => (
  <label className="field">
    <span>
      {label} {required && <b style={{ color: '#e45454' }}>*</b>}
    </span>
    {children}
    {hint && <small className="field-hint">{hint}</small>}
    {error && <small className="field-error">{error}</small>}
  </label>
);

export const Input = ({ label, required = false, ...p }) => (
  <Field label={label} required={required}>
    <input required={required} {...p} />
  </Field>
);

export const Select = ({ label, required = false, children, ...p }) => (
  <Field label={label} required={required}>
    <select required={required} {...p}>
      {children}
    </select>
  </Field>
);

export const Textarea = ({ label, required = false, rows = 3, ...p }) => (
  <Field label={label} required={required}>
    <textarea rows={rows} required={required} {...p} />
  </Field>
);

export const SectionHead = ({ eyebrow, title, action }) => (
  <div className="section-head">
    <div>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h3>{title}</h3>
    </div>
    {action && <div className="section-action">{action}</div>}
  </div>
);

export const Toolbar = ({ title, eyebrow = 'WORKSPACE', action }) => (
  <div className="toolbar-pro">
    <div>
      <span className="eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const Empty = ({ title = 'No records found', text = 'Connect more records to see activity here.', icon = '✦', action = null }) => (
  <div className="empty">
    <div className="empty-icon">{icon}</div>
    <b>{title}</b>
    <span>{text}</span>
    {action && <div style={{ marginTop: '12px' }}>{action}</div>}
  </div>
);

export function roleLabel(r) {
  const map = {
    student: 'Student / Innovator',
    mentor: 'Mentor & Advisor',
    startup: 'Startup Founder',
    investor: 'Angel / VC Investor',
    incubator: 'Incubator / Hub',
    admin: 'Administrator'
  };
  return map[r] || r;
}

export function formatCurrency(amount) {
  const n = Number(amount || 0);
  if (n >= 10000000) {
    return `₹${(n / 10000000).toFixed(2)} Cr`;
  }
  if (n >= 100000) {
    return `₹${(n / 100000).toFixed(2)} L`;
  }
  return `₹${n.toLocaleString('en-IN')}`;
}

export function relative(d) {
  if (!d) return 'Recently';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
