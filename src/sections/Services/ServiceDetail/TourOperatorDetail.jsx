'use client'

import GenericServiceDetail from './GenericServiceDetail'
import common from './ServiceDetailCommon.module.css'

const config = {
  breadcrumbTitle: 'Туроператор',
  categoryLabel: 'Туроператор',
  serviceName: 'Туристическая компания «Горы КЧР»',
  tags: ['туры', 'экскурсии', 'бронирование'],
  aboutTitle: 'О компании',
  aboutContent: (
    <>
      <p>Организуем туры и экскурсии по Карачаево-Черкесии: горные маршруты, культурные программы, многодневные туры. Индивидуальные и групповые форматы.</p>
    </>
  ),
  sections: [
    {
      id: 'tours',
      title: 'Туры и программы',
      content: (
        <ul className={common.bulletList}>
          <li>Однодневные экскурсии (от 3 000 ₽/чел)</li>
          <li>Многодневные туры с ночёвками (от 15 000 ₽)</li>
          <li>Специализированные программы (фототуры, треккинг)</li>
          <li>Индивидуальные маршруты под запрос</li>
        </ul>
      ),
    },
  ],
  contacts: [
    { label: 'Телефон', value: '+7 (928) 123-45-67', href: 'tel:+79281234567' },
    { label: 'Email', value: 'tours@example.com', href: 'mailto:tours@example.com' },
    { label: 'Telegram', value: '@tours_kchr', href: 'https://t.me/tours_kchr', target: '_blank', rel: 'noopener noreferrer' },
  ],
  primaryButtonText: 'Забронировать тур',
  reviewPlaceholder: 'Ваш отзыв о туре',
}

export default function TourOperatorDetail() {
  return <GenericServiceDetail config={config} />
}
