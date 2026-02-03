import { getImageUrl } from '@/lib/api'

const DEFAULT_PHOTOS = [
  { src: '/routeGalery1.png' },
  { src: '/routeGalery2.png' },
  { src: '/routeGalery3.png' },
  { src: '/routeGalery4.png' },
  { src: '/routeGalery5.png' },
]

/**
 * Собирает config для GenericServiceDetail из ответа API (service + service.data).
 * @param {Object} service — объект услуги с полями title, category, images, description, phone, email, telegram, address, data
 * @returns {Object} config для GenericServiceDetail
 */
export function buildGenericServiceConfig(service) {
  if (!service) {
    return {
      breadcrumbTitle: 'Услуга',
      categoryLabel: '',
      serviceName: '',
      tags: [],
      aboutTitle: 'О сервисе',
      aboutContent: '',
      sections: [],
      contacts: [],
      photos: DEFAULT_PHOTOS,
    }
  }

  const d = service.data || {}
  const categoryLabel = service.category || 'Услуга'
  const serviceName = service.title || ''

  const photos =
    Array.isArray(service.images) && service.images.length > 0
      ? service.images.map((path) => ({ src: getImageUrl(path) }))
      : DEFAULT_PHOTOS

  const contacts = Array.isArray(d.contacts) && d.contacts.length > 0
    ? d.contacts.map((c) => ({
        label: c.label || '',
        value: c.value || '',
        href: c.href || null,
        target: c.target,
        rel: c.rel,
      }))
    : buildContactsFromService(service)

  const sections = Array.isArray(d.sections)
    ? d.sections.map((s) => ({
        id: s.id || `section-${Math.random().toString(36).slice(2)}`,
        title: s.title || '',
        content: typeof s.content === 'string' ? s.content : (s.content || ''),
      }))
    : []

  const aboutContent = d.aboutContent || service.description || service.shortDescription || ''

  return {
    breadcrumbTitle: serviceName || categoryLabel,
    categoryLabel,
    serviceName,
    tags: Array.isArray(d.tags) ? d.tags : [],
    aboutTitle: aboutContent ? 'О сервисе' : '',
    aboutContent,
    sections,
    contacts,
    primaryButtonText: 'Связаться',
    reviewPlaceholder: 'Ваш отзыв',
    showReviews: true,
    avatarImg: '/serviceImg1.png',
    photos,
    reviews: null,
  }
}

function buildContactsFromService(service) {
  const items = []
  if (service.address) items.push({ label: 'Адрес', value: service.address })
  if (service.phone) items.push({ label: 'Телефон', value: service.phone, href: `tel:${service.phone.replace(/\D/g, '')}` })
  if (service.email) items.push({ label: 'Email', value: service.email, href: `mailto:${service.email}` })
  if (service.telegram) items.push({ label: 'Telegram', value: service.telegram, href: `https://t.me/${service.telegram.replace('@', '')}` })
  return items
}
