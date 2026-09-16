import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { HttpError } from '../errors.js'
import { groupGames } from '../services/titles.js'
import { parseWith, searchQuerySchema } from '../validation.js'

export function createSearchRouter({ db, tgdb, config }) {
  const router = Router()

  const limiter = rateLimit({
    windowMs: config.rateLimit.searchWindowMs,
    limit: config.rateLimit.searchMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => `user:${req.user.id}`,
    handler: (req, res, next) =>
      next(new HttpError(429, 'RATE_LIMITED', 'Слишком много поисковых запросов. Подождите минуту.')),
  })

  const ownedTitles = db.prepare('SELECT id, title_key FROM user_games WHERE user_id = ?')

  router.get('/', limiter, async (req, res) => {
    const { q, page } = parseWith(searchQuerySchema, req.query)
    const { games, hasMore } = await tgdb.searchGames(q, page)
    const owned = new Map(ownedTitles.all(req.user.id).map((row) => [row.title_key, row.id]))
    const results = groupGames(games).map((group) => ({ ...group, libraryGameId: owned.get(group.key) ?? null }))
    res.json({ query: q, page, hasMore, results })
  })

  return router
}
