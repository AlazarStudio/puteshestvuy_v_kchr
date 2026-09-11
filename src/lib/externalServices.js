// Необязательные внешние сервисы. Скрипты не лежат в index.html, а
// подключаются отсюда только после выбора пользователя в cookie-панели:
// до согласия внешнему поставщику не должен уходить даже IP-адрес.

// Номер счётчика приходит из окружения сборки; без него Метрика не регистрируется вовсе
const METRIKA_ID = Number(import.meta.env.VITE_YANDEX_METRIKA_ID) || 0
export const hasMetrika = METRIKA_ID > 0

const SOURCES = {
  jivo: 'https://code.jivo.ru/widget/9cDG32AjU8',
  googleTranslate: 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit',
  metrika: 'https://mc.yandex.ru/metrika/tag.js',
}

const GOOGLE_TRANSLATE_CONTAINER = 'google_translate_element'

const loaded = {
  jivo: false,
  googleTranslate: false,
  metrika: false,
}

function injectScript(id, src, { async = false } = {}) {
  const script = document.createElement('script')
  script.src = src
  script.async = async
  script.dataset.externalService = id
  document.body.appendChild(script)
}

function loadJivo() {
  window.jivo_onLoadCallback = window.jivo_onLoadCallback || undefined
  injectScript('jivo', SOURCES.jivo, { async: true })
}

function loadGoogleTranslate() {
  window.googleTranslateElementInit = () => {
    if (!window.google?.translate?.TranslateElement) return
    new window.google.translate.TranslateElement(
      { pageLanguage: 'ru', includedLanguages: 'en', autoDisplay: false },
      GOOGLE_TRANSLATE_CONTAINER
    )
  }
  injectScript('googleTranslate', SOURCES.googleTranslate)
}

// Стандартная заглушка Метрики: вызовы ym() до загрузки tag.js копятся в очереди и
// проигрываются после. defer: true отключает автоматический хит — в SPA страницы
// меняются без перезагрузки, поэтому хиты шлём сами (первый здесь, дальше trackPageView)
function loadMetrika() {
  if (!hasMetrika) return
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments) }
  window.ym.l = Date.now()
  injectScript('metrika', SOURCES.metrika, { async: true })
  window.ym(METRIKA_ID, 'init', {
    defer: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false,
  })
  trackPageView(window.location.href)
}

const LOADERS = {
  jivo: loadJivo,
  googleTranslate: loadGoogleTranslate,
  metrika: loadMetrika,
}

export function loadService(id) {
  if (loaded[id] || !LOADERS[id]) return
  loaded[id] = true
  LOADERS[id]()
}

export function isServiceLoaded(id) {
  return Boolean(loaded[id])
}

// Google Translate хранит выбранный язык в cookie googtrans: при отзыве согласия
// его нужно убрать, иначе перевод останется включённым и после перезагрузки.
export function clearGoogleTranslateCookies() {
  const expires = new Date(0).toUTCString()
  document.cookie = `googtrans=; expires=${expires}; path=/`
  document.cookie = `googtrans=; expires=${expires}; path=/; domain=${window.location.hostname}`
}

// Админка в статистику не попадает: её страницы засоряли бы «Топ страниц» на дашборде
export function trackPageView(url) {
  if (!loaded.metrika || typeof window.ym !== 'function') return
  if (window.location.pathname.startsWith('/admin')) return
  window.ym(METRIKA_ID, 'hit', url, { title: document.title })
}
