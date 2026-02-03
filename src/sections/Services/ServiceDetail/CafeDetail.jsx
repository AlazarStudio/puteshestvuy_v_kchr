'use client'

import GenericServiceDetail from './GenericServiceDetail'
import common from './ServiceDetailCommon.module.css'

const config = {
  breadcrumbTitle: 'Кафе и ресторан',
  categoryLabel: 'Кафе и ресторан',
  serviceName: 'Кафе «У камина»',
  tags: ['европейская кухня', 'горная кухня', '12:00–23:00'],
  aboutTitle: 'О заведении',
  aboutContent: (
    <>
      <p>Уютное кафе с панорамным видом: европейская и местная кухня, выпечка, напитки. Подойдёт для завтрака перед маршрутом и ужина после прогулки.</p>
    </>
  ),
  sections: [
    {
      id: 'cuisine',
      title: 'Кухня и меню',
      content: (
        <ul className={common.bulletList}>
          <li>Горячие блюда (горная и европейская кухня)</li>
          <li>Супы, салаты, гарниры</li>
          <li>Выпечка и десерты</li>
          <li>Напитки, в том числе горячие</li>
        </ul>
      ),
    },
  ],
  contacts: [
    { label: 'Адрес', value: 'КЧР, пос. Архыз, ул. Ресторанная, 5' },
    { label: 'Телефон', value: '+7 (928) 123-45-67', href: 'tel:+79281234567' },
    { label: 'Режим работы', value: 'ежедневно 12:00–23:00' },
  ],
  primaryButtonText: 'Забронировать столик',
  reviewPlaceholder: 'Ваш отзыв о кафе',
}

export default function CafeDetail() {
  return <GenericServiceDetail config={config} />
}
