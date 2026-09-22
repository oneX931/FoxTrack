import { useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { Link } from 'react-router'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { AddGameDialog } from './AddGameDialog.jsx'
import { CoverImage } from './CoverImage.jsx'
import { PlatformOverflowList } from './PlatformOverflowList.jsx'

export function SearchResultCard({ group }) {
  const { t } = useLanguage()
  const toast = useToast()
  const [ownedId, setOwnedId] = useState(group.libraryGameId)
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleAdded(game) {
    setDialogOpen(false)
    setOwnedId(game.id)
    toast.success(t('add.toast.success', { title: game.title, platforms: game.selectedPlatforms.join(', ') }), {
      to: `/games/${game.id}`,
      label: t('add.open'),
    })
  }

  return (
    <article className="result-card">
      <CoverImage src={group.cover} alt="" wrapperClassName="result-card__cover" className="game-card__cover-img" />
      <div className="result-card__body">
        <div className="result-card__title-row">
          <h3 className="result-card__title">{group.title}</h3>
          {group.year && <span className="result-card__year">{group.year}</span>}
        </div>

        {ownedId ? (
          <p className="result-card__owned">
            <CircleCheck size={16} aria-hidden="true" />
            {t('add.owned')}
            <Link to={`/games/${ownedId}`}>{t('add.open')}</Link>
          </p>
        ) : (
          <>
            <PlatformOverflowList platforms={group.platforms} />
            <button type="button" className="btn btn--secondary btn--sm result-card__add" onClick={() => setDialogOpen(true)}>
              {t('addDialog.confirm')}
            </button>
          </>
        )}
      </div>

      {dialogOpen && <AddGameDialog group={group} onClose={() => setDialogOpen(false)} onAdded={handleAdded} />}
    </article>
  )
}
