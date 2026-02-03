'use client'

import GenericServiceDetail from './GenericServiceDetail'
import common from './ServiceDetailCommon.module.css'

const config = {
  breadcrumbTitle: 'Пункт придорожного сервиса',
  categoryLabel: 'Пункты придорожного сервиса',
  serviceName: 'Придорожный комплекс на трассе',
  tags: ['трасса А-155', 'ежедневно 8:00–22:00'],
  aboutTitle: 'О сервисе',
  aboutContent: (
    <>
      <p>Комплекс услуг для водителей и пассажиров: заправка, мойка, шиномонтаж, кафе, магазин. Удобная парковка, туалеты, Wi‑Fi.</p>
      <p>Работаем без выходных в сезон. Принимаем карты и наличные.</p>
    </>
  ),
  sections: [
    {
      id: 'services',
      title: 'Услуги',
      content: (
        <ul className={common.bulletList}>
          <li>Автомойка (ручная и автоматическая)</li>
          <li>Шиномонтаж, подкачка колёс</li>
          <li>Кафе и столовая</li>
          <li>Магазин продуктов и сувениров</li>
          <li>Туалеты, парковка</li>
        </ul>
      ),
    },
  ],
  contacts: [
    { label: 'Адрес', value: 'КЧР, трасса А-155, км 42' },
    { label: 'Телефон', value: '+7 (928) 123-45-67', href: 'tel:+79281234567' },
    { label: 'Режим работы', value: 'ежедневно 8:00–22:00' },
  ],
  primaryButtonText: 'Связаться',
  reviewPlaceholder: 'Ваш отзыв о сервисе',
}

export default function RoadsideServiceDetail() {
  return <GenericServiceDetail config={config} />
}
