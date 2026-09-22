import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authApi, onUnauthorized } from '../api/client.js'
import { useLanguage } from './LanguageContext.jsx'
import { useToast } from './ToastContext.jsx'

const AuthContext = createContext(null)

const LOADING = { status: 'loading', user: null, error: null, reason: null }

export function AuthProvider({ children }) {
  const toast = useToast()
  const { t } = useLanguage()
  const [state, setState] = useState(LOADING)
  const [attempt, setAttempt] = useState(0)
  const userRef = useRef(null)

  useEffect(() => {
    userRef.current = state.user
  }, [state.user])

  useEffect(() => {
    const controller = new AbortController()
    setState((current) => (current.status === 'ready' ? current : LOADING))

    authApi.me(controller.signal).then(
      ({ user }) => setState({ status: 'ready', user, error: null, reason: null }),
      (error) => {
        if (error.name === 'AbortError') return
        if (error.status === 401) setState({ status: 'ready', user: null, error: null, reason: null })
        else setState({ status: 'error', user: null, error, reason: null })
      },
    )

    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    onUnauthorized(() => {
      if (!userRef.current) return
      setState({ status: 'ready', user: null, error: null, reason: 'expired' })
      toast.info(t('auth.sessionExpired'))
    })
    return () => onUnauthorized(null)
  }, [toast, t])

  const login = useCallback(async (credentials) => {
    const { user } = await authApi.login(credentials)
    setState({ status: 'ready', user, error: null, reason: null })
    return user
  }, [])

  const register = useCallback(async (details) => {
    const { user } = await authApi.register(details)
    setState({ status: 'ready', user, error: null, reason: null })
    return user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      toast.error(error.message)
      return
    }
    setState({ status: 'ready', user: null, error: null, reason: 'logout' })
  }, [toast])

  const setUser = useCallback((user) => {
    setState((current) => ({ ...current, user }))
  }, [])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  const value = useMemo(
    () => ({ ...state, login, register, logout, setUser, retry }),
    [state, login, register, logout, setUser, retry],
  )
  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth() {
  return useContext(AuthContext)
}
