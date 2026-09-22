import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setApiLanguage } from '../api/client.js'
import { DEFAULT_LANGUAGE, LANGUAGES, translate, translateCount } from '../i18n/index.js'

const STORAGE_KEY = 'foxtrack-language'
const LanguageContext = createContext(null)

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return LANGUAGES.includes(stored) ? stored : null
  } catch {
    return null
  }
}

function detectBrowserLanguage() {
  const primary = navigator.language?.slice(0, 2).toLowerCase()
  return LANGUAGES.includes(primary) ? primary : DEFAULT_LANGUAGE
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const initial = readStoredLanguage() ?? detectBrowserLanguage()
    setApiLanguage(initial)
    return initial
  })

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const setLang = useCallback((next) => {
    if (!LANGUAGES.includes(next)) return
    setApiLanguage(next)
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      return
    }
  }, [])

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])
  const tCount = useCallback((baseKey, count, vars) => translateCount(lang, baseKey, count, vars), [lang])

  const value = useMemo(() => ({ lang, setLang, t, tCount }), [lang, setLang, t, tCount])
  return <LanguageContext value={value}>{children}</LanguageContext>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
