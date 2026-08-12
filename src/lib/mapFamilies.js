/**
 * Группировка типов объектов в семейства для иконок на карте.
 * Живёт во фронте намеренно: перегруппировка не должна требовать выкладки бэкенда.
 */

/** Порядок важен: у места бывает несколько видов сразу, семейство берётся
 *  по первому совпадению сверху вниз. «Природа» стоит последней как самое
 *  расплывчатое значение — она должна уступать любому более конкретному */
export const PLACE_FAMILIES = [
  { key: 'water',    label: 'Вода',                 icon: '/map-icons/water.svg',    types: ['Озера / Реки', 'Водопады'] },
  { key: 'mountain', label: 'Горы',                 icon: '/map-icons/mountain.svg', types: ['Горы', 'Перевал', 'Плато', 'Ущелья', 'Ледники', 'Пещеры'] },
  { key: 'culture',  label: 'Культура',             icon: '/map-icons/culture.svg',  types: ['Музеи', 'Храмы', 'Мемориалы ВОВ'] },
  { key: 'city',     label: 'Города и развлечения', icon: '/map-icons/city.svg',     types: ['Города, села (улицы, дост)', 'Развлечения'] },
  { key: 'nature',   label: 'Природа',              icon: '/map-icons/nature.svg',   types: ['Природа', 'Заповедник'] },
]

export const SERVICE_FAMILIES = [
  { key: 'hotel',  label: 'Гостиницы',          icon: '/map-icons/hotel.svg',  types: ['Гостиница'] },
  { key: 'fuel',   label: 'АЗС',                icon: '/map-icons/fuel.svg',   types: ['АЗС'] },
  { key: 'food',   label: 'Кафе и рестораны',   icon: '/map-icons/food.svg',   types: ['Кафе и ресторан'] },
  { key: 'museum', label: 'Музеи',              icon: '/map-icons/museum.svg', types: ['Музей'] },
  { key: 'police', label: 'МВД',                icon: '/map-icons/police.svg', types: ['МВД'] },
  { key: 'info',   label: 'Туристический центр', icon: '/map-icons/info.svg',  types: ['ТИЦ'] },
]

export const DEFAULT_FAMILY = { key: 'default', label: 'Без категории', icon: '/pointMap.png' }

/** @returns {object} семейство места по его видам объекта */
export function placeFamily(objectTypes) {
  const list = Array.isArray(objectTypes) ? objectTypes : []
  return PLACE_FAMILIES.find((f) => f.types.some((t) => list.includes(t))) || DEFAULT_FAMILY
}

/** @returns {object} семейство услуги по её категории */
export function serviceFamily(category) {
  return SERVICE_FAMILIES.find((f) => f.types.includes(category)) || DEFAULT_FAMILY
}
