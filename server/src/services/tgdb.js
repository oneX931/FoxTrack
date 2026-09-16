import { HttpError } from '../errors.js'
import { cleanReleaseDate } from './dates.js'

const DEFAULT_IMAGE_BASE = 'https://cdn.thegamesdb.net/images/'
const DICTIONARY_TTL_MS = 30 * 24 * 60 * 60 * 1000
const SEARCH_CACHE_LIMIT = 200
const MAX_DETAIL_PAGES = 3

function cleanText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function joinUrl(base, filename) {
  return `${String(base).replace(/\/+$/, '')}/${String(filename).replace(/^\/+/, '')}`
}

function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

function pickCover(boxart, gameId) {
  const images = boxart?.data?.[String(gameId)]
  if (!Array.isArray(images)) return null
  const usable = images.filter((image) => image && typeof image.filename === 'string' && image.filename)
  const image =
    usable.find((item) => item.type === 'boxart' && item.side === 'front') ??
    usable.find((item) => item.type === 'boxart') ??
    usable[0]
  if (!image) return null
  const base = boxart?.base_url ?? {}
  const build = (sizes) => {
    for (const size of sizes) {
      if (!base[size]) continue
      const candidate = joinUrl(base[size], image.filename)
      if (isHttpUrl(candidate)) return candidate
    }
    return joinUrl(`${DEFAULT_IMAGE_BASE}${sizes[0]}`, image.filename)
  }
  return {
    small: build(['small', 'thumb', 'medium', 'original']),
    medium: build(['medium', 'large', 'small', 'original']),
  }
}

function normalizeGames(body, platformNames) {
  const games = Array.isArray(body?.data?.games) ? body.data.games : []
  const includedPlatforms = body?.include?.platform?.data
  const boxart = body?.include?.boxart
  return games
    .filter((game) => game && Number.isInteger(game.id) && cleanText(game.game_title))
    .map((game) => {
      const platformId = Number.isInteger(game.platform) ? game.platform : null
      const resolvedName =
        (platformId !== null && platformNames?.get(platformId)) ||
        cleanText(includedPlatforms?.[String(game.platform)]?.name)
      return {
        id: game.id,
        title: game.game_title.trim(),
        releaseDate: cleanReleaseDate(game.release_date),
        platformId,
        platformName: resolvedName ?? `Платформа ${game.platform ?? '?'}`,
        overview: cleanText(game.overview),
        genreIds: Array.isArray(game.genres) ? game.genres.filter(Number.isInteger) : [],
        cover: pickCover(boxart, game.id),
      }
    })
}

function unavailable() {
  return new HttpError(
    503,
    'TGDB_UNAVAILABLE',
    'TheGamesDB сейчас недоступен. Повторите попытку через несколько минут.',
  )
}

function isQuotaExhausted(body) {
  return Number(body?.allowance_refresh_timer) > 0
}

