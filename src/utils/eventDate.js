/** Форматирование дат афиши: единственная копия правил в проекте */

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

const pad = (n) => String(n).padStart(2, '0')

/** Время показывается, только если оно не полночь: 00:00 означает «время не указано» */
function timePart(d) {
  return d.getHours() === 0 && d.getMinutes() === 0 ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Человекочитаемая дата события.
 * Однодневное: «12 июля 2027, 18:00» либо «12 июля 2027».
 * Многодневное: «12 — 14 июля 2027» либо «29 июля — 2 августа 2027».
 * @returns {string} пустая строка, если дата не разобралась
 */
export function formatEventDate(startAt, endAt) {
  if (!startAt) return ''
  const start = new Date(startAt)
  if (Number.isNaN(start.getTime())) return ''

  const end = endAt ? new Date(endAt) : null
  const hasEnd = end && !Number.isNaN(end.getTime()) && end.toDateString() !== start.toDateString()

  if (!hasEnd) {
    const time = timePart(start)
    const base = `${start.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`
    return time ? `${base}, ${time}` : base
  }

  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()

  if (sameMonth) {
    return `${start.getDate()} — ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`
  }
  if (sameYear) {
    return `${start.getDate()} ${MONTHS[start.getMonth()]} — ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`
  }
  return `${start.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()} — ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`
}

/** Короткая дата для карточки: «12 июля» либо «12 — 14 июля» */
export function formatEventDateShort(startAt, endAt) {
  if (!startAt) return ''
  const start = new Date(startAt)
  if (Number.isNaN(start.getTime())) return ''
  const end = endAt ? new Date(endAt) : null
  const hasEnd = end && !Number.isNaN(end.getTime()) && end.toDateString() !== start.toDateString()

  if (!hasEnd) return `${start.getDate()} ${MONTHS[start.getMonth()]}`
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} — ${end.getDate()} ${MONTHS[end.getMonth()]}`
  }
  return `${start.getDate()} ${MONTHS[start.getMonth()]} — ${end.getDate()} ${MONTHS[end.getMonth()]}`
}
