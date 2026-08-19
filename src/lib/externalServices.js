// Необязательные внешние сервисы. Скрипты не лежат в index.html, а
// подключаются отсюда только после выбора пользователя в cookie-панели:
// до согласия внешнему поставщику не должен уходить даже IP-адрес.

const SOURCES = {
  jivo: 'https://code.jivo.ru/widget/9cDG32AjU8',
  googleTranslate: 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit',
}

const GOOGLE_TRANSLATE_CONTAINER = 'google_translate_element'

const loaded = {
  jivo: false,
  googleTranslate: false,
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

const LOADERS = {
  jivo: loadJivo,
  googleTranslate: loadGoogleTranslate,
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
