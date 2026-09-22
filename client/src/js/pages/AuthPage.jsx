import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, TriangleAlert, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { FormField } from '../components/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { validateLogin, validateRegister } from '../utils/validation.js'

export function AuthPage() {
  const { t } = useLanguage()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const title = t(mode === 'login' ? 'auth.login.title' : 'auth.register.title', { app: 'FoxTrack' })
  useDocumentTitle(title)

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => (current[name] ? { ...current, [name]: undefined } : current))
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setFieldErrors({})
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = mode === 'login' ? validateLogin(form, t) : validateRegister(form, t)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setFormError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login({ email: form.email.trim().toLowerCase(), password: form.password })
      } else {
        await register({ username: form.username.trim(), email: form.email.trim().toLowerCase(), password: form.password })
      }
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (error) {
      if (Object.keys(error.fields ?? {}).length > 0) setFieldErrors(error.fields)
      else setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="centered-page">
      <section className="auth-shell" aria-labelledby="auth-title">
        <div className="panel">
          <div className="tabs" role="tablist" aria-label={t('auth.tab.login')}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`tabs__tab ${mode === 'login' ? 'is-active' : ''}`.trim()}
              onClick={() => switchMode('login')}
            >
              {t('auth.tab.login')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`tabs__tab ${mode === 'register' ? 'is-active' : ''}`.trim()}
              onClick={() => switchMode('register')}
            >
              {t('auth.tab.register')}
            </button>
          </div>

          <h1 id="auth-title" className="page-title" style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.375rem' }}>
            {title}
          </h1>
          <p className="muted" style={{ marginTop: '0.25rem', marginBottom: 'var(--space-5)' }}>
            {t(mode === 'login' ? 'auth.login.subtitle' : 'auth.register.subtitle')}
          </p>

          {formError && (
            <p className="form-error-banner" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
              <TriangleAlert size={16} aria-hidden="true" />
              {formError}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {mode === 'register' && (
              <FormField label={t('auth.field.username')} error={fieldErrors.username} hint={t('auth.field.usernameHint')}>
                {(props) => (
                  <div className="input-wrap">
                    <User className="input-wrap__icon" size={18} aria-hidden="true" />
                    <input
                      {...props}
                      className="input"
                      type="text"
                      autoComplete="username"
                      value={form.username}
                      onChange={(event) => updateField('username', event.target.value)}
                    />
                  </div>
                )}
              </FormField>
            )}

            <FormField label={t('auth.field.email')} error={fieldErrors.email}>
              {(props) => (
                <div className="input-wrap">
                  <Mail className="input-wrap__icon" size={18} aria-hidden="true" />
                  <input
                    {...props}
                    className="input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                  />
                </div>
              )}
            </FormField>

            <FormField
              label={t('auth.field.password')}
              error={fieldErrors.password}
              hint={mode === 'register' ? t('auth.field.passwordHint') : undefined}
            >
              {(props) => (
                <div className="input-wrap">
                  <Lock className="input-wrap__icon" size={18} aria-hidden="true" />
                  <input
                    {...props}
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                  />
                  <button
                    type="button"
                    className="input-wrap__trailing"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              )}
            </FormField>

            <button type="submit" className={`btn btn--primary btn--block ${submitting ? 'btn--spinning' : ''}`.trim()} disabled={submitting}>
              {submitting && <span className="spinner" aria-hidden="true" />}
              {t(submitting ? `auth.${mode}.submitting` : `auth.${mode}.submit`)}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
