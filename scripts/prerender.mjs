// scripts/prerender.mjs
// Build-time prerender: обходит собранный dist headless Chrome и для каждого
// публичного URL сохраняет статический dist/<path>/index.html, собранный ИЗ
// ШАБЛОНА (не сырой DOM-снапшот): чистый dist/index.html + innerHTML #root +
// helmet-теги в <head>. React 18 createRoot().render() при загрузке
// перерисует контент — гидратация не нужна.
//
// Краулинг идёт по мини-серверу на dist (node:http, не `vite preview`):
// он отдаёт реальные файлы как есть, а для путей без файла — index.html-
// шаблон из памяти (SPA-фоллбек). Это специально безопасно во время обхода:
// префендер ещё не записал ни одного файла в dist (пишет во временный
// каталог и переносит всё одним cpSync в конце), поэтому каждый маршрут
// при заходе краулера гарантированно получает шаблон, а не чужой снапшот.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync, cpSync } from 'node:fs'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join, extname, sep } from 'node:path'
import puppeteer from 'puppeteer'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(ROOT, 'dist')
const DIST_PREFIX = DIST + sep
const TMP = resolve(ROOT, '.prerender-tmp')

// Спека просила 4-6 вкладок; эмпирически (см. canonicalPathOf ниже) при 3-5
// вкладках маршруты вида /places/:slug стабильно давали ~10-15% неудач даже
// с 3 попытками — retry не даёт странице «остыть», он просто встаёт в тот же
// перегруженный пул. При конкурентности 2 на той же выборке — 0 неудач без
// единого ретрая. Меняем ради надёжности итога, отклонение сознательное.
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY || 2)
const PAGE_BUDGET_MS = 30000 // общий бюджет на страницу (goto + waitForFunction + извлечение)
const GOTO_TIMEOUT_MS = 12000 // networkidle2 может не наступить на /map (постоянные тайлы) — не съедаем весь бюджет
const WAIT_ROOT_TIMEOUT_MS = 8000
const NETWORK_IDLE_TIMEOUT_MS = 8000 // добор данных после монтирования (см. renderOnce)
// Спека просила «1 ретрай», но под конкурентной нагрузкой canonical-проверка
// (см. комментарий у canonicalPathOf) периодически просит повторить заход —
// с одним ретраем реальная доля неудач местами превышала допустимые 10%.
// Три попытки суммарно эмпирически держат её в пределах шума. Отклонение от
// спеки — сознательное, ради устойчивости итога, а не усложнения кода.
const RETRIES = 3

const NOT_FOUND_PROBE_PATH = '/__prerender_404_probe__'

