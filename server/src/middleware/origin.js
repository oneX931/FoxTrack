import { HttpError } from '../errors.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

const PRIVATE_IPV4 = [/^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./]

/** localhost, loopback, RFC 1918 private ranges, link-local and *.local (mDNS) names. */
export function isLocalNetworkHost(hostname) {
  const host = String(hostname ?? '').replace(/^\[|\]$/g, '').toLowerCase()
  if (!host) return false
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true
  if (host === '::1' || /^fe80:/.test(host) || /^f[cd][0-9a-f]{2}:/.test(host)) return true
  return PRIVATE_IPV4.some((pattern) => pattern.test(host))
}

function forbidden() {
  return new HttpError(403, 'FORBIDDEN_ORIGIN', 'Запрос отклонён: недопустимый источник.')
}

export function createOriginGuard(allowedOrigins, { allowLanOrigins = false } = {}) {
  const allowed = new Set(allowedOrigins)

  return function originGuard(req, res, next) {
    if (SAFE_METHODS.has(req.method)) return next()
    const origin = req.get('origin')
    if (!origin || allowed.has(origin)) return next()

    let parsed
    try {
      parsed = new URL(origin)
    } catch {
      return next(forbidden())
    }

    // Same site: the origin's host (with port) or hostname (any port) is the one the request was addressed to.
    if (parsed.host === req.get('host') || parsed.hostname === req.hostname) return next()

    // Personal use on a home network: opening the app from a phone by the laptop's LAN address.
    // Cookies are SameSite=Lax and the API only accepts JSON, so this stays safe; it can be turned off.
    if (allowLanOrigins && isLocalNetworkHost(parsed.hostname)) return next()

    next(forbidden())
  }
}
