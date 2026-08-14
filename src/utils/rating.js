/** Есть ли что показывать в блоке рейтинга */
export const hasRating = (value) => {
  if (value == null || value === '' || value === '—') return false
  const num = Number(value)
  return !Number.isNaN(num) && num > 0
}

/** Рейтинг к виду «4» или «4.8» */
export const formatRating = (value) => {
  if (!hasRating(value)) return '—'
  const num = Number(value)
  return num % 1 === 0 ? String(num) : num.toFixed(1)
}

/** Среднее по одобренным отзывам — то, что получится при переводе объекта на расчёт по отзывам */
export const ratingFromReviews = (reviews) => {
  const list = Array.isArray(reviews) ? reviews : []
  if (list.length === 0) return null
  const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
  return Math.round((sum / list.length) * 10) / 10
}

/**
 * Ручной рейтинг к сравнимому виду: поле ввода даёт строку, сохранённый объект — число.
 * Нужно, чтобы снимки формы в редакторах не расходились из-за разницы типов.
 */
export const normalizeManualRating = (value) => {
  if (value === '' || value == null) return ''
  const num = Number(value)
  return Number.isFinite(num) ? String(num) : ''
}

/** Склонение числа отзывов */
export const formatReviews = (count) => {
  const n = Number(count) || 0
  if (n === 1) return '1 отзыв'
  if (n >= 2 && n <= 4) return `${n} отзыва`
  return `${n} отзывов`
}
