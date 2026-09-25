import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '../components/EmptyState.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export function NotFoundPage() {
  const { t } = useLanguage()
  useDocumentTitle(t('notFound.title'))
  return (
    <div className="centered-page">
      <EmptyState
        icon={Compass}
        title={t('notFound.title')}
        description={t('notFound.description')}
        action={
          <Link to="/" className="btn btn--primary">
            {t('notFound.action')}
          </Link>
        }
      />
    </div>
  )
}
