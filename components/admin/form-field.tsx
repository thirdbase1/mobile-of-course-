'use client'

import React from 'react'

interface FormFieldProps {
  label: string
  type?: string
  value: any
  onChange: (value: any) => void
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: { value: any; label: string }[]
  helperText?: string
  multiline?: boolean
  rows?: number
}

export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  options,
  helperText,
  multiline = false,
  rows = 4,
}: FormFieldProps) {
  return (
    <div className="form-group">
      <label>
        {label}
        {required && <span style={{ color: 'var(--admin-danger)' }}> *</span>}
      </label>

      {type === 'select' && options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}

      {error && <div style={{ fontSize: '12px', color: 'var(--admin-danger)', marginTop: '4px' }}>✕ {error}</div>}
      {helperText && !error && <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>ℹ {helperText}</div>}
    </div>
  )
}

export function FormGroup({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <fieldset style={{ border: 'none', padding: '0', margin: '0' }}>
      {title && <legend style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--admin-text)' }}>{title}</legend>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>
    </fieldset>
  )
}
