const RTT_MODE = { pd: 'pedestrian', bc: 'bicycle', mt: 'masstransit', auto: 'auto' }

/**
 * Парсит маршрут из URL Яндекс.Карт: rtext (точки lat,lon через ~) и rtt (режим).
 * Возвращает { points: [[lat,lon]…], mode } либо null.
 */
export function parseYandexRoute(url) {
  if (!url || typeof url !== 'string') return null
  let params
  try {
    params = new URL(url).searchParams
  } catch {
    const i = url.indexOf('?')
    if (i === -1) return null
    params = new URLSearchParams(url.slice(i + 1))
  }
  const rtext = params.get('rtext')
  if (!rtext) return null
  const points = rtext
    .split('~')
    .map((pair) => pair.split(',').map(Number))
    .filter((p) => p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
  if (points.length === 0) return null
  const modeRaw = RTT_MODE[params.get('rtt')]
  const mode = typeof modeRaw === 'string' ? modeRaw : 'auto'
  return { points, mode }
}
