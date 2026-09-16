import { Router } from 'express'
import { COMPLETED_STATUS, STATUSES } from '../constants.js'
import { isUniqueViolation } from '../db.js'
import { conflict, HttpError, notFound, validationError } from '../errors.js'
import { cleanReleaseDate } from '../services/dates.js'
import { buildGroup, compareReleases, titleKey } from '../services/titles.js'
import { addGameSchema, libraryQuerySchema, normalizeReview, parseWith, updateGameSchema } from '../validation.js'

const ALL = 'Все'

function parseList(value) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function toCard(row) {
  return {
    id: row.id,
    title: row.title,
    coverUrl: row.cover_url,
    selectedPlatforms: parseList(row.selected_platforms),
    status: row.status,
    rating: row.status === COMPLETED_STATUS ? row.rating : null,
  }
}

function toDetail(row) {
  const completed = row.status === COMPLETED_STATUS
  return {
    id: row.id,
    thegamesdbId: row.thegamesdb_id,
    title: row.title,
    coverUrl: row.cover_url,
    description: row.description,
    releaseDate: cleanReleaseDate(row.release_date),
    genres: parseList(row.genres),
    platforms: parseList(row.platforms),
    selectedPlatforms: parseList(row.selected_platforms),
    status: row.status,
    rating: completed ? row.rating : null,
    review: completed ? row.review : null,
    addedAt: row.added_at,
  }
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

function parseId(value) {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id < 1) throw notFound('Игра не найдена в вашей библиотеке.')
  return id
}

function alreadyInLibrary(existingId) {
  return conflict('GAME_ALREADY_IN_LIBRARY', 'Эта игра уже есть в вашей библиотеке.', { existingId })
}

