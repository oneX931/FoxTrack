function byRelease(a, b) {
  return (a.year ?? 9999) - (b.year ?? 9999) || a.name.localeCompare(b.name)
}

export function mergeGroups(current, incoming) {
  const merged = new Map(current.map((group) => [group.key, { ...group, platforms: [...group.platforms] }]))

  for (const group of incoming) {
    const existing = merged.get(group.key)
    if (!existing) {
      merged.set(group.key, { ...group, platforms: [...group.platforms] })
      continue
    }
    for (const platform of group.platforms) {
      const index = existing.platforms.findIndex((item) => item.name === platform.name)
      if (index === -1) existing.platforms.push(platform)
      else if (platform.gameId < existing.platforms[index].gameId) existing.platforms[index] = platform
    }
    existing.platforms.sort(byRelease)
    existing.year = Math.min(existing.year ?? 9999, group.year ?? 9999)
    if (existing.year === 9999) existing.year = null
    existing.cover ??= group.cover
    existing.libraryGameId ??= group.libraryGameId
  }

  return [...merged.values()]
}
