import { useEffect } from 'react'

export function useOnClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined

    function onPointerDown(event) {
      if (!ref.current || ref.current.contains(event.target)) return
      handler(event)
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') handler(event)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ref, handler, active])
}
