const GENRE_LABELS_RU = {
  Action: 'Экшен',
  Adventure: 'Приключения',
  'Construction and Management Simulation': 'Строительство и управление',
  'Role-Playing': 'Ролевая игра',
  Puzzle: 'Головоломка',
  Strategy: 'Стратегия',
  Racing: 'Гонки',
  Shooter: 'Шутер',
  'Life Simulation': 'Симулятор жизни',
  Fighting: 'Файтинг',
  Sports: 'Спорт',
  Sandbox: 'Песочница',
  'Flight Simulator': 'Авиасимулятор',
  Platform: 'Платформер',
  Stealth: 'Стелс',
  Music: 'Музыкальная',
  Horror: 'Хоррор',
  'Vehicle Simulation': 'Симулятор транспорта',
  Board: 'Настольная',
  Education: 'Обучающая',
  Family: 'Семейная',
  Party: 'Вечеринка',
  Quiz: 'Викторина',
}

const DATE_LOCALES = { ru: 'ru-RU', en: 'en-US' }
const dateFormatters = new Map()

function dateFormatter(lang) {
  const locale = DATE_LOCALES[lang] ?? DATE_LOCALES.ru
  if (!dateFormatters.has(locale)) {
    dateFormatters.set(locale, new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }))
  }
  return dateFormatters.get(locale)
}

/** Genre names come from TheGamesDB in English; for the English UI they're shown as-is, for the
 *  Russian UI they're mapped to a natural Russian label where we have one. */
export function genreLabel(name, lang) {
  if (lang === 'en') return name
  return GENRE_LABELS_RU[name] ?? name
}

export function formatReleaseDate(value, lang) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`)
    return Number.isNaN(date.getTime()) ? value : dateFormatter(lang).format(date)
  }
  return value
}

export function formatAddedDate(value, lang) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : dateFormatter(lang).format(date)
}

export function countCharacters(value) {
  return [...value].length
}
