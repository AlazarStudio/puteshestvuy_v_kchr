// src/lib/seo/config.js
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://xn--b1aahavh3aoehdhg3dg.xn--p1ai').replace(/\/+$/, '')
export const SITE_NAME = 'Путешествуй КЧР'
export const DEFAULT_TITLE = 'Путешествуй КЧР'
export const DEFAULT_DESCRIPTION = 'Путеводитель по Карачаево-Черкесии: интересные места, маршруты, услуги и идеи для путешествий.'
export const DEFAULT_OG_IMAGE = SITE_URL + '/color_logo.png'

export function absoluteUrl(path = '/') {
  if (!path) return SITE_URL + '/'
  if (/^https?:\/\//i.test(path)) return path
  return SITE_URL + (path.startsWith('/') ? path : '/' + path)
}

export function stripHtml(html = '') {
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncate(text = '', max = 160) {
  const clean = stripHtml(text)
  if (clean.length <= max) return clean
  return clean.slice(0, max - 1).trimEnd() + '…'
}
