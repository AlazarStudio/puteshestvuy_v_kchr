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
