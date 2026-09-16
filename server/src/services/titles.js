const EDITION_WORDS = [
  'edition',
  'deluxe',
  'ultra',
  'ultimate',
  'super',
  'mega',
  'special',
  'limited',
  "collector'?s?",
  'platinum',
  'digital',
  'standard',
  'complete',
  'definitive',
  'remaster(?:ed)?',
  'goty',
  'anniversary',
  'extended',
  "director'?s? cut",
  'gold',
  'essentials?',
  'classics?',
  'hd',
  'remake',
  'enhanced',
  'premium',
  'exclusive',
  'bundle',
  'hits',
  'value',
  'budget',
  "player'?s? choice",
  'award',
  "critics'? award",
  'game of the year',
  'player of the year',
]

const EDITION_TAIL = new RegExp(`(?:[\\s:!,-]+(?:${EDITION_WORDS.join('|')}))+\\s*$`, 'giu')

/** Strips bracketed annotations and trailing marketing/edition words used for many re-releases
 *  of the same base game ("[Platinum Hits]", "- Digital Deluxe Edition", "(Collector's Edition)")
 *  so those variants group with the base title instead of appearing as unrelated search results. */
export function stripEditionNoise(title) {
  let value = String(title ?? '')
    .replace(/\[[^\]]*\]/gu, ' ')
    .replace(/\([^)]*\)/gu, ' ')
    .trim()

  for (let guard = 0; guard < 8; guard += 1) {
    const next = value.replace(EDITION_TAIL, '').trim()
    if (next === value) break
    value = next
  }

  return value.replace(/[\s:,-]+$/u, '').trim() || String(title ?? '').trim()
}

export function titleKey(title) {
  return stripEditionNoise(title)
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/['’‘`´]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function yearOf(date) {
  const match = /^(\d{4})/.exec(date ?? '')
  return match ? Number(match[1]) : null
}

export function compareReleases(a, b) {
  if (Boolean(a.releaseDate) !== Boolean(b.releaseDate)) return a.releaseDate ? -1 : 1
  if (a.releaseDate && b.releaseDate && a.releaseDate !== b.releaseDate) {
    return a.releaseDate < b.releaseDate ? -1 : 1
  }
  return 0
}

function byCleanestTitle(a, b) {
  return a.title.length - b.title.length || compareReleases(a, b) || a.id - b.id
}

export function buildGroup(key, entries) {
  const ordered = [...entries].sort((a, b) => compareReleases(a, b) || a.id - b.id)
  const perPlatform = new Map()
  for (const entry of ordered) {
    if (!perPlatform.has(entry.platformName)) perPlatform.set(entry.platformName, entry)
  }
  const platforms = [...perPlatform.values()]
    .sort((a, b) => compareReleases(a, b) || a.platformName.localeCompare(b.platformName))
    .map((entry) => ({ gameId: entry.id, name: entry.platformName, year: yearOf(entry.releaseDate) }))
  const primary = [...entries].sort(byCleanestTitle)[0]
  const withCover = ordered.find((entry) => entry.cover?.small)
  return {
    key,
    title: primary.title,
    year: yearOf(ordered[0].releaseDate),
    cover: withCover?.cover.small ?? null,
    platforms,
  }
}

export function groupGames(games) {
  const buckets = new Map()
  for (const game of games) {
    const key = titleKey(game.title)
    if (!key) continue
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(game)
  }
  return [...buckets].map(([key, entries]) => buildGroup(key, entries))
}
