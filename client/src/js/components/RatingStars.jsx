import { useRef, useState } from 'react'
import { Star, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'

export function RatingStars({ value, onChange, disabled, id }) {
  const { t } = useLanguage()
  const [hovered, setHovered] = useState(null)
  const refs = useRef([])
  const shown = hovered ?? value ?? 0

  function pick(n) {
    if (disabled) return
    onChange(value === n ? null : n)
  }

  function onKeyDown(event, index) {
    const moves = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }
    if (event.key in moves) {
      event.preventDefault()
      const next = Math.min(9, Math.max(0, index + moves[event.key]))
      refs.current[next]?.focus()
      pick(next + 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      refs.current[0]?.focus()
      pick(1)
    } else if (event.key === 'End') {
      event.preventDefault()
      refs.current[9]?.focus()
      pick(10)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      pick(index + 1)
    }
  }

  return (
    <div className="rating-stars">
      <div
        id={id}
        className="rating-stars__row"
        role="radiogroup"
        aria-label={t('detail.rating')}
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: 10 }, (_, index) => {
          const n = index + 1
          const filled = n <= shown
          const focusable = n === (value ?? 1)
          return (
            <button
              key={n}
              ref={(el) => {
                refs.current[index] = el
              }}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={String(n)}
              tabIndex={focusable ? 0 : -1}
              disabled={disabled}
              className={`rating-stars__star ${filled ? 'is-filled' : ''}`.trim()}
              onMouseEnter={() => setHovered(n)}
              onFocus={() => setHovered(n)}
              onBlur={() => setHovered(null)}
              onClick={() => pick(n)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              <Star aria-hidden="true" />
            </button>
          )
        })}
      </div>
      {value != null && (
        <button type="button" className="rating-stars__clear" disabled={disabled} onClick={() => onChange(null)}>
          <X size={14} aria-hidden="true" />
          {t('detail.rating.clear')}
        </button>
      )}
    </div>
  )
}
