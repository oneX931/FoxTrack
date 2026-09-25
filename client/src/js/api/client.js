import { DEFAULT_LANGUAGE, translate } from '../i18n/index.js'

let currentLanguage = DEFAULT_LANGUAGE

export function setApiLanguage(lang) {
  currentLanguage = lang
}

// Error codes the server sends along with a Russian message; the client shows its own translation.
const FIELD_BY_CODE = { EMAIL_TAKEN: 'email', USERNAME_TAKEN: 'username', WRONG_PASSWORD: 'currentPassword' }

function localise(code, serverMessage, serverFields) {
  const key = `apiError.${code}`
  const message = translate(currentLanguage, key)
  if (message === key) return { message: serverMessage, fields: serverFields }
  const field = FIELD_BY_CODE[code]
  return { message, fields: field ? { [field]: message } : serverFields }
}

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', fields = {}, details = {} } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
    this.details = details
  }
}

let unauthorizedHandler = null

export function onUnauthorized(handler) {
  unauthorizedHandler = handler
}

async function request(path, { method = 'GET', body, signal, ignoreUnauthorized = false } = {}) {
  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers:
        body === undefined
          ? { Accept: 'application/json' }
          : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(translate(currentLanguage, 'apiError.NETWORK'), { code: 'NETWORK' })
  }

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && !ignoreUnauthorized) unauthorizedHandler?.()
    const { message, code, fields, ...details } = payload?.error ?? {}
    const localised = localise(code ?? 'HTTP_ERROR', message ?? translate(currentLanguage, 'apiError.HTTP_ERROR'), fields ?? {})
    throw new ApiError(localised.message, {
      status: response.status,
      code: code ?? 'HTTP_ERROR',
      fields: localised.fields,
      details,
    })
  }

  return payload
}

export const authApi = {
  me: (signal) => request('/auth/me', { signal, ignoreUnauthorized: true }),
  login: (body) => request('/auth/login', { method: 'POST', body, ignoreUnauthorized: true }),
  register: (body) => request('/auth/register', { method: 'POST', body, ignoreUnauthorized: true }),
  logout: () => request('/auth/logout', { method: 'POST', ignoreUnauthorized: true }),
  updateProfile: (body) => request('/auth/profile', { method: 'PATCH', body }),
  updateEmail: (body) => request('/auth/email', { method: 'PATCH', body }),
  updatePassword: (body) => request('/auth/password', { method: 'PATCH', body }),
}

export const searchApi = {
  search: (q, page, signal) => request(`/search?${new URLSearchParams({ q, page: String(page) })}`, { signal }),
}

export const libraryApi = {
  list: ({ q, status, platform }, signal) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (platform) params.set('platform', platform)
    const query = params.toString()
    return request(`/library${query ? `?${query}` : ''}`, { signal })
  },
  get: (id, signal) => request(`/library/${encodeURIComponent(id)}`, { signal }),
  add: (body) => request('/library', { method: 'POST', body }),
  update: (id, body) => request(`/library/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
  remove: (id) => request(`/library/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
