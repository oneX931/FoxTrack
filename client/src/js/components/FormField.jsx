import { useId } from 'react'
import { CircleAlert } from 'lucide-react'

export function FormField({ label, error, hint, children, htmlFor, trailing }) {
  const generatedId = useId()
  const id = htmlFor ?? generatedId
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={`field ${error ? 'has-error' : ''}`.trim()}>
      <div className="field__label-row">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        {trailing}
      </div>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error ? (
        <p className="field__error" id={`${id}-error`} role="alert">
          <CircleAlert size={15} aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
