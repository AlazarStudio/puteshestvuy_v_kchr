// Делает контакты внутри обычного текста кликабельными:
// e-mail → mailto:, телефон → tel: с нормализованными цифрами,
// адрес сайта → https:// в новой вкладке.
// Хвостовая пунктуация в ссылку не попадает.

const EMAIL = '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}'
const PHONE = '(?:\\+7|8)\\s*\\(?\\d{3}\\)?[\\s-]?\\d{3}[\\s-]?\\d{2}[\\s-]?\\d{2}(?!\\d)'
// Домен может быть кириллическим: посетикчр.рф
const LABEL = 'A-Za-zА-Яа-яЁё0-9'
const SITE = `(?:https?:\\/\\/)?(?:www\\.)?[${LABEL}][${LABEL}-]*(?:\\.[${LABEL}-]+)*\\.(?:ru|рф|com|net|org)(?:\\/[^\\s]*)?`

const PATTERN = new RegExp(`${EMAIL}|${PHONE}|${SITE}`, 'g')
const TRAILING = /[.,;:!?)»"']+$/

function buildHref(value) {
  if (value.includes('@')) return `mailto:${value}`
  const digits = value.replace(/\D/g, '')
  if (/^(?:\+7|8)/.test(value) && digits.length === 11) {
    return `tel:+7${digits.slice(1)}`
  }
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

export default function linkify(text) {
  if (!text) return null

  const nodes = []
  let lastIndex = 0
  let match

  PATTERN.lastIndex = 0
  while ((match = PATTERN.exec(text)) !== null) {
    const start = match.index
    const raw = match[0]
    const value = raw.replace(TRAILING, '')
    PATTERN.lastIndex = start + raw.length

    // Совпадение внутри длинного числа (ИНН, ОГРН) телефоном не является.
    if (!value || /[\d-]/.test(text[start - 1] || '')) continue
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start))

    const href = buildHref(value)
    const isExternal = href.startsWith('http')
    nodes.push(
      <a
        key={`${start}-${value}`}
        href={href}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {value}
      </a>
    )
    lastIndex = start + value.length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes.length ? nodes : text
}
