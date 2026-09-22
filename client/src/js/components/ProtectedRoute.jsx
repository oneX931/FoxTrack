import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { ErrorState } from './ErrorState.jsx'
import { PageLoading } from './Spinner.jsx'

export function ProtectedRoute() {
  const { status, user, error, retry } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  if (status === 'loading') return <PageLoading />
  if (status === 'error') {
    return (
      <div className="centered-page">
        <ErrorState error={error} onRetry={retry} title={t('error.checkAuth.title')} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}

export function PublicOnlyRoute({ children }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <PageLoading />
  if (user) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />

  return children
}
