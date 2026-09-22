import { useLanguage } from '../context/LanguageContext.jsx'

export function Spinner({ label }) {
  const { t } = useLanguage()
  return (
    <span className="spinner" role="status">
      <span className="visually-hidden">{(label ?? t('common.loading'))}…</span>
    </span>
  )
}

export function PageLoading({ label }) {
  return (
    <div className="page-loading">
      <Spinner label={label} />
    </div>
  )
}
