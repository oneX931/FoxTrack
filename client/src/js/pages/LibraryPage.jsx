import { useCallback, useState } from 'react'
import { Library, Plus, Search, SearchX, X } from 'lucide-react'
import { Link } from 'react-router'
import { libraryApi } from '../api/client.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { ErrorState } from '../components/ErrorState.jsx'
import { LibraryGameCard } from '../components/LibraryGameCard.jsx'
import { SkeletonList } from '../components/SkeletonCard.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { STATUSES, statusLabel } from '../utils/status.js'

const ALL = 'Все'

export function LibraryPage() {
  const { t, tCount } = useLanguage()
  useDocumentTitle(t('library.title'))

  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(ALL)
  const [platform, setPlatform] = useState('')

  const task = useCallback(
    (signal) => libraryApi.list({ q: query, status: status === ALL ? '' : status, platform }, signal),
    [query, status, platform],
  )
  const { data, error, loading, reload } = useAsync(task, [query, status, platform])

  const filtersActive = query.trim() !== '' || status !== ALL || platform !== ''
  const hasAnyGames = (data?.filters.counts[ALL] ?? 0) > 0 || (data?.total ?? 0) > 0 || filtersActive

  function submitSearch(event) {
    event.preventDefault()
    setQuery(queryInput.trim())
  }

  function clearSearch() {
    setQueryInput('')
    setQuery('')
  }

  function resetFilters() {
    clearSearch()
    setStatus(ALL)
    setPlatform('')
  }

  return (
    <div className="container page">
      <header className="page-header">
        <div className="page-header__text">
          <h1 className="page-title" style={{ fontFamily: 'var(--font-pixel)' }}>
            {t('library.title')}
          </h1>
          {data && data.filters.counts[ALL] > 0 && (
            <p className="page-subtitle">{tCount('library.totalCount', data.filters.counts[ALL])}</p>
          )}
        </div>
      </header>

      {(loading || data) && hasAnyGames && (
        <section className="filter-bar" aria-label={t('library.filter.status.aria')}>
          <form className="field field--compact filter-bar__search" style={{ margin: 0 }} onSubmit={submitSearch}>
            <div className="input-wrap">
              <button type="submit" className="input-wrap__icon input-wrap__icon--button" aria-label={t('library.search.submit')}>
                <Search size={18} aria-hidden="true" />
              </button>
              <input
                className="input"
                type="search"
                placeholder={t('library.search.placeholder')}
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                aria-label={t('library.search.aria')}
              />
              {queryInput && (
                <button type="button" className="input-wrap__trailing" onClick={clearSearch} aria-label={t('library.search.clear')}>
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </form>

          <div className="filter-bar__row">
            <div className="chip-scroller" role="group" aria-label={t('library.filter.status.aria')}>
              {[ALL, ...STATUSES].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`filter-chip ${status === item ? 'is-active' : ''}`.trim()}
                  aria-pressed={status === item}
                  onClick={() => setStatus(item)}
                >
                  {item === ALL ? t('library.status.all') : statusLabel(item, t)}
                  {data && <span className="count">{data.filters.counts[item] ?? 0}</span>}
                </button>
              ))}
            </div>

            {data && data.filters.platforms.length > 0 && (
              <select
                className="select field--compact"
                style={{ width: 'auto' }}
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                aria-label={t('library.filter.platform.aria')}
              >
                <option value="">{t('library.filter.platform.all')}</option>
                {data.filters.platforms.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </section>
      )}

      <section className="library-content" aria-label={t('library.title')}>
      {loading && !data && <SkeletonList count={6} />}

      {error && <ErrorState error={error} onRetry={reload} />}

      {data && data.items.length === 0 && !filtersActive && (
        <EmptyState
          icon={Library}
          title={t('library.empty.title')}
          description={t('library.empty.description')}
          action={
            <Link to="/add" className="btn btn--primary">
              <Plus size={18} aria-hidden="true" />
              {t('library.empty.action')}
            </Link>
          }
        />
      )}

      {data && data.items.length === 0 && filtersActive && (
        <EmptyState
          icon={SearchX}
          title={t('library.noResults.title')}
          description={t('library.noResults.description')}
          action={
            <button type="button" className="btn btn--secondary" onClick={resetFilters}>
              {t('library.noResults.reset')}
            </button>
          }
        />
      )}

      {data && data.items.length > 0 && (
        <div className="game-grid">
          {data.items.map((game) => (
            <LibraryGameCard key={game.id} game={game} />
          ))}
        </div>
      )}
      </section>
    </div>
  )
}
