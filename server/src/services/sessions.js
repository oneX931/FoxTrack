import { createHash, randomBytes } from 'node:crypto'
import { SESSION_COOKIE } from '../constants.js'

const DAY_MS = 24 * 60 * 60 * 1000

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function createSessions({ db, config }) {
  const insert = db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
  const remove = db.prepare('DELETE FROM sessions WHERE id = ?')
  const purge = db.prepare('DELETE FROM sessions WHERE expires_at <= ?')
  const find = db.prepare(
    `SELECT u.id, u.username, u.email, u.avatar
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ?`,
  )

  function cookieOptions(expires) {
    return { httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, path: '/', ...(expires ? { expires } : {}) }
  }

  return {
    open(res, userId) {
      const token = randomBytes(32).toString('base64url')
      const expires = new Date(Date.now() + config.sessionDays * DAY_MS)
      purge.run(new Date().toISOString())
      insert.run(hashToken(token), userId, expires.toISOString())
      res.cookie(SESSION_COOKIE, token, cookieOptions(expires))
    },
    close(req, res) {
      const token = req.cookies?.[SESSION_COOKIE]
      if (typeof token === 'string' && token) remove.run(hashToken(token))
      res.clearCookie(SESSION_COOKIE, cookieOptions())
    },
    resolve(req) {
      const token = req.cookies?.[SESSION_COOKIE]
      if (typeof token !== 'string' || token.length === 0 || token.length > 128) return null
      const row = find.get(hashToken(token), new Date().toISOString())
      return row ? { id: row.id, username: row.username, email: row.email, avatar: row.avatar ?? null } : null
    },
  }
}
