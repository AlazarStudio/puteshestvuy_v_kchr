

import { useEffect, useRef, useState } from 'react'
import { getImageUrl, getImageVariant, toUploadsPath } from '@/lib/api'

/**
 * Пресеты ширин уменьшенных копий под типовые места вывода
 * card — карточки и плитки, cover — обложки и слайдеры, full — полноэкранный просмотр
 */
const PRESETS = {
  card: { widths: [400, 800], sizes: '(max-width: 768px) 92vw, 420px' },
  cover: { widths: [1600, 2400], sizes: '100vw' },
  full: { widths: [2400], sizes: '100vw' },
}

/**
 * Отдача уменьшенных копий выкатывается на бэкенде отдельно. Пока её нет, каждая картинка
 * сначала сходила бы за 404 и только потом за оригиналом — на странице с сотней карточек
 * это удваивает запросы и надолго оставляет её пустой. Несколько неудач подряд означают,
 * что ручки ещё нет, и варианты выключаются на всю сессию; одна-две пропавшие копии
 * при живой ручке лечатся откатом самой картинки и общий режим не трогают.
 */
const FAILURES_TO_DISABLE = 3
let variantFailures = 0
let variantsDisabled = false
const variantSubscribers = new Set()

function reportVariantFailure() {
  if (variantsDisabled) return
  variantFailures += 1
  if (variantFailures < FAILURES_TO_DISABLE) return
  variantsDisabled = true
  variantSubscribers.forEach((notify) => notify())
}

function useVariantsEnabled() {
  const [enabled, setEnabled] = useState(!variantsDisabled)

  useEffect(() => {
    if (variantsDisabled) {
      setEnabled(false)
      return undefined
    }
    const notify = () => setEnabled(false)
    variantSubscribers.add(notify)
    return () => { variantSubscribers.delete(notify) }
  }, [])

  return enabled
}

/**
 * AppImage — <img> с уменьшенными копиями из /uploads/_v и ленивой загрузкой.
 * Встаёт на место обычного <img>: обёрток не добавляет, className/style/остальные пропсы уходят на тег.
 * @param {Object} props
 * @param {string} props.src - путь из API (сырой /uploads/... или уже собранный адрес)
 * @param {string} props.alt - альтернативный текст
 * @param {string} props.variant - пресет ширин (card, cover, full)
 * @param {boolean} props.eager - отключить loading="lazy" (первый экран)
 * @param {React.ElementType} props.as - тег или компонент вместо img (например motion.img)
 */
export default function AppImage({
  src,
  alt = '',
  variant = 'card',
  eager = false,
  onError,
  as: Component = 'img',
  ...props
}) {
  // Адрес, на уменьшенных копиях которого браузер уже споткнулся
  const [failedUrl, setFailedUrl] = useState(null)
  const variantsEnabled = useVariantsEnabled()
  const imgRef = useRef(null)
  // Отдавали ли этой картинке srcset и перезапускали ли её уже — чтобы не крутить перезагрузку
  const usedVariantsRef = useRef(false)
  const restartedUrlRef = useRef(null)

  const path = toUploadsPath(src)
  const originalUrl = getImageUrl(path)
  const preset = PRESETS[variant] || PRESETS.card

  // Вариантов нет для внешних ссылок, svg/gif и файлов из public/ — тогда обычный img
  const hasVariants =
    variantsEnabled &&
    getImageVariant(path, preset.widths[0]) !== originalUrl &&
    failedUrl !== originalUrl
  const srcSet = hasVariants
    ? preset.widths.map((width) => `${getImageVariant(path, width)} ${width}w`).join(', ')
    : undefined

  // Пока бэкенд не отдаёт уменьшенные копии, откатываемся на оригинал. Ошибку слушаем
  // на самом элементе: React теряет error, если 404 прилетел из кэша раньше обработчика
  useEffect(() => {
    const node = imgRef.current
    if (!node) return undefined

    // Снятого srcset мало: пока не сменится значение src, Chrome не перезапускает выбор
    // источника — картинка застревает на провалившемся адресе. В src уже стоит оригинал,
    // поэтому сначала сбрасываем атрибут, и только тогда присваивание реально перезагружает.
    // Один раз на адрес, иначе битый оригинал уйдёт в бесконечные перезапросы
    const restartWithOriginal = () => {
      if (restartedUrlRef.current === originalUrl) return
      restartedUrlRef.current = originalUrl
      node.removeAttribute('srcset')
      node.removeAttribute('sizes')
      node.removeAttribute('src')
      node.src = originalUrl
    }

    if (!hasVariants) {
      // Варианты могли выключиться глобально, пока запрос копии ещё летел: srcset React
      // снял, но картинка осталась на нём. Успешно загруженную не трогаем
      const wedgedOnVariant =
        usedVariantsRef.current &&
        node.currentSrc &&
        node.currentSrc !== originalUrl &&
        !(node.complete && node.naturalWidth > 0)
      if (wedgedOnVariant) restartWithOriginal()
      return undefined
    }

    usedVariantsRef.current = true

    const fallBackToOriginal = () => {
      setFailedUrl(originalUrl)
      reportVariantFailure()
      restartWithOriginal()
    }
    if (node.complete && node.naturalWidth === 0) {
      fallBackToOriginal()
      return undefined
    }
    node.addEventListener('error', fallBackToOriginal)
    return () => node.removeEventListener('error', fallBackToOriginal)
  }, [hasVariants, originalUrl])

  return (
    <Component
      ref={imgRef}
      src={originalUrl}
      srcSet={srcSet}
      sizes={srcSet ? preset.sizes : undefined}
      alt={alt}
      loading={eager ? undefined : 'lazy'}
      decoding="async"
      onError={hasVariants ? undefined : onError}
      {...props}
    />
  )
}
