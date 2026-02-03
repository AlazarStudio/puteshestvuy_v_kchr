'use client'

import GenericServiceDetail from './GenericServiceDetail'
import common from './ServiceDetailCommon.module.css'

const config = {
  breadcrumbTitle: 'Трансфер',
  categoryLabel: 'Трансфер',
  serviceName: 'Трансфер по КЧР',
  tags: ['аэропорт', 'горные курорты', 'под заказ'],
  aboutTitle: 'О трансфере',
  aboutContent: (
    <>
      <p>Трансфер из аэропортов и вокзалов до горных курортов и посёлков. Встреча, проводы, поездки по маршрутам. Автомобили разного класса.</p>
    </>
  ),
  sections: [
    {
      id: 'routes',
      title: 'Направления и цены',
      content: (
        <ul className={common.bulletList}>
          <li>Минеральные Воды — Архыз: от 5 000 ₽</li>
          <li>Минеральные Воды — Домбай: от 6 000 ₽</li>
          <li>Черкесск — Архыз: от 3 500 ₽</li>
          <li>Индивидуальные маршруты — по запросу</li>
        </ul>
      ),
    },
  ],
  contacts: [
    { label: 'Телефон', value: '+7 (928) 123-45-67', href: 'tel:+79281234567' },
    { label: 'Telegram', value: '@transfer_kchr', href: 'https://t.me/transfer_kchr', target: '_blank', rel: 'noopener noreferrer' },
  ],
  primaryButtonText: 'Заказать трансфер',
  reviewPlaceholder: 'Ваш отзыв о трансфере',
}

export default function TransferDetail() {
  return <GenericServiceDetail config={config} />
}
