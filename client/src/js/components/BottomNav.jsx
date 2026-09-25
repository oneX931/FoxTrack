import { NavLink } from 'react-router'
import { Library, Plus } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'

export function BottomNav() {
  const { t } = useLanguage()
  return (
    <nav className="bottom-nav" aria-label={t('nav.library')}>
      <NavLink to="/" end className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}>
        <Library size={22} aria-hidden="true" />
        {t('nav.library')}
      </NavLink>
      <NavLink to="/add" className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}>
        <Plus size={22} aria-hidden="true" />
        {t('nav.addShort')}
      </NavLink>
    </nav>
  )
}
