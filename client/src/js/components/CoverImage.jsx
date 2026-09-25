import { ImageOff } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'

export function CoverImage({ src, alt, className = '', wrapperClassName = '', eager = false }) {
  const { t } = useLanguage()
  return (
    <div className={wrapperClassName}>
      {src ? (
        <img
          className={className}
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={(event) => {
            event.currentTarget.hidden = true
            const fallback = event.currentTarget.nextElementSibling
            if (fallback) fallback.hidden = false
          }}
        />
      ) : null}
      <div className="cover-fallback" role="img" aria-label={t('cover.missing')} hidden={Boolean(src)}>
        <ImageOff aria-hidden="true" />
      </div>
    </div>
  )
}
