import { Link } from 'react-router'
import { CoverImage } from './CoverImage.jsx'
import { PlatformIcon } from './PlatformIcon.jsx'
import { RatingChip } from './RatingChip.jsx'
import { StatusBadge } from './StatusBadge.jsx'

export function LibraryGameCard({ game }) {
  return (
    <Link to={`/games/${game.id}`} className="game-card">
      <CoverImage
        src={game.coverUrl}
        alt=""
        wrapperClassName="game-card__cover"
        className="game-card__cover-img"
      />
      <div className="game-card__body">
        <h3 className="game-card__title">{game.title}</h3>
        <p className="game-card__platform">
          <PlatformIcon name={game.selectedPlatforms[0]} />
          <span className="game-card__platform-text">{game.selectedPlatforms.join(', ')}</span>
        </p>
        <div className="game-card__meta">
          <StatusBadge status={game.status} />
          <RatingChip rating={game.rating} />
        </div>
      </div>
    </Link>
  )
}
