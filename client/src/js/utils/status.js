export const STATUSES = ['Хочу пройти', 'Играю', 'Пройдена']
export const COMPLETED_STATUS = 'Пройдена'

const KEYS = {
  'Хочу пройти': 'status.wish',
  Играю: 'status.playing',
  Пройдена: 'status.done',
}

/** Canonical status values are fixed Russian strings (they're literal API/DB values); this only
 *  maps them to a translated label for display. */
export function statusLabel(status, t) {
  return t(KEYS[status] ?? status)
}
