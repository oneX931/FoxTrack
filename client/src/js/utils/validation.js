import { countCharacters } from './format.js'

export const REVIEW_MAX_LENGTH = 1000

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const USERNAME_PATTERN = /^[\p{L}\p{N}._-]+$/u

function checkEmail(email, errors, t) {
  const value = email.trim()
  if (!value) errors.email = t('validation.email.required')
  else if (value.length > 254 || !EMAIL_PATTERN.test(value)) errors.email = t('validation.email.invalid')
}

export function validateRegister({ username, email, password }, t) {
  const errors = {}
  const name = username.trim()
  if (!name) errors.username = t('validation.username.required')
  else if (name.length < 3) errors.username = t('validation.username.min')
  else if (name.length > 30) errors.username = t('validation.username.max')
  else if (!USERNAME_PATTERN.test(name)) errors.username = t('validation.username.chars')

  checkEmail(email, errors, t)

  if (!password) errors.password = t('validation.password.required')
  else if (password.length < 8) errors.password = t('validation.password.min')
  else if (password.length > 128) errors.password = t('validation.password.max')
  return errors
}

export function validateLogin({ email, password }, t) {
  const errors = {}
  checkEmail(email, errors, t)
  if (!password) errors.password = t('validation.password.required')
  return errors
}

export function validateSearch(query, t) {
  const value = query.trim()
  if (value.length < 2) return t('validation.search.min')
  if (value.length > 100) return t('validation.search.max')
  return ''
}

export function validateReview(value, t) {
  return countCharacters(value.trim()) > REVIEW_MAX_LENGTH ? t('validation.review.max', { max: REVIEW_MAX_LENGTH }) : ''
}
