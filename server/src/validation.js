import { z } from 'zod'
import { STATUSES, REVIEW_MAX_LENGTH } from './constants.js'
import { validationError } from './errors.js'

z.config(z.locales.ru())

const email = z
  .string({ error: 'Введите адрес электронной почты' })
  .trim()
  .toLowerCase()
  .min(1, 'Введите адрес электронной почты')
  .max(254, 'Слишком длинный адрес')

export const registerSchema = z.strictObject({
  username: z
    .string({ error: 'Введите имя пользователя' })
    .trim()
    .min(3, 'Имя пользователя: минимум 3 символа')
    .max(30, 'Имя пользователя: максимум 30 символов')
    .regex(/^[\p{L}\p{N}._-]+$/u, 'Допустимы буквы, цифры и символы «.», «_», «-»'),
  email: email.pipe(z.email('Введите корректный адрес электронной почты')),
  password: z
    .string({ error: 'Введите пароль' })
    .min(8, 'Пароль: минимум 8 символов')
    .max(128, 'Пароль: максимум 128 символов'),
})

export const loginSchema = z.strictObject({
  email,
  password: z.string({ error: 'Введите пароль' }).min(1, 'Введите пароль').max(128, 'Слишком длинный пароль'),
})

export const searchQuerySchema = z.object({
  q: z
    .string({ error: 'Введите название игры' })
    .trim()
    .min(2, 'Введите не меньше двух символов')
    .max(100, 'Название слишком длинное'),
  page: z.coerce.number({ error: 'Некорректный номер страницы' }).int().min(1).max(50).default(1),
})

export const libraryQuerySchema = z.object({
  q: z.string({ error: 'Некорректный поисковый запрос' }).trim().max(100, 'Запрос слишком длинный').optional(),
  status: z.enum(STATUSES, { error: 'Неизвестный статус' }).optional(),
  platform: z.string({ error: 'Некорректная платформа' }).trim().max(120, 'Название платформы слишком длинное').optional(),
})

export const addGameSchema = z
  .strictObject({
    gameIds: z
      .array(z.number({ error: 'Некорректный идентификатор игры' }).int().positive(), {
        error: 'Не указаны записи игры',
      })
      .min(1, 'Не указаны записи игры')
      .max(40, 'Слишком много записей'),
    selectedGameIds: z
      .array(z.number({ error: 'Выберите платформу' }).int().positive(), { error: 'Выберите хотя бы одну платформу' })
      .min(1, 'Выберите хотя бы одну платформу')
      .max(40, 'Слишком много платформ'),
  })
  .refine((data) => data.selectedGameIds.every((id) => data.gameIds.includes(id)), {
    path: ['selectedGameIds'],
    error: 'Выберите платформу из списка',
  })

export const updateGameSchema = z.strictObject({
  status: z.enum(STATUSES, { error: 'Выберите один из статусов' }).optional(),
  selectedPlatforms: z
    .array(z.string().trim().min(1).max(120), { error: 'Выберите хотя бы одну платформу' })
    .min(1, 'Выберите хотя бы одну платформу')
    .max(40)
    .optional(),
  rating: z
    .number({ error: 'Оценка должна быть числом' })
    .int('Оценка должна быть целым числом')
    .min(1, 'Оценка: от 1 до 10')
    .max(10, 'Оценка: от 1 до 10')
    .nullable()
    .optional(),
  review: z.string({ error: 'Отзыв должен быть текстом' }).nullable().optional(),
})

const password = z.string({ error: 'Введите пароль' }).min(1, 'Введите пароль').max(128, 'Слишком длинный пароль')
const newPassword = z.string({ error: 'Введите новый пароль' }).min(8, 'Пароль: минимум 8 символов').max(128, 'Пароль: максимум 128 символов')
const username = z
  .string({ error: 'Введите имя пользователя' })
  .trim()
  .min(3, 'Имя пользователя: минимум 3 символа')
  .max(30, 'Имя пользователя: максимум 30 символов')
  .regex(/^[\p{L}\p{N}._-]+$/u, 'Допустимы буквы, цифры и символы «.», «_», «-»')
const avatarDataUrl = z
  .string()
  .max(150_000, 'Изображение слишком большое')
  .regex(/^data:image\/(png|jpeg|webp);base64,/, 'Неподдерживаемый формат изображения')

export const updateProfileSchema = z.strictObject({
  username: username.optional(),
  avatar: avatarDataUrl.nullable().optional(),
})

export const updateEmailSchema = z.strictObject({
  email: email.pipe(z.email('Введите корректный адрес электронной почты')),
  currentPassword: password,
})

export const updatePasswordSchema = z.strictObject({
  currentPassword: password,
  newPassword,
})

export function countCharacters(value) {
  return [...value].length
}

export function normalizeReview(value) {
  if (value === undefined) return { provided: false }
  const text = value === null ? '' : value.trim()
  if (countCharacters(text) > REVIEW_MAX_LENGTH) {
    throw validationError({ review: `Отзыв: максимум ${REVIEW_MAX_LENGTH} символов` })
  }
  return { provided: true, value: text || null }
}

export function parseWith(schema, input) {
  const result = schema.safeParse(input)
  if (result.success) return result.data
  const fields = {}
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_'
    if (!(key in fields)) fields[key] = issue.message
  }
  throw validationError(fields)
}
