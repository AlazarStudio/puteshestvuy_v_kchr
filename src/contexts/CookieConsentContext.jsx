import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { loadService, isServiceLoaded, clearGoogleTranslateCookies } from '@/lib/externalServices'

const STORAGE_KEY = 'cookie_consent_v2'
// Старый ключ хранил строку 'accepted' от баннера с единственной кнопкой.
// Тот выбор не был согласием на внешние сервисы, поэтому не переносится.
const LEGACY_STORAGE_KEY = 'cookie_consent'

export const OPTIONAL_SERVICES = [
  {
    id: 'jivo',
    title: 'Онлайн-чат JivoSite',
    description:
      'Виджет чата на страницах сайта. Поставщику передаются IP-адрес, сведения о браузере и устройстве, адрес страницы, дата и время, а также введённые вами сообщения и контакты.',
  },
  {
    id: 'googleTranslate',
    title: 'Переводчик Google Translate',
    description:
      'Перевод интерфейса на английский язык. Поставщику передаются IP-адрес, сведения о браузере и устройстве, адрес страницы, дата и время.',
  },
]

const NONE = OPTIONAL_SERVICES.reduce((acc, service) => ({ ...acc, [service.id]: false }), {})
const ALL = OPTIONAL_SERVICES.reduce((acc, service) => ({ ...acc, [service.id]: true }), {})

function readStoredServices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return { ...NONE, ...(parsed.services || {}) }
  } catch {
    return null
  }
}

const CookieConsentContext = createContext(null)

export function CookieConsentProvider({ children }) {
  const [services, setServices] = useState(() => readStoredServices() || NONE)
  const [isDecided, setIsDecided] = useState(() => readStoredServices() !== null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  }, [])

  useEffect(() => {
    if (!isDecided) return
    OPTIONAL_SERVICES.forEach(({ id }) => {
      if (services[id]) loadService(id)
    })
  }, [isDecided, services])

  const save = useCallback((next) => {
    // Уже загруженный виджет со страницы не убрать — отзыв применяем перезагрузкой
    const needsReload = OPTIONAL_SERVICES.some(({ id }) => !next[id] && isServiceLoaded(id))

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, decidedAt: new Date().toISOString(), services: next })
    )
    setServices(next)
    setIsDecided(true)
    setIsSettingsOpen(false)

    if (!next.googleTranslate) clearGoogleTranslateCookies()
    if (needsReload) window.location.reload()
  }, [])

  const value = useMemo(
    () => ({
      services,
      isDecided,
      isSettingsOpen,
      isAllowed: (id) => Boolean(services[id]),
      acceptAll: () => save({ ...ALL }),
      rejectOptional: () => save({ ...NONE }),
      save,
      openSettings: () => setIsSettingsOpen(true),
      closeSettings: () => setIsSettingsOpen(false),
    }),
    [services, isDecided, isSettingsOpen, save]
  )

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (!context) throw new Error('useCookieConsent должен использоваться внутри CookieConsentProvider')
  return context
}
