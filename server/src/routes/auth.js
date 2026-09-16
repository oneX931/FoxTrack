import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { conflict, HttpError, unauthorized } from '../errors.js'
import { isUniqueViolation, uniqueViolationColumn } from '../db.js'
import { hashPassword, spendVerificationTime, verifyPassword } from '../services/passwords.js'
import {
  loginSchema,
  parseWith,
  registerSchema,
  updateEmailSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from '../validation.js'

const EMAIL_TAKEN = 'Аккаунт с таким адресом почты уже существует. Войдите или используйте другой адрес.'
const USERNAME_TAKEN = 'Это имя пользователя уже занято. Выберите другое.'
const WRONG_PASSWORD = 'Неверный текущий пароль.'

function publicUser(row) {
  return { id: row.id, username: row.username, email: row.email, avatar: row.avatar ?? null }
}

export function createAuthRouter({ db, config, sessions, requireAuth }) {
  const router = Router()

  const limiter = rateLimit({
    windowMs: config.rateLimit.authWindowMs,
    limit: config.rateLimit.authMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next) =>
      next(new HttpError(429, 'RATE_LIMITED', 'Слишком много попыток. Повторите через несколько минут.')),
  })

  const findByEmail = db.prepare('SELECT id, username, email, avatar, password_hash FROM users WHERE email = ?')
  const findByUsernameKey = db.prepare('SELECT id FROM users WHERE username_key = ?')
  const findById = db.prepare('SELECT id, username, email, avatar, password_hash FROM users WHERE id = ?')
  const insertUser = db.prepare(
    'INSERT INTO users (username, username_key, email, password_hash) VALUES (?, ?, ?, ?)',
  )

  function requireCurrentPassword(userId, currentPassword) {
    const row = findById.get(userId)
    return verifyPassword(currentPassword, row.password_hash).then((valid) => {
      if (!valid) throw new HttpError(403, 'WRONG_PASSWORD', WRONG_PASSWORD, { fields: { currentPassword: WRONG_PASSWORD } })
      return row
    })
  }

  router.post('/register', limiter, async (req, res) => {
    const { username, email, password } = parseWith(registerSchema, req.body)
    const usernameKey = username.normalize('NFKC').toLowerCase()

    if (findByEmail.get(email)) {
      throw conflict('EMAIL_TAKEN', EMAIL_TAKEN, { fields: { email: EMAIL_TAKEN } })
    }
    if (findByUsernameKey.get(usernameKey)) {
      throw conflict('USERNAME_TAKEN', USERNAME_TAKEN, { fields: { username: USERNAME_TAKEN } })
    }

    const passwordHash = await hashPassword(password)
    let userId
    try {
      userId = Number(insertUser.run(username, usernameKey, email, passwordHash).lastInsertRowid)
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
      const column = uniqueViolationColumn(error)
      if (column === 'users.username_key') {
        throw conflict('USERNAME_TAKEN', USERNAME_TAKEN, { fields: { username: USERNAME_TAKEN } })
      }
      throw conflict('EMAIL_TAKEN', EMAIL_TAKEN, { fields: { email: EMAIL_TAKEN } })
    }

    sessions.open(res, userId)
    res.status(201).json({ user: { id: userId, username, email, avatar: null } })
  })

  router.post('/login', limiter, async (req, res) => {
    const { email, password } = parseWith(loginSchema, req.body)
    const row = findByEmail.get(email)
    const valid = row ? await verifyPassword(password, row.password_hash) : (await spendVerificationTime(password), false)
    if (!valid) throw unauthorized('Неверный адрес почты или пароль.')

    sessions.open(res, row.id)
    res.json({ user: publicUser(row) })
  })

  router.post('/logout', (req, res) => {
    sessions.close(req, res)
    res.status(204).end()
  })

  router.get('/me', (req, res) => {
    const user = sessions.resolve(req)
    if (!user) throw unauthorized()
    res.json({ user })
  })

  router.patch('/profile', limiter, requireAuth, (req, res) => {
    const patch = parseWith(updateProfileSchema, req.body)
    const sets = []
    const values = []

    if (patch.username !== undefined) {
      const usernameKey = patch.username.normalize('NFKC').toLowerCase()
      const existing = findByUsernameKey.get(usernameKey)
      if (existing && existing.id !== req.user.id) {
        throw conflict('USERNAME_TAKEN', USERNAME_TAKEN, { fields: { username: USERNAME_TAKEN } })
      }
      sets.push('username = ?', 'username_key = ?')
      values.push(patch.username, usernameKey)
    }
    if (patch.avatar !== undefined) {
      sets.push('avatar = ?')
      values.push(patch.avatar)
    }

    if (sets.length > 0) {
      try {
        db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values, req.user.id)
      } catch (error) {
        if (!isUniqueViolation(error)) throw error
        throw conflict('USERNAME_TAKEN', USERNAME_TAKEN, { fields: { username: USERNAME_TAKEN } })
      }
    }
    res.json({ user: publicUser(findById.get(req.user.id)) })
  })

  router.patch('/email', limiter, requireAuth, async (req, res) => {
    const { email, currentPassword } = parseWith(updateEmailSchema, req.body)
    await requireCurrentPassword(req.user.id, currentPassword)

    const existing = findByEmail.get(email)
    if (existing && existing.id !== req.user.id) {
      throw conflict('EMAIL_TAKEN', EMAIL_TAKEN, { fields: { email: EMAIL_TAKEN } })
    }

    try {
      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, req.user.id)
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
      throw conflict('EMAIL_TAKEN', EMAIL_TAKEN, { fields: { email: EMAIL_TAKEN } })
    }
    res.json({ user: publicUser(findById.get(req.user.id)) })
  })

  router.patch('/password', limiter, requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = parseWith(updatePasswordSchema, req.body)
    await requireCurrentPassword(req.user.id, currentPassword)

    const passwordHash = await hashPassword(newPassword)
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, req.user.id)
    res.status(204).end()
  })

  return router
}
