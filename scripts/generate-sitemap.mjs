// scripts/generate-sitemap.mjs
// Генерация public/sitemap.xml: основные страницы + опубликованные детальные URL из API.
// Best-effort: при недоступном API пишет только основные страницы (не падает).
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const SITE_URL = (process.env.VITE_SITE_URL || 'https://xn--b1aahavh3aoehdhg3dg.xn--p1ai').replace(/\/+$/, '')
const API_URL = (process.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '')

const STATIC = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/places', priority: '0.95', changefreq: 'weekly' },
  { loc: '/routes', priority: '0.95', changefreq: 'weekly' },
  { loc: '/services', priority: '0.80', changefreq: 'weekly' },
  { loc: '/region', priority: '0.70', changefreq: 'monthly' },
  { loc: '/news', priority: '0.65', changefreq: 'weekly' },
]

const DYNAMIC = [
  { path: '/places', prefix: '/places', priority: '0.70' },
  { path: '/routes', prefix: '/routes', priority: '0.70' },
  { path: '/services', prefix: '/services', priority: '0.55' },
  { path: '/news', prefix: '/news', priority: '0.55' },
]

async function fetchSlugs(endpoint) {
  try {
    const res = await fetch(`${API_URL}${endpoint}?limit=1000`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const list = Array.isArray(data) ? data : (data.items || data.data || data.results || [])
    return list.map((x) => x.slug).filter(Boolean)
  } catch (e) {
    console.warn(`[sitemap] пропуск ${endpoint}: ${e.message}`)
    return []
  }
}

function urlTag({ loc, priority, changefreq }) {
  const cf = changefreq ? `<changefreq>${changefreq}</changefreq>` : ''
  return `  <url><loc>${SITE_URL}${loc}</loc><priority>${priority}</priority>${cf}</url>`
}

async function main() {
  const rows = STATIC.map(urlTag)
  for (const d of DYNAMIC) {
    const slugs = await fetchSlugs(d.path)
    for (const slug of slugs) {
      rows.push(urlTag({ loc: `${d.prefix}/${slug}`, priority: d.priority, changefreq: 'monthly' }))
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`
  const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sitemap.xml')
  writeFileSync(out, xml, 'utf8')
  console.log(`[sitemap] записано ${rows.length} URL → ${out}`)
}

main()
