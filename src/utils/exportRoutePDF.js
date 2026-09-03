import { createElement } from 'react'

// @react-pdf/renderer весит больше мегабайта и нужен только в момент экспорта,
// поэтому и рендерер, и шаблон документа подгружаются по клику
export async function exportRoutePDF(route, extraGroups = []) {
  const [{ pdf }, { default: RoutePDFDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./RoutePDFDocument'),
  ])
  const blob = await pdf(createElement(RoutePDFDocument, { route, extraGroups })).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (route.title || 'маршрут').replace(/[<>:"/\\|?*]/g, '').trim() + '.pdf'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
