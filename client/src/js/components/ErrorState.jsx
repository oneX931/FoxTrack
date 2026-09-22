import { RefreshCw, TriangleAlert, WifiOff } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'

export function ErrorState({ error, onRetry, title }) {
  const { t } = useLanguage()
  const isNetwork = error?.code === 'NETWORK'
  return (
    <div className="state-block state-block--error">
      <span className="state-block__icon">
        {isNetwork ? <WifiOff aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
      </span>
      <h2>{title ?? (isNetwork ? t('error.network.title') : t('error.generic.title'))}</h2>
      <p>{error?.message}</p>
      {onRetry && (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" />
          {t('error.retry')}
        </button>
      )}
    </div>
  )
}
