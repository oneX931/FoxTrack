import { unauthorized } from '../errors.js'

export function createRequireAuth(sessions) {
  return function requireAuth(req, res, next) {
    const user = sessions.resolve(req)
    if (!user) return next(unauthorized())
    req.user = user
    next()
  }
}
