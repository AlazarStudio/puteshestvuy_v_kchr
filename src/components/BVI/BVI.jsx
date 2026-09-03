import { loadAccessibilityStyles } from './BVIStyles'

// Версия для слабовидящих использует jQuery и библиотеку lidrekon.
// Обе лежат в public/vendor/bvi, чтобы режим не зависел от чужих серверов.
// Скрипты тяжёлые и нужны редко, поэтому грузятся только по нажатию кнопки.

const JQUERY_ID = 'jquery-for-bvi'
const JQUERY_SRC = '/vendor/bvi/jquery-3.7.1.min.js'
const WIDGET_ID = 'accessibility-script'
const WIDGET_SRC = '/vendor/bvi/uhpv-full.min.js'

let isLoaded = false
let isLoading = false
const pending = []

function injectScript(id, src, onLoad) {
  const existing = document.getElementById(id)
  if (existing) {
    existing.addEventListener('load', onLoad, { once: true })
    return
  }
  const script = document.createElement('script')
  script.src = src
  script.id = id
  script.onload = onLoad
  document.body.appendChild(script)
}

function ensureJQuery(onReady) {
  if (window.jQuery) {
    onReady()
    return
  }
  injectScript(JQUERY_ID, JQUERY_SRC, onReady)
}

export function isAccessibilityLoaded() {
  return isLoaded
}

export function loadAccessibility(onReady) {
  if (isLoaded) {
    onReady?.()
    return
  }
  pending.push(onReady)
  if (isLoading) return

  isLoading = true
  loadAccessibilityStyles()
  ensureJQuery(() => {
    injectScript(WIDGET_ID, WIDGET_SRC, () => {
      isLoaded = true
      isLoading = false
      // Виджет навешивает обработчик на кнопку в своём jQuery-ready.
      // Ставим колбэки в ту же очередь, иначе первый клик уходит в пустоту.
      const flush = () => pending.splice(0).forEach((callback) => callback?.())
      if (window.jQuery) window.jQuery(flush)
      else flush()
    })
  })
}
