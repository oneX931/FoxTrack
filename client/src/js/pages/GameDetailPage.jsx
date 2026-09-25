import { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, Save, Star, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { libraryApi } from '../api/client.js'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { CoverImage } from '../components/CoverImage.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { ErrorState } from '../components/ErrorState.jsx'
import { FormField } from '../components/FormField.jsx'
import { PlatformIcon } from '../components/PlatformIcon.jsx'
import { RatingStars } from '../components/RatingStars.jsx'
import { PageLoading } from '../components/Spinner.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { COMPLETED_STATUS, STATUSES, statusLabel } from '../utils/status.js'
import { formatAddedDate, formatReleaseDate, genreLabel, countCharacters } from '../utils/format.js'
import { REVIEW_MAX_LENGTH, validateReview } from '../utils/validation.js'

function sameSet(a, b) {
  return a.length === b.length && a.every((item) => b.includes(item))
}

export function GameDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { t, tCount, lang } = useLanguage()

  const task = (signal) => libraryApi.get(id, signal).then(({ game }) => game)
  const { data: game, error, loading, reload, setData } = useAsync(task, [id])

  useDocumentTitle(game?.title ?? t('detail.back'))

  const [savingField, setSavingField] = useState(null)
  const [reviewDraft, setReviewDraft] = useState('')
  const [savingReview, setSavingReview] = useState(false)
  const [platformDraft, setPlatformDraft] = useState(new Set())
  const [savingPlatforms, setSavingPlatforms] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setReviewDraft(game?.review ?? '')
  }, [game?.id, game?.review])

  useEffect(() => {
    setPlatformDraft(new Set(game?.selectedPlatforms ?? []))
  }, [game?.id, game?.selectedPlatforms])

  async function applyPatch(field, body, successMessage) {
    setSavingField(field)
    try {
      const { game: updated } = await libraryApi.update(id, body)
      setData(updated)
      if (successMessage) toast.success(successMessage(updated))
    } catch (patchError) {
      toast.error(patchError.message)
    } finally {
      setSavingField(null)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await libraryApi.remove(id)
      navigate('/', { replace: true })
      toast.success(t('detail.toast.deleted', { title: game.title }))
    } catch (deleteError) {
      toast.error(deleteError.message)
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  if (loading) return <PageLoading />

  if (error) {
    if (error.status === 404) {
      return (
        <div className="centered-page">
          <EmptyState
            title={t('detail.notFound.title')}
            description={t('detail.notFound.description')}
            action={
              <Link to="/" className="btn btn--primary">
                {t('detail.back')}
              </Link>
            }
          />
        </div>
      )
    }
    return (
      <div className="centered-page">
        <ErrorState error={error} onRetry={reload} />
      </div>
    )
  }

  if (!game) return null

  const reviewChars = countCharacters(reviewDraft)
  const reviewError = validateReview(reviewDraft, t)
  const reviewDirty = reviewDraft.trim() !== (game.review ?? '')
  const platformsDirty = !sameSet([...platformDraft], game.selectedPlatforms)

  async function saveReview() {
    if (reviewError) return
    setSavingReview(true)
    try {
      const { game: updated } = await libraryApi.update(id, { review: reviewDraft.trim() })
      setData(updated)
      toast.success(t(updated.review ? 'detail.toast.reviewSaved' : 'detail.toast.reviewCleared'))
    } catch (patchError) {
      toast.error(patchError.message)
    } finally {
      setSavingReview(false)
    }
  }

  async function savePlatforms() {
    setSavingPlatforms(true)
    try {
      const selectedPlatforms = [...platformDraft]
      const { game: updated } = await libraryApi.update(id, { selectedPlatforms })
      setData(updated)
      toast.success(t('detail.toast.platforms', { platforms: updated.selectedPlatforms.join(', ') }))
    } catch (patchError) {
      toast.error(patchError.message)
    } finally {
      setSavingPlatforms(false)
    }
  }

  function togglePlatformDraft(name) {
    setPlatformDraft((current) => {
      const next = new Set(current)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <div className="container page">
      <Link to="/" className="btn btn--ghost btn--sm" style={{ alignSelf: 'flex-start', marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} aria-hidden="true" />
        {t('detail.back')}
      </Link>

      <article className="detail-layout">
        <figure className="detail-layout__cover">
          <CoverImage src={game.coverUrl} alt="" wrapperClassName="detail-cover" className="game-card__cover-img" eager />
        </figure>

        <div className="detail-layout__body">
          <h1 className="page-title" style={{ fontFamily: 'var(--font-pixel)' }}>
            {game.title}
          </h1>

          <div className="game-card__meta" style={{ marginTop: 'var(--space-3)' }}>
            <StatusBadge status={game.status} />
            {game.releaseDate && (
              <span className="muted mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                <Calendar size={14} aria-hidden="true" />
                {formatReleaseDate(game.releaseDate, lang)}
              </span>
            )}
          </div>

          {game.genres.length > 0 && (
            <div className="genre-tags" style={{ marginTop: 'var(--space-4)' }}>
              {game.genres.map((genre) => (
                <span key={genre} className="genre-tag">
                  {genreLabel(genre, lang)}
                </span>
              ))}
            </div>
          )}

          {game.description && (
            <section className="detail-section">
              <h2 className="section-title">{t('detail.description')}</h2>
              <p>{game.description}</p>
            </section>
          )}

          <section className="detail-section">
            <h2 className="section-title">{t('detail.allPlatforms')}</h2>
            <div className="genre-tags">
              {game.platforms.map((name) => (
                <span key={name} className="genre-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  <PlatformIcon name={name} size={13} />
                  {name}
                </span>
              ))}
            </div>
          </section>

          <hr className="divider" />

          <section className="detail-section" style={{ marginTop: 0 }}>
            <h2 className="section-title">{t('detail.progress')}</h2>

            <FormField label={t('detail.status')}>
              {() => (
                <div className="tabs" role="group" aria-label={t('detail.status')}>
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`tabs__tab ${game.status === status ? 'is-active' : ''}`.trim()}
                      disabled={savingField === 'status'}
                      onClick={() => applyPatch('status', { status }, (updated) => t('detail.toast.status', { status: statusLabel(updated.status, t) }))}
                    >
                      {statusLabel(status, t)}
                    </button>
                  ))}
                </div>
              )}
            </FormField>

            <div style={{ marginTop: 'var(--space-4)' }}>
              <FormField label={t('detail.platforms')}>
                {() => (
                  <div className="add-dialog__platforms" style={{ maxHeight: 'none' }}>
                    {game.platforms.map((name) => (
                      <label key={name} className="platform-check">
                        <input type="checkbox" checked={platformDraft.has(name)} onChange={() => togglePlatformDraft(name)} />
                        <PlatformIcon name={name} size={16} />
                        <span className="platform-check__name">{name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </FormField>
              <button
                type="button"
                className={`btn btn--secondary btn--sm ${savingPlatforms ? 'btn--spinning' : ''}`.trim()}
                style={{ marginTop: 'var(--space-3)' }}
                disabled={!platformsDirty || platformDraft.size === 0 || savingPlatforms}
                onClick={savePlatforms}
              >
                {savingPlatforms && <span className="spinner" aria-hidden="true" />}
                {t('detail.platforms.save')}
              </button>
            </div>
          </section>

          {game.status === COMPLETED_STATUS ? (
            <section className="detail-section">
              <FormField label={t('detail.rating')} htmlFor="rating-select">
                {(props) => (
                  <>
                    <select
                      {...props}
                      className="select rating-select-compact"
                      value={game.rating ?? ''}
                      disabled={savingField === 'rating'}
                      onChange={(event) => {
                        const value = event.target.value ? Number(event.target.value) : null
                        applyPatch('rating', { rating: value }, (updated) => t(updated.rating ? 'detail.toast.ratingSet' : 'detail.toast.ratingCleared', { rating: updated.rating }))
                      }}
                    >
                      <option value="">{t('detail.rating.none')}</option>
                      {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                        <option key={value} value={value}>
                          {value} / 10
                        </option>
                      ))}
                    </select>
                    <div className="rating-stars-wrap">
                      <RatingStars
                        id={props.id}
                        value={game.rating}
                        disabled={savingField === 'rating'}
                        onChange={(value) =>
                          applyPatch('rating', { rating: value }, (updated) => t(updated.rating ? 'detail.toast.ratingSet' : 'detail.toast.ratingCleared', { rating: updated.rating }))
                        }
                      />
                    </div>
                  </>
                )}
              </FormField>

              <div style={{ marginTop: 'var(--space-4)' }}>
                <FormField
                  label={t('detail.review')}
                  htmlFor="review-textarea"
                  error={reviewDirty ? reviewError : ''}
                  trailing={
                    <span className={`field__count ${reviewChars > REVIEW_MAX_LENGTH ? 'is-over' : ''}`.trim()}>
                      {t('common.charCount', { count: reviewChars, max: REVIEW_MAX_LENGTH })}
                    </span>
                  }
                >
                  {(props) => (
                    <textarea
                      {...props}
                      className="textarea"
                      placeholder={t('detail.review.placeholder')}
                      value={reviewDraft}
                      onChange={(event) => setReviewDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && reviewDirty && !reviewError) saveReview()
                      }}
                    />
                  )}
                </FormField>
                <button
                  type="button"
                  className={`btn btn--primary ${savingReview ? 'btn--spinning' : ''}`.trim()}
                  style={{ marginTop: 'var(--space-3)' }}
                  disabled={!reviewDirty || Boolean(reviewError) || savingReview}
                  onClick={saveReview}
                >
                  {savingReview ? <span className="spinner" aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}
                  {t('detail.review.save')}
                </button>
              </div>
            </section>
          ) : (
            <p className="muted" style={{ marginTop: 'var(--space-4)', fontSize: '0.9375rem' }}>
              <Star size={14} aria-hidden="true" style={{ verticalAlign: '-0.125rem', marginRight: '0.25rem' }} />
              {t('detail.lockedHint', { status: statusLabel(COMPLETED_STATUS, t) })}
            </p>
          )}

          <hr className="divider" />

          <section className="detail-section" style={{ marginTop: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
            {formatAddedDate(game.addedAt, lang) && (
              <p className="muted" style={{ fontSize: '0.8125rem' }}>
                {t('detail.addedAt', { date: formatAddedDate(game.addedAt, lang) })}
              </p>
            )}
            <button type="button" className="btn btn--danger" onClick={() => setConfirmingDelete(true)}>
              <Trash2 size={17} aria-hidden="true" />
              {t('detail.delete')}
            </button>
          </section>
        </div>
      </article>

      {confirmingDelete && (
        <ConfirmDialog
          title={t('detail.deleteConfirm.title')}
          description={t('detail.deleteConfirm.description', { title: game.title })}
          confirmLabel={t('detail.deleteConfirm.confirm')}
          cancelLabel={t('detail.deleteConfirm.cancel')}
          tone="danger"
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}
