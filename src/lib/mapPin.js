/**
 * Адрес картинки для метки на карте.
 * Яндекс принимает иконку только как URL, поэтому библиотечный значок
 * приходится собирать в булавку и отдавать data:-URI.
 */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { icons } from 'lucide-react'
import { getImageUrl } from '@/lib/api'

/** Контур булавки — тот же, что во всех файлах public/map-icons */
const PIN_PATH = 'M21 0C9.4 0 0 9.4 0 21c0 14.7 21 31 21 31s21-16.3 21-31C42 9.4 32.6 0 21 0z'

/** Фирменный цвет подложки, совпадает с заливкой семейных иконок */
const PIN_FILL = '#156A60'

/** Собранные булавки по имени значка: объектов на карте сотни, значков единицы */
const cache = new Map()

/** @returns {string|null} внутренняя разметка значка Lucide без обёртки svg */
function glyphMarkup(name) {
  const Icon = icons[name]
  if (!Icon) return null
  const markup = renderToStaticMarkup(createElement(Icon))
  const inner = markup.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  return inner.trim() || null
}

/** @returns {string} data:-URI булавки с переданным значком внутри */
function buildPin(glyph) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="42" height="52" viewBox="0 0 42 52">' +
    `<path d="${PIN_PATH}" fill="${PIN_FILL}"/>` +
    '<g transform="translate(11 11) scale(0.833)" fill="none" stroke="#fff" stroke-width="2" ' +
    `stroke-linecap="round" stroke-linejoin="round">${glyph}</g></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Метка рисуется в тройном разрешении: на карте она 42×52, но экраны бывают плотные */
const PIN_SCALE = 3

/** Центр и радиусы круглой головы булавки в системе координат 42×52 */
const HEAD = { x: 21, y: 21, ring: 15, photo: 13 }

/**
 * Вписывает картинку в круглую голову булавки и возвращает готовую метку.
 * Нужна затем, чтобы загруженная иконка выглядела частью набора, а не
 * прямоугольной фотографией среди булавок: силуэт и цвет остаются наши.
 * @param {Blob} imageBlob обрезанная в квадрат картинка
 * @returns {Promise<Blob>} PNG с прозрачным фоном размером 42×52 в тройном масштабе
 */
export async function composePinFromImage(imageBlob) {
  const url = URL.createObjectURL(imageBlob)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Не удалось прочитать картинку'))
      el.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = 42 * PIN_SCALE
    canvas.height = 52 * PIN_SCALE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2d недоступен')
    ctx.scale(PIN_SCALE, PIN_SCALE)

    ctx.fillStyle = PIN_FILL
    ctx.fill(new Path2D(PIN_PATH))

    ctx.beginPath()
    ctx.arc(HEAD.x, HEAD.y, HEAD.ring, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()

    ctx.save()
    ctx.beginPath()
    ctx.arc(HEAD.x, HEAD.y, HEAD.photo, 0, Math.PI * 2)
    ctx.clip()
    // Картинка уже квадратная после кадрирования, поэтому вписывается без искажений
    const side = HEAD.photo * 2
    ctx.drawImage(img, HEAD.x - HEAD.photo, HEAD.y - HEAD.photo, side, side)
    ctx.restore()

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Не удалось собрать метку'))),
        'image/png',
      )
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * @param {string|null} mapIcon имя значка Lucide либо адрес загруженного файла
 * @param {string|null} mapIconType library | upload
 * @param {string} fallbackHref иконка семейства — на неё сводится всё непонятное
 * @returns {string} значение для iconImageHref
 */
export function buildMapIconHref(mapIcon, mapIconType, fallbackHref) {
  const value = typeof mapIcon === 'string' ? mapIcon.trim() : ''
  if (!value) return fallbackHref

  if (mapIconType === 'upload') return getImageUrl(value)

  if (!cache.has(value)) {
    const glyph = glyphMarkup(value)
    cache.set(value, glyph ? buildPin(glyph) : null)
  }
  return cache.get(value) || fallbackHref
}
