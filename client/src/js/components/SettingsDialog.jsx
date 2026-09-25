import { useEffect, useRef, useState } from 'react'
import { Camera, Moon, Sun, Trash2, X } from 'lucide-react'
import { authApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { prepareAvatarImage } from '../utils/image.js'
import { validateLogin as validateEmailForm } from '../utils/validation.js'
import { FormField } from './FormField.jsx'

function initialOf(username) {
  return [...(username ?? '?').trim()][0]?.toUpperCase() ?? '?'
}

function AvatarPicker() {
  const { user, setUser } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const avatar = await prepareAvatarImage(file)
      const { user: updated } = await authApi.updateProfile({ avatar })
      setUser(updated)
      toast.success(t('settings.toast.profileSaved'))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    setBusy(true)
    try {
      const { user: updated } = await authApi.updateProfile({ avatar: null })
      setUser(updated)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="avatar-picker">
      <span className="avatar-picker__preview">
        {user.avatar ? <img src={user.avatar} alt="" className="avatar-preview-lg" /> : initialOf(user.username)}
      </span>
      <div className="avatar-picker__actions">
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleFile} />
        <button type="button" className="btn btn--secondary btn--sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Camera size={15} aria-hidden="true" />
          {t('settings.avatar.change')}
        </button>
        {user.avatar && (
          <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={handleRemove}>
            <Trash2 size={15} aria-hidden="true" />
            {t('settings.avatar.remove')}
          </button>
        )}
      </div>
    </div>
  )
}

function ProfileTab() {
  const { user, setUser } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()
  const [username, setUsername] = useState(user.username)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(event) {
    event.preventDefault()
    if (username.trim() === user.username) return
    setSaving(true)
    setError('')
    try {
      const { user: updated } = await authApi.updateProfile({ username: username.trim() })
      setUser(updated)
      toast.success(t('settings.toast.profileSaved'))
    } catch (apiError) {
      setError(apiError.fields?.username ?? apiError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-section">
      <AvatarPicker />
      <form onSubmit={save}>
        <FormField label={t('settings.username')} error={error} htmlFor="settings-username">
          {(props) => (
            <input {...props} className="input" value={username} onChange={(event) => setUsername(event.target.value)} />
          )}
        </FormField>
        <button type="submit" className="btn btn--primary" disabled={saving || username.trim() === user.username}>
          {t('settings.username.save')}
        </button>
      </form>
    </div>
  )
}

function EmailForm() {
  const { user, setUser } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function save(event) {
    event.preventDefault()
    const validation = validateEmailForm({ email, password }, t)
    if (validation.email || !password) {
      setErrors({ email: validation.email, currentPassword: !password ? validation.password : undefined })
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const { user: updated } = await authApi.updateEmail({ email: email.trim().toLowerCase(), currentPassword: password })
      setUser(updated)
      setEmail('')
      setPassword('')
      toast.success(t('settings.toast.emailSaved'))
    } catch (apiError) {
      setErrors({ email: apiError.fields?.email, currentPassword: apiError.fields?.currentPassword ?? (!apiError.fields ? apiError.message : undefined) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save}>
      <FormField label={t('settings.email.current')} htmlFor="settings-current-email">
        {(props) => <input {...props} className="input" value={user.email} disabled />}
      </FormField>
      <FormField label={t('settings.email.new')} error={errors.email} htmlFor="settings-new-email">
        {(props) => (
          <input {...props} className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        )}
      </FormField>
      <FormField label={t('settings.password.current')} error={errors.currentPassword} htmlFor="settings-email-password">
        {(props) => (
          <input {...props} className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        )}
      </FormField>
      <button type="submit" className="btn btn--primary" disabled={saving || !email || !password}>
        {t('settings.email.save')}
      </button>
    </form>
  )
}

function PasswordForm() {
  const { t } = useLanguage()
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function save(event) {
    event.preventDefault()
    if (next.length < 8) {
      setErrors({ newPassword: t('auth.field.passwordHint') })
      return
    }
    setErrors({})
    setSaving(true)
    try {
      await authApi.updatePassword({ currentPassword: current, newPassword: next })
      setCurrent('')
      setNext('')
      toast.success(t('settings.toast.passwordSaved'))
    } catch (apiError) {
      setErrors({
        currentPassword: apiError.fields?.currentPassword,
        newPassword: apiError.fields?.newPassword,
      })
      if (!apiError.fields || Object.keys(apiError.fields).length === 0) toast.error(apiError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save}>
      <FormField label={t('settings.password.current')} error={errors.currentPassword} htmlFor="settings-current-password">
        {(props) => (
          <input {...props} className="input" type="password" value={current} onChange={(event) => setCurrent(event.target.value)} />
        )}
      </FormField>
      <FormField label={t('settings.password.new')} error={errors.newPassword} hint={t('auth.field.passwordHint')} htmlFor="settings-new-password">
        {(props) => (
          <input {...props} className="input" type="password" value={next} onChange={(event) => setNext(event.target.value)} />
        )}
      </FormField>
      <button type="submit" className="btn btn--primary" disabled={saving || !current || !next}>
        {t('settings.password.save')}
      </button>
    </form>
  )
}

function AppearanceTab() {
  const { theme, toggle } = useTheme()
  const { lang, setLang, t } = useLanguage()

  return (
    <div className="settings-section">
      <FormField label={t('settings.theme')}>
        {() => (
          <div className="segmented" role="group" aria-label={t('settings.theme')}>
            <button type="button" className={`segmented__option ${theme === 'light' ? 'is-active' : ''}`.trim()} onClick={() => theme === 'dark' && toggle()}>
              <Sun size={15} aria-hidden="true" />
              {t('settings.theme.light')}
            </button>
            <button type="button" className={`segmented__option ${theme === 'dark' ? 'is-active' : ''}`.trim()} onClick={() => theme === 'light' && toggle()}>
              <Moon size={15} aria-hidden="true" />
              {t('settings.theme.dark')}
            </button>
          </div>
        )}
      </FormField>
      <FormField label={t('settings.language')}>
        {() => (
          <div className="segmented" role="group" aria-label={t('settings.language')}>
            <button type="button" className={`segmented__option ${lang === 'ru' ? 'is-active' : ''}`.trim()} onClick={() => setLang('ru')}>
              Русский
            </button>
            <button type="button" className={`segmented__option ${lang === 'en' ? 'is-active' : ''}`.trim()} onClick={() => setLang('en')}>
              English
            </button>
          </div>
        )}
      </FormField>
    </div>
  )
}

const TABS = [
  { id: 'profile', labelKey: 'settings.tab.profile', render: () => <ProfileTab /> },
  {
    id: 'security',
    labelKey: 'settings.tab.security',
    render: () => (
      <div className="settings-section">
        <EmailForm />
        <hr className="divider" style={{ margin: 0 }} />
        <PasswordForm />
      </div>
    ),
  },
  { id: 'appearance', labelKey: 'settings.tab.appearance', render: () => <AppearanceTab /> },
]

export function SettingsDialog({ onClose }) {
  const { t } = useLanguage()
  const [tab, setTab] = useState('profile')

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const active = TABS.find((item) => item.id === tab)

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-dialog__header">
          <h2 id="settings-title">{t('settings.title')}</h2>
          <button type="button" className="icon-btn" style={{ color: 'var(--color-text)' }} onClick={onClose} aria-label={t('settings.close')}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="settings-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`settings-tabs__tab ${tab === item.id ? 'is-active' : ''}`.trim()}
              onClick={() => setTab(item.id)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
        <div className="settings-dialog__body">{active.render()}</div>
      </div>
    </div>
  )
}
