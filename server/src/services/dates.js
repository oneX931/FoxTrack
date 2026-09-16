// TheGamesDB uses the Unix epoch (and an all-zero date) as a "release date unknown" placeholder.
const PLACEHOLDER_DATES = new Set(['1970-01-01', '0000-00-00', '0001-01-01'])

export function cleanReleaseDate(value) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text || PLACEHOLDER_DATES.has(text)) return null
  return text
}
