import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function toBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

function toNumber(value, fallback) {
  if (value === undefined || value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toList(value, fallback) {
  if (!value) return fallback
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function resolvePath(value, fallback) {
  const target = value || fallback
  return target === ':memory:' ? target : path.resolve(serverRoot, target)
}

export function loadConfig(env = process.env) {
  return {
    port: toNumber(env.PORT, 3001),
    host: env.HOST || undefined,
    databasePath: resolvePath(env.DATABASE_PATH, './data/foxtrack.db'),
    staticDir: resolvePath(env.STATIC_DIR, '../client/dist'),
    tgdbApiKey: (env.TGDB_API_KEY || '').trim(),
    tgdbBaseUrl: (env.TGDB_BASE_URL || 'https://api.thegamesdb.net/v1').trim(),
    cookieSecure: toBoolean(env.COOKIE_SECURE, false),
    sessionDays: toNumber(env.SESSION_DAYS, 30),
    trustProxy: toBoolean(env.TRUST_PROXY, false),
    logRequests: toBoolean(env.LOG_REQUESTS, true),
    allowedOrigins: toList(env.CLIENT_ORIGIN, ['http://localhost:5173', 'http://127.0.0.1:5173']),
    allowLanOrigins: toBoolean(env.ALLOW_LAN_ORIGINS, true),
    rateLimit: {
      authWindowMs: 15 * 60 * 1000,
      authMax: toNumber(env.RATE_LIMIT_AUTH_MAX, 30),
      searchWindowMs: 60 * 1000,
      searchMax: toNumber(env.RATE_LIMIT_SEARCH_MAX, 20),
    },
  }
}
