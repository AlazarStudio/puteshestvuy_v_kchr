// src/lib/seo/schema.js
import { SITE_URL, SITE_NAME, absoluteUrl } from './config'

const CTX = 'https://schema.org'
const LOGO = absoluteUrl('/color_logo.png')

export function organization() {
  return { '@context': CTX, '@type': 'Organization', name: SITE_NAME, url: SITE_URL + '/', logo: LOGO }
}

export function website() {
  return { '@context': CTX, '@type': 'WebSite', name: SITE_NAME, url: SITE_URL + '/', inLanguage: 'ru' }
}

export function touristDestination({ name, description, url, image }) {
  const node = { '@context': CTX, '@type': 'TouristDestination', name, url }
  if (description) node.description = description
  if (image) node.image = image
  return node
}

export function collectionPage({ name, description, url }) {
  const node = { '@context': CTX, '@type': 'CollectionPage', name, url }
  if (description) node.description = description
  return node
}

export function itemList(items = []) {
  return {
    '@context': CTX,
    '@type': 'ItemList',
    itemListElement: items.filter(Boolean).map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, url: it.url,
    })),
  }
}

export function breadcrumbList(crumbs = []) {
  return {
    '@context': CTX,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.filter(Boolean).map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.name, item: c.url,
    })),
  }
}

export function touristAttraction({ name, description, url, image, geo, address }) {
  const node = { '@context': CTX, '@type': 'TouristAttraction', name, url }
  if (description) node.description = description
  if (image) node.image = image
  if (geo && geo.lat != null && geo.lng != null) {
    node.geo = { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng }
  }
  if (address) node.address = address
  return node
}

export function touristTrip({ name, description, url, image, itinerary }) {
  const node = { '@context': CTX, '@type': 'TouristTrip', name, url }
  if (description) node.description = description
  if (image) node.image = image
  if (Array.isArray(itinerary) && itinerary.length) {
    node.itinerary = itinerary.filter(Boolean).map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, ...(it.url ? { item: it.url } : {}),
    }))
  }
  return node
}

export function newsArticle({ headline, description, url, image, datePublished, type = 'NewsArticle' }) {
  const node = {
    '@context': CTX, '@type': type, headline, url, mainEntityOfPage: url,
    publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: LOGO } },
  }
  if (description) node.description = description
  if (image) node.image = image
  if (datePublished) node.datePublished = datePublished
  return node
}

export function article(props) {
  return newsArticle({ ...props, type: 'Article' })
}

export function localBusiness(schemaType, { name, description, url, image, address, phone, email, geo }) {
  const node = { '@context': CTX, '@type': schemaType || 'LocalBusiness', name, url }
  if (description) node.description = description
  if (image) node.image = image
  if (address) node.address = address
  if (phone) node.telephone = phone
  if (email) node.email = email
  if (geo && geo.lat != null && geo.lng != null) {
    node.geo = { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng }
  }
  return node
}
