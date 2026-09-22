import { useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { LogOut, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useOnClickOutside } from '../hooks/useOnClickOutside.js'
import { Logo } from './Logo.jsx'
import { SettingsDialog } from './SettingsDialog.jsx'
import { ThemeToggle } from './ThemeToggle.jsx'

function initialOf(username) {
  return [...(username ?? '?').trim()][0]?.toUpperCase() ?? '?'
}

function UserMenu({ user, onLogout, onOpenSettings }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useOnClickOutside(ref, () => setOpen(false), open)

  return (
    <div className="header-menu" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('menu.account')}
      >
        <span className="avatar">
          {user.avatar ? <img src={user.avatar} alt="" className="avatar-preview-lg" /> : initialOf(user.username)}
        </span>
      </button>
      {open && (
        <div className="menu-popover" role="menu">
          <div className="menu-popover__header">
            <p className="menu-popover__name">{user.username}</p>
            <p className="menu-popover__email">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            className="menu-popover__item"
            onClick={() => {
              setOpen(false)
              onOpenSettings()
            }}
          >
            <Settings size={17} aria-hidden="true" />
            {t('menu.settings')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu-popover__item menu-popover__item--danger"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
          >
            <LogOut size={17} aria-hidden="true" />
            {t('menu.logout')}
          </button>
        </div>
      )}
    </div>
  )
}

export function Header() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to={user ? '/' : '/login'} aria-label={`${t('app.name')} — ${t('nav.library')}`}>
          <Logo />
        </Link>

        {user && (
          <nav className="site-nav" aria-label={t('nav.library')}>
            <NavLink to="/" end className={({ isActive }) => `site-nav__link${isActive ? ' is-active' : ''}`}>
              {t('nav.library')}
            </NavLink>
            <NavLink to="/add" className={({ isActive }) => `site-nav__link${isActive ? ' is-active' : ''}`}>
              {t('nav.add')}
            </NavLink>
          </nav>
        )}

        <div className="header-actions">
          <ThemeToggle />
          {user && <UserMenu user={user} onLogout={handleLogout} onOpenSettings={() => setSettingsOpen(true)} />}
        </div>
      </div>

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </header>
  )
}
