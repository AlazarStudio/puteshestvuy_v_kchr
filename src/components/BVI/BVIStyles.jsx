const STYLES_ID = 'accessibility-styles'
const STYLES_HREF = 'https://lidrekon.ru/slep/css/special.min.css'

/**
 * Таблица стилей версии для слабовидящих лежит на стороннем сервере, поэтому
 * подключается не при загрузке страницы, а только когда пользователь сам
 * включает режим.
 */
export function loadAccessibilityStyles() {
  if (document.getElementById(STYLES_ID)) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = STYLES_HREF
  link.id = STYLES_ID
  document.head.appendChild(link)
}
