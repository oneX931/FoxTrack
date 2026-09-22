const FAMILIES = [
  { id: 'playstation', test: /playstation|\bpsp\b|\bvita\b|\bps[1-5]\b/i, color: '#2c6fd1' },
  { id: 'xbox', test: /\bxbox\b/i, color: '#5b8f3b' },
  {
    id: 'nintendo',
    test: /nintendo|\bwii\b|\bswitch\b|game ?boy|gamecube|\bnes\b|\bsnes\b|\b3ds\b|\bds\b|virtual boy/i,
    color: '#d1364a',
  },
  { id: 'sega', test: /sega|dreamcast|\bsaturn\b|genesis|game gear|master system/i, color: '#3c53c7' },
  { id: 'mobile', test: /mobile|android|\bios\b|iphone|ipad/i, color: '#8b5cf6' },
  { id: 'arcade', test: /arcade/i, color: '#c9822a' },
  { id: 'pc', test: /\bpc\b|windows|linux|\bmac\b|steam/i, color: '#6b7280' },
]

export function platformFamily(name) {
  const found = FAMILIES.find((family) => family.test.test(name ?? ''))
  return found?.id ?? 'other'
}

export function platformColor(name) {
  const found = FAMILIES.find((family) => family.test.test(name ?? ''))
  return found?.color ?? '#8a7a5c'
}

export function platformIconKind(name) {
  const family = platformFamily(name)
  if (family === 'pc') return 'monitor'
  if (family === 'mobile') return 'smartphone'
  if (family === 'arcade') return 'joystick'
  return 'gamepad'
}