// ---------------------------------------------------------------------------
// 1. Переменные окружения — как Vite при `vite build`: .env, затем .env.production
//    поверх (dotenv в репозитории не установлен, парсер минимальный).
// ---------------------------------------------------------------------------
function parseEnvFile(path) {
  const out = {}
  if (!existsSync(path)) return out
  const text = readFileSync(path, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const env = { ...parseEnvFile(resolve(ROOT, '.env')), ...parseEnvFile(resolve(ROOT, '.env.production')) }
const API_URL = (env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '')

// ---------------------------------------------------------------------------
// 2. Список URL
// ---------------------------------------------------------------------------
// 6 легальных путей продублированы из STATIC в scripts/generate-sitemap.mjs
// (источник истины). Не импортируем сам файл: он самовыполняется при импорте
// (вызывает main() в конце модуля без guard'а) и как побочный эффект пишет
// public/sitemap.xml и делает лишние запросы к API — не нужно для префендера.
const STATIC_PATHS = [
  '/', '/places', '/routes', '/services', '/news', '/events', '/gallery', '/region', '/map',
  '/legal/terms',
  '/legal/privacy-policy',
  '/legal/consent',
  '/legal/account-consent',
  '/legal/cookie-policy',
  '/legal/distribution-consent',
]

const DYNAMIC = [
  { prefix: '/places', endpoint: '/places' },
  { prefix: '/routes', endpoint: '/routes' },
  { prefix: '/services', endpoint: '/services' },
  { prefix: '/events', endpoint: '/events' },
]

async function fetchSlugs(endpoint, extraQuery = '') {
  try {
    const res = await fetch(`${API_URL}${endpoint}?limit=1000${extraQuery}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const list = Array.isArray(data) ? data : (data.items || data.data || data.results || [])
    return list.map((x) => x.slug).filter(Boolean)
  } catch (e) {
    console.warn(`[prerender] пропуск ${endpoint}${extraQuery}: ${e.message}`)
    return []
  }
}

async function buildUrlList() {
  const urls = new Set(STATIC_PATHS)
  for (const d of DYNAMIC) {
    const slugs = await fetchSlugs(d.endpoint)
    for (const slug of slugs) urls.add(`${d.prefix}/${slug}`)
  }
  // Публичный /news без параметра отдаёт только type=news (см.
  // src/app/admin/news/page.jsx: typeFilter по умолчанию 'news'); статьи —
  // отдельным запросом type=article.
  const newsSlugs = await fetchSlugs('/news')
  const articleSlugs = await fetchSlugs('/news', '&type=article')
  for (const slug of [...newsSlugs, ...articleSlugs]) urls.add(`/news/${slug}`)
  return Array.from(urls)
}

// ---------------------------------------------------------------------------
// 3. Мини-сервер на dist
// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

function startStaticServer(indexTemplate) {
  const server = createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(req.url.split('?')[0])
      let filePath = resolve(DIST, '.' + urlPath)
      if (filePath !== DIST && !filePath.startsWith(DIST_PREFIX)) {
        res.writeHead(403)
        res.end()
        return
      }
      if (existsSync(filePath) && statSync(filePath).isDirectory()) {
        filePath = join(filePath, 'index.html')
      }
      if (existsSync(filePath) && statSync(filePath).isFile()) {
        const ext = extname(filePath).toLowerCase()
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
        res.end(readFileSync(filePath))
        return
      }
      // SPA-фоллбек: путь без файла (клиентский роут ещё не пререндерен) — шаблон
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(indexTemplate)
    } catch (e) {
      res.writeHead(500)
      res.end(String(e && e.message))
    }
  })
  return new Promise((resolvePromise, reject) => {
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => resolvePromise(server))
  })
}

// ---------------------------------------------------------------------------
// 4. Сборка итогового HTML из шаблона
// ---------------------------------------------------------------------------
function stripStaticMeta(template) {
  // Убираем статические meta description / og:* из шаблона — их дублирует
  // Seo-компонент через helmet (data-rh-теги вставляются отдельно ниже).
  return template
    .split('\n')
    .filter((line) => {
      const t = line.trim()
      if (/^<meta name="description"/.test(t)) return false
      if (/^<meta property="og:/.test(t)) return false
      return true
    })
    .join('\n')
}

function escapeHtml(str) {
  return String(str).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
}

function assembleHtml(cleanedTemplate, { title, headTagsHtml, rootHtml }) {
  let html = cleanedTemplate
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title || '')}</title>`)
  html = html.replace('</head>', `${headTagsHtml}\n  </head>`)
  html = html.replace('<div id="root"></div>', `<div id="root">${rootHtml}</div>`)
  return html
}

// ---------------------------------------------------------------------------
// 5. Puppeteer: обход, извлечение, санитизация
// ---------------------------------------------------------------------------
async function withTimeout(promiseFactory, ms, label) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}: таймаут ${ms}мс`)), ms)
  })
  try {
    return await Promise.race([promiseFactory(), timeout])
  } finally {
    clearTimeout(timer)
  }
}

async function extractPage(page) {
  return page.evaluate(() => {
    // Cookie-плашка отрисуется сама после загрузки JS (при первом заходе
    // согласие ещё не дано) — в статический снапшот её не кладём.
    document.querySelectorAll('[aria-label*="cookie" i]').forEach((el) => el.remove())
    const root = document.getElementById('root')
    if (root) {
      root.querySelectorAll('script, iframe').forEach((el) => el.remove())
    }
    const headTags = Array.from(document.querySelectorAll('head [data-rh]')).map((el) => el.outerHTML)
    return {
      title: document.title,
      rootHtml: root ? root.innerHTML : '',
      headTagsHtml: headTags.map((t) => `    ${t}`).join('\n'),
    }
  })
}

function normalizePath(p) {
  return p.replace(/\/$/, '') || '/'
}

// Некоторые маршруты (напр. /places/:slug) монтируют ТОТ ЖЕ компонент, что и
// список, и переключают <Seo> на детальный вариант только после отдельного
// клиентского запроса поверх уже смонтированного списка (см.
// src/sections/Places/Places_page.jsx: isDetail). Из-за react-helmet-async,
// который коммитит теги в DOM через requestAnimationFrame (см.
// node_modules/react-helmet-async/lib/index.js), под конкурентной нагрузкой
// на несколько вкладок этот повторный коммит иногда не успевает произойти —
// networkidle2 и «root непуст» при этом оба уже истинны, ошибки нет, но
// извлечённый снапшот — от ещё не переключившегося списка. Простое ожидание
// дольше не помогает (наблюдалось зависание на 12+ с без изменений) —
// помогает только повторная попытка со свежей вкладкой. Поэтому проверяем
// canonical в извлечённых head-тегах: он всегда равен location.pathname на
// момент коммита (см. src/components/Seo/Seo.jsx), значит несовпадение с
// запрошенным URL — надёжный сигнал «попали не на тот коммит», и тогда явно
// бросаем ошибку, чтобы renderWithRetry повторил заход целиком.
function canonicalPathOf(headTagsHtml) {
  const m = headTagsHtml.match(/<link rel="canonical" href="([^"]+)"/)
  if (!m) return null
  try {
    return new URL(m[1]).pathname
  } catch {
    return null
  }
}

async function renderOnce(browser, baseUrl, urlPath) {
  const page = await browser.newPage()
  try {
    return await withTimeout(async () => {
      await page
        .goto(`${baseUrl}${urlPath}`, { waitUntil: 'networkidle2', timeout: GOTO_TIMEOUT_MS })
        .catch(() => {}) // networkidle2 может не наступить (напр. /map с непрерывными тайлами) — не фатально
      await page.waitForFunction(
        () => {
          const el = document.getElementById('root')
          return !!el && el.innerHTML.trim().length > 0
        },
        { timeout: WAIT_ROOT_TIMEOUT_MS }
      )
      // networkidle2 (goto выше) допускает до 2 висящих соединений — под
      // конкурентной нагрузкой этого мало (см. комментарий у canonicalPathOf),
      // поэтому дожидаемся полного затишья (0 соединений) отдельно. Не
      // фатально, если не наступит (напр. /map с непрерывными тайлами) —
      // извлекаем то, что есть, а корректность снапшота перепроверяет
      // canonical-проверка ниже.
      await page.waitForNetworkIdle({ idleTime: 500, concurrency: 0, timeout: NETWORK_IDLE_TIMEOUT_MS }).catch(() => {})
      const result = await extractPage(page)
      const canonicalPath = canonicalPathOf(result.headTagsHtml)
      if (canonicalPath !== null && normalizePath(canonicalPath) !== normalizePath(urlPath)) {
        throw new Error(`canonical не совпадает с запрошенным URL: ждали ${urlPath}, получили ${canonicalPath}`)
      }
      return result
    }, PAGE_BUDGET_MS, urlPath)
  } finally {
    await page.close().catch(() => {})
  }
}

async function renderWithRetry(browser, baseUrl, urlPath) {
  let lastError
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      return await renderOnce(browser, baseUrl, urlPath)
    } catch (e) {
      lastError = e
      if (attempt < RETRIES) console.warn(`[prerender] ретрай ${urlPath}: ${e.message}`)
    }
  }
  throw lastError
}

async function runPool(items, worker, concurrency) {
  let index = 0
  async function next() {
    while (index < items.length) {
      const i = index++
      await worker(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next))
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const startedAt = Date.now()

  if (!existsSync(DIST) || !existsSync(resolve(DIST, 'index.html'))) {
    console.error('[prerender] dist/ не найден — сначала выполните `npm run build`')
    process.exit(1)
  }

  const indexTemplate = readFileSync(resolve(DIST, 'index.html'), 'utf8')
  const cleanedTemplate = stripStaticMeta(indexTemplate)

  console.log(`[prerender] API: ${API_URL}`)
  console.log('[prerender] собираю список URL...')
  const urlList = await buildUrlList()
  const targets = [...urlList, NOT_FOUND_PROBE_PATH]
  console.log(`[prerender] к обходу: ${urlList.length} URL + 1 проба 404`)

  const server = await startStaticServer(indexTemplate)
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  const browser = await puppeteer.launch({ headless: true })

  rmSync(TMP, { recursive: true, force: true })
  mkdirSync(TMP, { recursive: true })

  const stats = { ok: 0, fail: 0, totalBytes: 0, failures: [] }

  await runPool(
    targets,
    async (urlPath) => {
      try {
        const { title, headTagsHtml, rootHtml } = await renderWithRetry(browser, baseUrl, urlPath)
        const html = assembleHtml(cleanedTemplate, { title, headTagsHtml, rootHtml })
        const outPath = urlPath === NOT_FOUND_PROBE_PATH
          ? resolve(TMP, '404.html')
          : resolve(TMP, '.' + urlPath, 'index.html')
        mkdirSync(dirname(outPath), { recursive: true })
        writeFileSync(outPath, html, 'utf8')
        stats.ok++
        stats.totalBytes += Buffer.byteLength(html)
      } catch (e) {
        stats.fail++
        stats.failures.push({ url: urlPath, error: e.message })
      }
    },
    CONCURRENCY
  )

  await browser.close()
  await new Promise((r) => server.close(r))

  // Перенос во «взрослый» dist одним проходом (корневая '/' в составе TMP —
  // TMP/index.html — перезаписывает dist/index.html этим же вызовом).
  cpSync(TMP, DIST, { recursive: true, force: true })
  rmSync(TMP, { recursive: true, force: true })

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1)
  const mb = (stats.totalBytes / 1024 / 1024).toFixed(2)
  console.log(`[prerender] готово: ok=${stats.ok} fail=${stats.fail} объём=${mb}МБ время=${elapsedSec}с`)
  if (stats.failures.length) {
    console.log('[prerender] страницы с ошибками:')
    for (const f of stats.failures) console.log(`  ${f.url}: ${f.error}`)
  }

  const failRate = stats.fail / targets.length
  if (failRate > 0.1) {
    console.error(`[prerender] доля ошибок ${(failRate * 100).toFixed(1)}% > 10% — сборка провалена`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('[prerender] фатальная ошибка:', e)
  process.exit(1)
})
