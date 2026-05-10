import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import RoutePDFDocument from './RoutePDFDocument'

export async function exportRoutePDF(route) {
  const blob = await pdf(createElement(RoutePDFDocument, { route })).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (route.title || 'маршрут').replace(/[<>:"/\\|?*]/g, '').trim() + '.pdf'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
