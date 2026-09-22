import { Outlet } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { BottomNav } from './BottomNav.jsx'
import { Header } from './Header.jsx'

export function RootLayout() {
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('common.skipToContent')}
      </a>
      <Header />
      <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>
          © {new Date().getFullYear()} FoxTrack · {t('footer.data')}{' '}
          <a href="https://thegamesdb.net" target="_blank" rel="noopener noreferrer">
            TheGamesDB
          </a>
        </p>
      </footer>
      {user && <BottomNav />}
    </div>
  )
}
