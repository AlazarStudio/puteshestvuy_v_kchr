// src/components/Seo/Seo.jsx
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import {
  SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, absoluteUrl,
} from '@/lib/seo/config'

// description иногда приходит как rich-text HTML из редактора (Quill) —
// например detailPlace.shortDescription передаётся сюда «как есть», без
// truncate(). Без очистки такая разметка экранируется React прямо в атрибут
// content и в meta description/og:description/twitter:description попадает
// буквальный «&lt;p&gt;&lt;span style=...». Чистим централизованно здесь —
// это закрывает баг сразу для всех страниц (места, маршруты, услуги,
// новости), а не только там, где вызывающий код сам вызвал truncate().
function cleanDescription(raw) {
  if (!raw) return ''
  const withoutTags = String(raw).replace(/<[^>]*>/g, ' ')
  const decoded = withoutTags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
  const collapsed = decoded.replace(/\s+/g, ' ').trim()
  if (collapsed.length <= 200) return collapsed
  const cut = collapsed.slice(0, 200)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

export default function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  jsonLd = [],
}) {
  const location = useLocation()
  const canonicalPath = path ?? location.pathname
  const canonical = absoluteUrl(canonicalPath)
  const metaTitle = title || DEFAULT_TITLE
  const metaDescription = cleanDescription(description) || DEFAULT_DESCRIPTION
  const ogImage = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE
  const scripts = (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(Boolean)

  return (
    <Helmet>
      <html lang="ru" />
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />
      {noindex ? <meta name="robots" content="noindex,nofollow" /> : <meta name="robots" content="index,follow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />

      {scripts.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  )
}
