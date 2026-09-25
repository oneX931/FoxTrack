import en from './en.js'
import ru from './ru.js'

export const LANGUAGES = ['ru', 'en']
export const DEFAULT_LANGUAGE = 'ru'
const DICTIONARIES = { ru, en }

function interpolate(template, vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}

export function translate(lang, key, vars) {
  const template = DICTIONARIES[lang]?.[key] ?? DICTIONARIES[DEFAULT_LANGUAGE][key] ?? key
  return interpolate(template, vars)
}

function ruPluralSuffix(count) {
  const mod10 = Math.abs(count) % 10
  const mod100 = Math.abs(count) % 100
  if (mod100 >= 11 && mod100 <= 14) return 'many'
  if (mod10 === 1) return 'one'
  if (mod10 >= 2 && mod10 <= 4) return 'few'
  return 'many'
}

export function translateCount(lang, baseKey, count, vars) {
  const suffix = lang === 'ru' ? ruPluralSuffix(count) : count === 1 ? 'one' : 'other'
  return translate(lang, `${baseKey}.${suffix}`, { count, ...vars })
}