export function createLibraryRouter({ db, tgdb }) {
  const router = Router()

  const findOwned = db.prepare('SELECT * FROM user_games WHERE id = ? AND user_id = ?')
  const findByTitleKey = db.prepare('SELECT id FROM user_games WHERE user_id = ? AND title_key = ?')
  const countByStatus = db.prepare('SELECT status, COUNT(*) AS total FROM user_games WHERE user_id = ? GROUP BY status')
  const usedPlatforms = db.prepare(
    `SELECT DISTINCT je.value AS name
       FROM user_games, json_each(user_games.selected_platforms) AS je
      WHERE user_games.user_id = ?
      ORDER BY name COLLATE NOCASE`,
  )
  const insertGame = db.prepare(
    `INSERT INTO user_games
       (user_id, thegamesdb_id, title_key, title, cover_url, description, release_date, genres, platforms, selected_platforms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )

  function requireOwned(id, userId) {
    const row = findOwned.get(id, userId)
    if (!row) throw notFound('Игра не найдена в вашей библиотеке.')
    return row
  }

  router.get('/', (req, res) => {
    const input = Object.fromEntries(Object.entries(req.query).filter(([, value]) => value !== ''))
    const { q, status, platform } = parseWith(libraryQuerySchema, input)

    const clauses = ['user_id = ?']
    const params = [req.user.id]
    const queryKey = q ? titleKey(q) : ''
    if (queryKey) {
      clauses.push("title_key LIKE ? ESCAPE '\\'")
      params.push(`%${escapeLike(queryKey)}%`)
    }
    if (status) {
      clauses.push('status = ?')
      params.push(status)
    }
    if (platform) {
      clauses.push('EXISTS (SELECT 1 FROM json_each(user_games.selected_platforms) WHERE value = ?)')
      params.push(platform)
    }

    const rows = db
      .prepare(
        `SELECT id, title, cover_url, selected_platforms, status, rating
           FROM user_games
          WHERE ${clauses.join(' AND ')}
          ORDER BY added_at DESC, id DESC`,
      )
      .all(...params)

    const counts = Object.fromEntries([ALL, ...STATUSES].map((name) => [name, 0]))
    for (const row of countByStatus.all(req.user.id)) {
      counts[row.status] = row.total
      counts[ALL] += row.total
    }

    res.json({
      items: rows.map(toCard),
      total: rows.length,
      filters: { platforms: usedPlatforms.all(req.user.id).map((row) => row.name), counts },
    })
  })

  router.get('/:id', (req, res) => {
    res.json({ game: toDetail(requireOwned(parseId(req.params.id), req.user.id)) })
  })

  router.post('/', async (req, res) => {
    const { gameIds, selectedGameIds } = parseWith(addGameSchema, req.body)
    const userId = req.user.id
    const ids = [...new Set(gameIds)]
    const selectedIds = [...new Set(selectedGameIds)]

    const placeholders = ids.map(() => '?').join(', ')
    const known = db
      .prepare(`SELECT id FROM user_games WHERE user_id = ? AND thegamesdb_id IN (${placeholders})`)
      .get(userId, ...ids)
    if (known) throw alreadyInLibrary(known.id)

    const games = await tgdb.getGames(ids)
    const selected = games.filter((game) => selectedIds.includes(game.id))
    if (selected.length !== selectedIds.length) {
      throw new HttpError(404, 'GAME_NOT_FOUND', 'Игра не найдена в TheGamesDB. Повторите поиск и попробуйте снова.')
    }

    const key = titleKey(selected[0].title)
    const related = games.filter((game) => titleKey(game.title) === key)
    const duplicate = findByTitleKey.get(userId, key)
    if (duplicate) throw alreadyInLibrary(duplicate.id)

    const group = buildGroup(key, related)
    const primary = [...selected].sort((a, b) => compareReleases(a, b) || a.id - b.id)[0]
    const ordered = [...related].sort((a, b) => compareReleases(a, b) || a.id - b.id)
    const genres = primary.genres.length > 0 ? primary.genres : (ordered.find((game) => game.genres.length > 0)?.genres ?? [])
    const selectedPlatforms = [...new Set(selected.map((game) => game.platformName))].sort((a, b) =>
      a.localeCompare(b),
    )

    let id
    try {
      id = Number(
        insertGame.run(
          userId,
          primary.id,
          key,
          group.title,
          primary.cover?.medium ?? ordered.find((game) => game.cover)?.cover.medium ?? null,
          primary.overview ?? ordered.find((game) => game.overview)?.overview ?? null,
          primary.releaseDate ?? ordered.find((game) => game.releaseDate)?.releaseDate ?? null,
          JSON.stringify(genres),
          JSON.stringify(group.platforms.map((platform) => platform.name)),
          JSON.stringify(selectedPlatforms),
        ).lastInsertRowid,
      )
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
      throw alreadyInLibrary(findByTitleKey.get(userId, key)?.id ?? null)
    }

    res.status(201).json({ game: toDetail(findOwned.get(id, userId)) })
  })

  router.patch('/:id', (req, res) => {
    const id = parseId(req.params.id)
    const patch = parseWith(updateGameSchema, req.body)
    const row = requireOwned(id, req.user.id)
    const nextStatus = patch.status ?? row.status

    const fields = {}
    if (patch.selectedPlatforms !== undefined) {
      const available = parseList(row.platforms)
      const unknown = patch.selectedPlatforms.filter((name) => !available.includes(name))
      if (unknown.length > 0) fields.selectedPlatforms = 'Выберите платформы из списка платформ этой игры'
    }
    if (nextStatus !== COMPLETED_STATUS) {
      if (patch.rating !== undefined && patch.rating !== null) {
        fields.rating = 'Оценку можно поставить только пройденной игре'
      }
      if (typeof patch.review === 'string' && patch.review.trim() !== '') {
        fields.review = 'Отзыв можно оставить только для пройденной игры'
      }
    }
    if (Object.keys(fields).length > 0) throw validationError(fields)

    const review = normalizeReview(patch.review)
    const sets = []
    const values = []
    const assign = (column, value) => {
      sets.push(`${column} = ?`)
      values.push(value)
    }
    if (patch.status !== undefined) assign('status', patch.status)
    if (patch.selectedPlatforms !== undefined) {
      const unique = [...new Set(patch.selectedPlatforms)].sort((a, b) => a.localeCompare(b))
      assign('selected_platforms', JSON.stringify(unique))
    }
    if (patch.rating !== undefined) assign('rating', patch.rating)
    if (review.provided) assign('review', review.value)

    if (sets.length > 0) {
      db.prepare(`UPDATE user_games SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`).run(...values, id, req.user.id)
    }
    res.json({ game: toDetail(findOwned.get(id, req.user.id)) })
  })

  router.delete('/:id', (req, res) => {
    const id = parseId(req.params.id)
    const result = db.prepare('DELETE FROM user_games WHERE id = ? AND user_id = ?').run(id, req.user.id)
    if (result.changes === 0) throw notFound('Игра не найдена в вашей библиотеке.')
    res.status(204).end()
  })

  return router
}
