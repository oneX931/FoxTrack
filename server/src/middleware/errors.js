import { HttpError, notFound } from '../errors.js'

export function apiNotFound(req, res, next) {
  next(notFound('Такого метода API не существует.'))
}

export function createErrorHandler(logger = console) {
  return function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error)

    if (error instanceof HttpError) {
      return res.status(error.status).json({
        error: { code: error.code, message: error.message, ...error.details },
      })
    }

    if (error?.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: { code: 'INVALID_JSON', message: 'Не удалось прочитать тело запроса.' },
      })
    }

    if (error?.type === 'entity.too.large') {
      return res.status(413).json({
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'Слишком большой запрос.' },
      })
    }

    logger.error(error)
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера. Попробуйте позже.' },
    })
  }
}

export function createRequestLogger(logger = console) {
  return function requestLogger(req, res, next) {
    const startedAt = process.hrtime.bigint()
    res.on('finish', () => {
      const elapsed = Number(process.hrtime.bigint() - startedAt) / 1e6
      logger.log(`${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${elapsed.toFixed(0)}ms`)
    })
    next()
  }
}
