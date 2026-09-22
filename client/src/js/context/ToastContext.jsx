import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }
const LIFETIME = { success: 5000, info: 6000, error: 8000 }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (kind, message, action) => {
      counter.current += 1
      const id = counter.current
      setToasts((current) => [...current.slice(-2), { id, kind, message, action }])
      setTimeout(() => dismiss(id), LIFETIME[kind])
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      success: (message, action) => push('success', message, action),
      error: (message, action) => push('error', message, action),
      info: (message, action) => push('info', message, action),
    }),
    [push],
  )

  return (
    <ToastContext value={api}>
      {children}
      <div className="toasts" role="region" aria-label="Уведомления">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.kind]
          return (
            <div
              key={toast.id}
              className={`toast toast--${toast.kind}`}
              role={toast.kind === 'error' ? 'alert' : 'status'}
            >
              <Icon className="toast__icon" size={20} aria-hidden="true" />
              <p className="toast__text">{toast.message}</p>
              {toast.action && (
                <Link className="toast__action" to={toast.action.to} onClick={() => dismiss(toast.id)}>
                  {toast.action.label}
                </Link>
              )}
              <button type="button" className="toast__close" onClick={() => dismiss(toast.id)} aria-label="Закрыть уведомление">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
