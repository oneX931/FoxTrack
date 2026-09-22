import { useEffect, useRef, useState } from 'react'
import { libraryApi } from '../api/client.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import { CoverImage } from './CoverImage.jsx'
import { PlatformIcon } from './PlatformIcon.jsx'

export function AddGameDialog({ group, onClose, onAdded }) {
  const { t } = useLanguage()
  const [checked, setChecked] = useState(() => new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef(null)

  useEffect(() => {
    dialogRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function toggle(gameId) {
    setChecked((current) => {
      const next = new Set(current)
      if (next.has(gameId)) next.delete(gameId)
      else next.add(gameId)
      return next
    })
    setError('')
  }

  async function confirm() {
    if (checked.size === 0) {
      setError(t('addDialog.selectAtLeastOne'))
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const gameIds = group.platforms.map((platform) => platform.gameId)
      const { game } = await libraryApi.add({ gameIds, selectedGameIds: [...checked] })
      onAdded(game)
    } catch (apiError) {
      setError(apiError.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="add-dialog__head">
          <CoverImage src={group.cover} alt="" wrapperClassName="add-dialog__cover" className="game-card__cover-img" />
          <div>
            <h2 id="add-dialog-title">{t('addDialog.title')}</h2>
            <p>{t('addDialog.subtitle', { title: group.title })}</p>
          </div>
        </div>

        <div className="add-dialog__platforms" role="group" aria-label={t('addDialog.title')}>
          {group.platforms.map((platform) => (
            <label key={platform.gameId} className="platform-check">
              <input
                type="checkbox"
                checked={checked.has(platform.gameId)}
                onChange={() => toggle(platform.gameId)}
              />
              <PlatformIcon name={platform.name} size={16} />
              <span className="platform-check__name">{platform.name}</span>
              {platform.year && <span className="platform-check__year">{platform.year}</span>}
            </label>
          ))}
        </div>

        {error ? (
          <p className="field__error" role="alert">
            {error}
          </p>
        ) : (
          checked.size === 0 && <p className="field__hint">{t('addDialog.selectAtLeastOne')}</p>
        )}

        <div className="dialog__actions">
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={submitting}>
            {t('addDialog.cancel')}
          </button>
          <button
            type="button"
            className={`btn btn--primary ${submitting ? 'btn--spinning' : ''}`.trim()}
            onClick={confirm}
            disabled={submitting || checked.size === 0}
          >
            {submitting && <span className="spinner" aria-hidden="true" />}
            {checked.size > 0 ? `${t('addDialog.confirm')} (${checked.size})` : t('addDialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
