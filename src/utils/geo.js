/** Геометрия по координатам: единственная копия формул в проекте */

const EARTH_RADIUS_KM = 6371

/**
 * Расстояние по большому кругу между двумя точками.
 * Аргументы должны быть конечными числами: числовые строки отвергаются намеренно.
 * @param {number} lat1 широта первой точки
 * @param {number} lon1 долгота первой точки
 * @param {number} lat2 широта второй точки
 * @param {number} lon2 долгота второй точки
 * @returns {number|null} км, либо null если хотя бы одна координата не задана.
 *   Внимание: null приводится к 0 в арифметике и сравнениях — проверяйте результат явно,
 *   не пишите `haversineKm(...) < N`.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

/**
 * Человекочитаемое расстояние: «850 м», «4,2 км», «12 км».
 * Пороги учитывают округление: 0.997 км попадает в километровую ветку («1,0 км»),
 * а не выдаёт «1000 м».
 * @param {number} km расстояние в километрах
 * @returns {string|null} null если расстояние не вычислено или отрицательно
 */
export function formatDistance(km) {
  if (!Number.isFinite(km) || km < 0) return null
  if (km < 0.995) return `${Math.round(km * 100) * 10} м`
  if (km < 9.95) return `${km.toFixed(1).replace('.', ',')} км`
  return `${Math.round(km)} км`
}