export function createTgdbClient({
  apiKey,
  baseUrl,
  db = null,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10000,
  searchTtlMs = 10 * 60 * 1000,
  logger = console,
}) {
  const searchCache = new Map()
  const state = { remainingAllowance: null }
  const dictionaryMemo = new Map()

  async function request(endpoint, params = {}) {
    if (!apiKey) {
      throw new HttpError(503, 'TGDB_NOT_CONFIGURED', 'Поиск недоступен: на сервере не указан ключ TheGamesDB.')
    }

    const url = new URL(`${baseUrl.replace(/\/+$/, '')}/${endpoint}`)
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
    }
    url.searchParams.set('apikey', apiKey)

    let response
    try {
      response = await fetchImpl(url, {
        headers: { accept: 'application/json', 'user-agent': 'FoxTrack/1.0' },
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      const reason = error?.name === 'TimeoutError' ? 'таймаут' : (error?.cause?.code ?? error?.name ?? 'ошибка сети')
      logger.warn(`[tgdb] ${endpoint}: ${reason}`)
      throw unavailable()
    }

    const body = await response.json().catch(() => null)
    if (typeof body?.remaining_monthly_allowance === 'number') {
      state.remainingAllowance = body.remaining_monthly_allowance
    }

    const code = Number(body?.code ?? response.status)
    if (response.ok && code === 200 && body && typeof body === 'object') return body

    logger.warn(`[tgdb] ${endpoint}: HTTP ${response.status}, код ${code}`)
    if (code === 429 || isQuotaExhausted(body)) {
      throw new HttpError(503, 'TGDB_QUOTA', 'Достигнут лимит запросов к TheGamesDB. Попробуйте позже.')
    }
    if (code === 401 || code === 403) {
      throw new HttpError(
        502,
        'TGDB_AUTH',
        'TheGamesDB не принял ключ доступа. Проверьте TGDB_API_KEY в настройках сервера.',
      )
    }
    throw unavailable()
  }

  /** Generic id -> name dictionary (Genres, Platforms, ...), cached in memory and in SQLite. */
  async function getDictionary(cacheName, endpoint, dataKey) {
    const now = Date.now()
    const memo = dictionaryMemo.get(cacheName)
    if (memo && now - memo.at < DICTIONARY_TTL_MS) return memo.map

    const stored = db?.prepare('SELECT payload, fetched_at FROM dictionary_cache WHERE name = ?').get(cacheName)
    if (stored && now - stored.fetched_at < DICTIONARY_TTL_MS) {
      const map = new Map(JSON.parse(stored.payload))
      dictionaryMemo.set(cacheName, { at: stored.fetched_at, map })
      return map
    }

    try {
      const body = await request(endpoint)
      const entries = Object.values(body?.data?.[dataKey] ?? {})
        .filter((item) => Number.isInteger(item?.id) && cleanText(item?.name))
        .map((item) => [item.id, item.name.trim()])
      if (entries.length === 0) throw unavailable()
      db?.prepare(
        `INSERT INTO dictionary_cache (name, payload, fetched_at) VALUES (?, ?, ?)
         ON CONFLICT (name) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`,
      ).run(cacheName, JSON.stringify(entries), now)
      const map = new Map(entries)
      dictionaryMemo.set(cacheName, { at: now, map })
      return map
    } catch (error) {
      if (!stored) throw error
      const map = new Map(JSON.parse(stored.payload))
      dictionaryMemo.set(cacheName, { at: now - DICTIONARY_TTL_MS / 2, map })
      return map
    }
  }

  const getGenres = () => getDictionary('genres', 'Genres', 'genres')
  const getPlatforms = () => getDictionary('platforms', 'Platforms', 'platforms')

  async function searchGames(name, page = 1) {
    const cacheKey = `${page}:${name.toLowerCase()}`
    const cached = searchCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) return cached.value

    const [body, platformNames] = await Promise.all([
      request('Games/ByGameName', { name, page, fields: 'platform', include: 'boxart,platform' }),
      getPlatforms().catch(() => null),
    ])
    const value = { games: normalizeGames(body, platformNames), hasMore: Boolean(body?.pages?.next), page }

    if (searchCache.size >= SEARCH_CACHE_LIMIT) searchCache.delete(searchCache.keys().next().value)
    searchCache.set(cacheKey, { value, expiresAt: Date.now() + searchTtlMs })
    return value
  }

  async function getGames(ids) {
    const [genres, platformNames] = await Promise.all([getGenres(), getPlatforms().catch(() => null)])
    const collected = []
    for (let page = 1; page <= MAX_DETAIL_PAGES; page += 1) {
      const body = await request('Games/ByGameID', {
        id: ids.join(','),
        page,
        fields: 'platform,genres,overview',
        include: 'boxart,platform',
      })
      collected.push(...normalizeGames(body, platformNames))
      if (!body?.pages?.next) break
    }
    return collected.map((game) => ({
      ...game,
      genres: game.genreIds.map((id) => genres.get(id)).filter(Boolean),
    }))
  }

  return {
    searchGames,
    getGames,
    getGenres,
    getPlatforms,
    state,
    clearCache() {
      searchCache.clear()
      dictionaryMemo.clear()
    },
  }
}
