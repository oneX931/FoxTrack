import { useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { PlatformIcon } from './PlatformIcon.jsx'

function Chip({ platform }) {
  return (
    <span className="platform-chip platform-chip--static" data-chip>
      <PlatformIcon name={platform.name} />
      <span className="platform-chip__name">{platform.name}</span>
      {platform.year && <span className="platform-chip__year">{platform.year}</span>}
    </span>
  )
}

/** One line of platform chips: shows as many as physically fit in the card and folds the rest into "+N more".
 *  The hidden measuring row renders every chip at its natural width, so the count adapts to the card width,
 *  the language and font loading instead of relying on a fixed number. */
export function PlatformOverflowList({ platforms }) {
  const { t } = useLanguage()
  const rowRef = useRef(null)
  const measureRef = useRef(null)
  const [visible, setVisible] = useState(platforms.length)

  useLayoutEffect(() => {
    const row = rowRef.current
    const measure = measureRef.current
    if (!row || !measure) return undefined

    function recalculate() {
      const available = row.clientWidth
      const chips = [...measure.querySelectorAll('[data-chip]')]
      const more = measure.querySelector('[data-more]')
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0
      const moreWidth = more ? more.offsetWidth : 0

      let used = 0
      let count = 0
      for (let index = 0; index < chips.length; index += 1) {
        const width = chips[index].offsetWidth + (index > 0 ? gap : 0)
        const reserve = index < chips.length - 1 ? gap + moreWidth : 0
        if (used + width + reserve > available) break
        used += width
        count = index + 1
      }
      setVisible(Math.max(1, count))
    }

    recalculate()
    const observer = new ResizeObserver(recalculate)
    observer.observe(row)
    observer.observe(measure)
    document.fonts?.ready.then(recalculate)
    return () => observer.disconnect()
  }, [platforms])

  const hidden = platforms.length - visible

  return (
    <div className="platform-overflow">
      <div className="platform-chips" ref={rowRef} aria-hidden="true">
        {platforms.slice(0, visible).map((platform) => (
          <Chip key={platform.gameId} platform={platform} />
        ))}
        {hidden > 0 && (
          <span className="platform-chip platform-chip--static platform-chip--more" title={t('card.platformsMore', { count: hidden })}>
            +{hidden}
          </span>
        )}
      </div>
      <span className="visually-hidden">{platforms.map((platform) => platform.name).join(', ')}</span>
      <div className="platform-overflow__measure" ref={measureRef} aria-hidden="true">
        {platforms.map((platform) => (
          <Chip key={platform.gameId} platform={platform} />
        ))}
        <span className="platform-chip platform-chip--static" data-more>
          +{Math.max(platforms.length - 1, 1)}
        </span>
      </div>
    </div>
  )
}
