import { useRef, useState } from 'react'
import { Gamepad2, Search, SearchX, TriangleAlert, X } from 'lucide-react'
import { ApiError, searchApi } from '../api/client.js'
import { ErrorState } from '../components/ErrorState.jsx'
import { SearchResultCard } from '../components/SearchResultCard.jsx'
import { SkeletonList } from '../components/SkeletonCard.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { mergeGroups } from '../utils/groups.js'
import { validateSearch } from '../utils/validation.js'

const IDLE = { phase: 'idle', query: '', results: [], hasMore: false, page: 1, error: null }

export function AddGamePage() {
  const { t } = useLanguage()
  useDocumentTitle(t('add.title'))

  const [queryInput, setQueryInput] = useState('')
  const [searchError, setSearchError] = useState('')
  const [state, setState] = useState(IDLE)
  const [loadingMore, setLoadingMore] = useState(false)
  const controllerRef = useRef(null)

  function runSearch(query) {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setState({ ...IDLE, phase: 'loading', query })

    searchApi.search(query, 1, controller.signal).then(
      (payload) => setState({ phase: 'loaded', query, results: payload.results, hasMore: payload.hasMore, page: 1, error: null }),
      (error) => {
        if (controller.signal.aborted || error.name === 'AbortError') return
        setState({ phase: 'error', query, results: [], hasMore: false, page: 1, error })
      },
    )
  }

  function submitSearch(event) {
    event.preventDefault()
    const trimmed = queryInput.trim()
    if (trimmed.length === 0) {
      setSearchError('')
      setState(IDLE)
      return
    }
    const validation = validateSearch(trimmed, t)
    if (validation) {
      setSearchError(validation)
      return
    }
    setSearchError('')
    runSearch(trimmed)
  }

  function clearSearch() {
    controllerRef.current?.abort()
    setQueryInput('')
    setSearchError('')
    setState(IDLE)
  }

  async function loadMore() {
    setLoadingMore(true)
    try {
      const nextPage = state.page + 1
      const payload = await searchApi.search(state.query, nextPage)
      setState((current) => ({
        ...current,
        results: mergeGroups(current.results, payload.results),
        hasMore: payload.hasMore,
        page: nextPage,
      }))
    } catch (error) {
      setState((current) => ({ ...current, error: error instanceof ApiError ? error : current.error }))
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="container page">
      <header className="page-header">
        <div className="page-header__text">
          <h1 className="page-title" style={{ fontFamily: 'var(--font-pixel)' }}>
            {t('add.title')}
          </h1>
          <p className="page-subtitle">{t('add.subtitle')}</p>
        </div>
      </header>

      <section aria-label={t('add.search.aria')}>
      <form className="field" style={{ marginBottom: 'var(--space-5)' }} onSubmit={submitSearch}>
        <div className="input-wrap">
          <button type="submit" className="input-wrap__icon input-wrap__icon--button" aria-label={t('add.search.submit')}>
            <Search size={18} aria-hidden="true" />
          </button>
          <input
            className="input"
            type="search"
            placeholder={t('add.search.placeholder')}
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            aria-label={t('add.search.aria')}
            autoFocus
          />
          {queryInput && (
            <button type="button" className="input-wrap__trailing" onClick={clearSearch} aria-label={t('library.search.clear')}>
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        {searchError && (
          <p className="field__error" role="alert">
            <TriangleAlert size={15} aria-hidden="true" />
            {searchError}
          </p>
        )}
      </form>
      </section>

      <section aria-live="polite" aria-label={t('add.title')}>

      {state.phase === 'idle' && (
        <div className="state-block">
          <span className="state-block__icon">
            <Gamepad2 aria-hidden="true" />
          </span>
          <h2>{t('add.idle.title')}</h2>
          <p>{t('add.idle.description', { submit: t('add.search.submit') })}</p>
        </div>
      )}

      {state.phase === 'loading' && <SkeletonList count={4} />}

      {state.phase === 'error' && (
        <ErrorState error={state.error} onRetry={() => runSearch(state.query)} title={t('add.error.title')} />
      )}

      {state.phase === 'loaded' && state.results.length === 0 && (
        <div className="state-block">
          <span className="state-block__icon">
            <SearchX aria-hidden="true" />
          </span>
          <h2>{t('add.noResults.title')}</h2>
          <p>{t('add.noResults.description')}</p>
        </div>
      )}

      {state.phase === 'loaded' && state.results.length > 0 && (
        <>
          <div className="search-results">
            {state.results.map((group) => (
              <SearchResultCard key={group.key} group={group} />
            ))}
          </div>
          {state.hasMore && (
            <div className="load-more">
              <button type="button" className={`btn btn--secondary ${loadingMore ? 'btn--spinning' : ''}`.trim()} onClick={loadMore} disabled={loadingMore}>
                {loadingMore && <span className="spinner" aria-hidden="true" />}
                {t('add.loadMore')}
              </button>
            </div>
          )}
        </>
      )}
      </section>
    </div>
  )
}
