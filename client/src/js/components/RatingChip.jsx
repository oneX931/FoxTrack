import { Star } from 'lucide-react'

export function RatingChip({ rating }) {
  if (!rating) return null
  return (
    <span className="rating-chip">
      <Star size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" />
      <span>{rating}/10</span>
    </span>
  )
}
