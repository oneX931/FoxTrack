export class HttpError extends Error {
  constructor(status, code, message, details = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function unauthorized(message = 'Войдите в аккаунт, чтобы продолжить.') {
  return new HttpError(401, 'UNAUTHORIZED', message)
}

export function notFound(message = 'Ничего не найдено.') {
  return new HttpError(404, 'NOT_FOUND', message)
}

export function conflict(code, message, details) {
  return new HttpError(409, code, message, details)
}

export function validationError(fields, message = 'Проверьте введённые данные.') {
  return new HttpError(400, 'VALIDATION_ERROR', message, { fields })
}
