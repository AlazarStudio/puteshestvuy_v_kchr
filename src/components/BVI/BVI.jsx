import { loadAccessibilityStyles } from './BVIStyles'

// Версия для слабовидящих подключает jQuery и библиотеку с lidrekon.ru.
// Это внешние сервисы: до явного действия пользователя ни один запрос
// к ним не уходит, поэтому загрузка начинается только по нажатию кнопки.

const JQUERY_ID = 'jquery-for-bvi'
const JQUERY_SRC = 'https://code.jquery.com/jquery-3.7.1.min.js'
const WIDGET_ID = 'accessibility-script'
const WIDGET_SRC = 'https://lidrekon.ru/slep/js/uhpv-full.min.js'

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
      pending.splice(0).forEach((callback) => callback?.())
    })
  })
}
