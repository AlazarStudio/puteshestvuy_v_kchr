import { getImageUrl } from '@/lib/api'


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

  const galleryEnabled = d.galleryEnabled !== false
  const gallerySources = Array.isArray(d.galleryImages) && d.galleryImages.length > 0
    ? d.galleryImages
    : (Array.isArray(service.images) ? service.images : [])

  const photos =
    galleryEnabled && gallerySources.length > 0
      ? gallerySources.map((path) => ({ src: getImageUrl(path) }))
      : (Array.isArray(service.images) && service.images.length > 0
          ? service.images.map((path) => ({ src: getImageUrl(path) }))
          : [])

  const contacts = Array.isArray(d.contacts) && d.contacts.length > 0
    ? d.contacts.map((c) => ({
        label: c.label || '',
        value: c.value || '',
        href: c.href || null,
        icon: c.icon || null,
        target: c.target,
        rel: c.rel,
      }))
    : buildContactsFromService(service)

  const normalizeList = (arr) => (Array.isArray(arr) ? arr.map((s) => (typeof s === 'string' ? s : (s?.title ?? s?.name ?? String(s)))).filter((s) => String(s).trim()) : [])
  let sections = Array.isArray(d.sections)
    ? d.sections.map((s) => ({
        id: s.id || `section-${Math.random().toString(36).slice(2)}`,
        title: s.title || '',
        content: typeof s.content === 'string' ? s.content : (Array.isArray(s.content) ? s.content : (s.content || '')),
      }))
    : []
  if (Array.isArray(d.cuisineList) && d.cuisineList.length > 0) {
    sections = [...sections, { id: 'cuisine', title: 'Кухня / меню', content: normalizeList(d.cuisineList) }]
  }
  const listSections = [
    [d.servicesList, 'Услуги', 'services'],
    [d.assortment, 'Ассортимент', 'assortment'],
    [d.products, 'Что продаём', 'products'],
    [d.amenities, 'Удобства', 'amenities'],
    [d.routesList, 'Направления', 'routes'],
    [d.howtoList, 'Как добраться', 'howto'],
    [d.toursList, 'Туры и программы', 'tours'],
    [d.conditions, 'Условия', 'conditions'],
  ]
  listSections.forEach(([arr, title, id]) => {
    const list = normalizeList(arr)
    if (list.length > 0) sections = [...sections, { id, title, content: list }]
  })

  const aboutContent = d.aboutContent || service.description || service.shortDescription || ''

  const reviews = Array.isArray(service.reviews)
    ? service.reviews.map((r) => ({
        id: r.id,
        name: r.authorName || 'Гость',
        date: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : '',
        rating: r.rating ?? 5,
        text: r.text || '',
        avatar: r.authorAvatar || '',
      }))
    : null

  const avatarImg = d.avatar
    ? getImageUrl(d.avatar)
    : (Array.isArray(service.images) && service.images[0]
        ? getImageUrl(service.images[0])
        : '/serviceImg1.png')

  const rooms =
    service.category === 'Гостиница' && Array.isArray(d.roomTypes)
      ? d.roomTypes.map((r) => ({
          name: r.name || '',
          price: r.price || '',
          description: r.description || '',
          images: (Array.isArray(r.images) ? r.images : []).map((url) => getImageUrl(url)),
        }))
      : []

  const hasMapCoords = service.latitude != null && service.longitude != null && Number(service.latitude) && Number(service.longitude)
  const mapData = hasMapCoords
    ? {
        latitude: Number(service.latitude),
        longitude: Number(service.longitude),
        title: serviceName,
        location: service.address || '',
        image: avatarImg !== '/serviceImg1.png' ? avatarImg : null,
      }
    : null

  return {
    breadcrumbTitle: serviceName || categoryLabel,
    categoryLabel,
    serviceName,
    tags: Array.isArray(d.criteriaList) && d.criteriaList.length > 0
      ? d.criteriaList.filter((s) => String(s).trim())
      : (Array.isArray(d.tags) ? d.tags : (typeof d.tags === 'string' && d.tags ? d.tags.split(',').map((s) => s.trim()).filter(Boolean) : [])),
    aboutTitle: aboutContent ? 'О сервисе' : '',
    aboutContent,
    sections,
    contacts,
    mapData,
    primaryButtonText: 'Связаться',
    reviewPlaceholder: 'Ваш отзыв',
    showReviews: true,
    avatarImg,
    photos,
    reviews,
    rating: service.rating ?? null,
    reviewsCount: service.reviewsCount ?? 0,
    rooms,
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
