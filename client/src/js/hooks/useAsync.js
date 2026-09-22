import { useCallback, useEffect, useState } from 'react'

export function useAsync(task, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState((current) => ({ data: current.data, error: null, loading: true }))

    task(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ data, error: null, loading: false })
      },
      (error) => {
        if (controller.signal.aborted || error.name === 'AbortError') return
        setState((current) => ({ data: current.data, error, loading: false }))
      },
    )

    return () => controller.abort()
  }, [...deps, attempt])

  const reload = useCallback(() => setAttempt((value) => value + 1), [])
  const setData = useCallback(
    (updater) =>
      setState((current) => ({
        ...current,
        data: typeof updater === 'function' ? updater(current.data) : updater,
      })),
    [],
  )

  return { ...state, reload, setData }
}
