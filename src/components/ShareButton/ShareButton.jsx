import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { SITE_NAME } from '@/lib/seo/config'
import styles from './ShareButton.module.css'

function buildAbsoluteUrl(path) {
  if (/^https?:\/\//i.test(path)) return path
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
}

function canUseNativeShare() {
  return Boolean(navigator.share) && window.matchMedia('(pointer: coarse)').matches
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (_) {
    // падаем в запасной вариант ниже
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '0'
  area.style.left = '0'
  area.style.opacity = '0'
  area.style.pointerEvents = 'none'
  document.body.appendChild(area)
  try {
    area.select()
    return document.execCommand('copy')
  } catch (_) {
    return false
  } finally {
    area.remove()
  }
}

/**
 * Иконки пунктов меню. Инлайн-SVG: не тянут файлы и красятся через currentColor.
 * viewBox у каждой подогнан вплотную к контуру (для обводок — с запасом на толщину),
 * чтобы все глифы одинаково заполняли слот 18×18. Знак ВК по своей природе широкий
 * и низкий, поэтому он совпадает с остальными по ширине, но не по высоте.
 */
const ICONS = {
  copy: (
    <svg viewBox="1.5 1.5 21 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  ),
  vk: (
    <svg viewBox="3 7 18 11" fill="currentColor" aria-hidden>
      <path d="M13.16 18.06c-6.03 0-9.9-4.13-10.06-10.99h3.03c.11 5.04 2.42 7.2 4.18 7.64V7.07h2.9v4.3c1.7-.19 3.48-2.16 4.08-4.3h2.85c-.46 2.63-2.4 4.6-3.78 5.41 1.38.66 3.59 2.38 4.43 5.58h-3.14c-.66-2.05-2.29-3.64-4.44-3.86v3.86h-.05z" />
    </svg>
  ),
  tg: (
    <svg viewBox="2 3 20 17" fill="currentColor" aria-hidden>
      <path d="M21.94 4.6l-3.02 14.25c-.23 1-.83 1.25-1.67.78l-4.62-3.4-2.23 2.14c-.25.25-.45.45-.92.45l.33-4.68 8.52-7.7c.37-.33-.08-.51-.57-.18l-10.53 6.63-4.53-1.42c-.99-.31-1-.99.2-1.46l17.7-6.82c.82-.3 1.54.2 1.34 1.41z" />
    </svg>
  ),
  wa: (
    <svg viewBox="2 2 20 20" fill="currentColor" aria-hidden>
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.86 9.86 0 0 0 4.74 1.21c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2zm0 18.02a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.22 8.23zm4.52-6.16c-.25-.13-1.47-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43l-.47-.01c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.29z" />
    </svg>
  ),
  // Контур из фирменного SVG MAX; заливка градиентом и блюр из экспорта Figma опущены
  max: (
    <svg viewBox="0 0 100 100" fill="currentColor" fillRule="evenodd" clipRule="evenodd" aria-hidden>
      <path d="M50.7571 0.261719C78.2929 0.261719 99.8857 22.5974 99.8857 50.1474C99.8857 77.6974 77.6071 99.4903 51.0214 99.4903C41.5857 99.4903 37.0143 98.1617 29.65 92.9474C29.1429 92.5903 28.45 92.6831 28.0214 93.1403C22.3571 99.1831 7.85 103.426 7.18571 95.176C7.18571 80.7903 0 71.4474 0 49.876C0 21.5546 23.2214 0.261719 50.7571 0.261719ZM51.5286 24.8117C38.4643 24.126 28.2643 33.1974 26.0143 47.3831C24.15 59.1332 27.45 73.4546 30.2786 74.176C31.4786 74.4832 34.3571 72.276 36.4571 70.2974C36.85 69.926 37.45 69.8617 37.9071 70.1474C41.1786 72.1474 44.8786 73.6474 48.9571 73.8617C62.3714 74.5617 74.2571 64.0617 74.9643 50.6474C75.6643 37.2331 64.9429 25.5046 51.5286 24.8046V24.8117Z" />
    </svg>
  ),
}

/**
 * Кнопка «Поделиться».
 * @param {string} path — путь сущности, например `/places/ledn-k-alibek`
 * @param {string} title — заголовок, попадает в текст сообщения
 */
export default function ShareButton({ path, title = '', className = '' }) {
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  if (!path) return null

  const url = buildAbsoluteUrl(path)
  const shareText = title ? `${title} — ${SITE_NAME}` : SITE_NAME
  // поповер может открыться и на тач-устройстве — как запасной вариант при отказе системного шэра
  const usesPopover = open || !canUseNativeShare()

  const targets = [
    { key: 'vk', label: 'ВКонтакте', icon: ICONS.vk, href: `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareText)}` },
    { key: 'tg', label: 'Telegram', icon: ICONS.tg, href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}` },
    { key: 'max', label: 'MAX', icon: ICONS.max, href: `https://max.ru/:share?text=${encodeURIComponent(`${shareText} ${url}`)}` },
    { key: 'wa', label: 'WhatsApp', icon: ICONS.wa, href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}` },
  ]

  const handleClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (canUseNativeShare()) {
      try {
        await navigator.share({ title: shareText, url })
        return
      } catch (err) {
        // AbortError — пользователь закрыл системное меню, остальное — отказ шэра, показываем поповер
        if (err?.name !== 'AbortError') setOpen(true)
        return
      }
    }
    setOpen((prev) => !prev)
  }

  const handleCopy = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const ok = await copyToClipboard(url)
    showToast(ok ? 'Ссылка скопирована' : 'Не удалось скопировать ссылку')
    setOpen(false)
    btnRef.current?.focus()
  }

  return (
    <div className={`${styles.wrap} ${className}`} ref={wrapRef} data-no-navigate>
      <button
        ref={btnRef}
        type="button"
        className={styles.btn}
        onClick={handleClick}
        aria-label="Поделиться"
        aria-haspopup={usesPopover ? 'menu' : undefined}
        aria-expanded={usesPopover ? open : undefined}
        title="Поделиться"
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
      </button>

      {open && (
        <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
          <button type="button" className={styles.menuItem} onClick={handleCopy}>
            <span className={styles.menuIcon}>{ICONS.copy}</span>
            Копировать ссылку
          </button>
          {targets.map((t) => (
            <a
              key={t.key}
              className={styles.menuItem}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
            >
              <span className={styles.menuIcon}>{t.icon}</span>
              {t.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
