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
    { key: 'vk', label: 'ВКонтакте', href: `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareText)}` },
    { key: 'tg', label: 'Telegram', href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}` },
    { key: 'wa', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}` },
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
              {t.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
