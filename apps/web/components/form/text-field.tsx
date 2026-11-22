"use client"

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react"

type BaseProps = {
  id: string
  label: string
  error?: string
  helpText?: string
}

type InputProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
    multiline?: false
  }

type TextareaProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
    multiline: true
  }

type Props = InputProps | TextareaProps

export function TextField(props: Props) {
  const { id, label, error, helpText, multiline, ...rest } = props as any
  const errorId = `${id}-error`
  const helpId = `${id}-help`
  const describedBy = [helpText ? helpId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ")

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...rest}
        />
      ) : (
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...rest}
        />
      )}
      {helpText && <p id={helpId}>{helpText}</p>}
      {error && (
        <p id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
