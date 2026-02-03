'use client'

import GenericServiceDetail from './GenericServiceDetail'
import common from './ServiceDetailCommon.module.css'

const config = {
  breadcrumbTitle: 'Гостиница',
  categoryLabel: 'Гостиница',
  serviceName: 'Гостиница «Горный ветер»',
  tags: ['Wi‑Fi', 'парковка', 'завтрак'],
  aboutTitle: 'О гостинице',
  aboutContent: (
    <>
      <p>Уютная гостиница в горном посёлке: номера разных категорий, Wi‑Fi, парковка. По утрам подают завтрак. Близко к маршрутам и достопримечательностям.</p>
    </>
  ),
  sections: [
    {
      id: 'rooms',
      title: 'Номера и цены',
      content: (
        <ul className={common.bulletList}>
          <li>Стандарт (2 места) — от 3 500 ₽/сут</li>
          <li>Улучшенный (2–4 места) — от 5 000 ₽/сут</li>
          <li>Семейный (4–6 мест) — от 7 000 ₽/сут</li>
        </ul>
      ),
    },
    {
      id: 'amenities',
      title: 'Удобства',
      content: (
        <ul className={common.bulletList}>
          <li>Wi‑Fi на всей территории</li>
          <li>Охраняемая парковка</li>
          <li>Завтрак (по желанию)</li>
          <li>Трансфер до маршрутов (по запросу)</li>
        </ul>
      ),
    },
  ],
  contacts: [
    { label: 'Адрес', value: 'КЧР, пос. Архыз, ул. Гостиничная, 1' },
    { label: 'Телефон', value: '+7 (928) 123-45-67', href: 'tel:+79281234567' },
    { label: 'Email', value: 'hotel@example.com', href: 'mailto:hotel@example.com' },
  ],
  primaryButtonText: 'Забронировать',
  reviewPlaceholder: 'Ваш отзыв о гостинице',
}

export default function HotelDetail() {
  return <GenericServiceDetail config={config} />
}
