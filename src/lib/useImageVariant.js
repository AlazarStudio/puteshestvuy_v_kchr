import { useEffect, useState } from 'react'
import { getImageUrl, getImageVariant } from '@/lib/api'

/**
 * Уменьшенная копия для CSS-фона: у background-image нет onError, как у <img>,
 * поэтому вариант сначала проверяем загрузкой — не нашёлся, возвращаем оригинал.
 * @param {string} path — путь из API
 * @param {number} width — ширина уменьшенной копии
 */
export function useImageVariant(path, width = 1600) {
  const original = getImageUrl(path)
  const variant = getImageVariant(path, width)
  const [src, setSrc] = useState(variant)

  useEffect(() => {
    setSrc(variant)
    if (variant === original) return undefined
    const probe = new Image()
    probe.onerror = () => setSrc(original)
    probe.src = variant
    return () => { probe.onerror = null }
  }, [variant, original])

  return src
}
