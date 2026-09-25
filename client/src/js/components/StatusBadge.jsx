import { useLanguage } from '../context/LanguageContext.jsx'
import { statusLabel } from '../utils/status.js'

const CLASSES = {
  'Хочу пройти': 'status-pill--wish',
  Играю: 'status-pill--playing',
  Пройдена: 'status-pill--done',
}

export function StatusBadge({ status }) {
  const { t } = useLanguage()
  return <span className={`status-pill ${CLASSES[status] ?? 'status-pill--wish'}`}>{statusLabel(status, t)}</span>
}
