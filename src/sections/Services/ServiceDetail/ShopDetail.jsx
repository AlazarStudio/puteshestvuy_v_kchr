'use client'

import GenericServiceDetail from './GenericServiceDetail'
import common from './ServiceDetailCommon.module.css'

const config = {
  breadcrumbTitle: 'Торговая точка',
  categoryLabel: 'Торговые точки',
  serviceName: 'Магазин «Горный край»',
  tags: ['продукты', 'снаряжение', '9:00–20:00'],
  aboutTitle: 'О магазине',
  aboutContent: (
    <>
      <p>Товары для туристов и местных жителей: продукты, напитки, базовое снаряжение, карты, сувениры. Удобное расположение в центре посёлка.</p>
    </>
  ),
  sections: [
    {
      id: 'assortment',
      title: 'Ассортимент',
      content: (
        <ul className={common.bulletList}>
          <li>Продукты питания и напитки</li>
          <li>Туристическое снаряжение (базовое)</li>
          <li>Карты и путеводители</li>
          <li>Сувениры и изделия местных мастеров</li>
        </ul>
      ),
    },
  ],
  contacts: [
    { label: 'Адрес', value: 'КЧР, пос. Архыз, ул. Центральная, 15' },
    { label: 'Телефон', value: '+7 (928) 123-45-67', href: 'tel:+79281234567' },
    { label: 'Режим работы', value: 'ежедневно 9:00–20:00' },
  ],
  primaryButtonText: 'Связаться',
  reviewPlaceholder: 'Ваш отзыв о магазине',
}

export default function ShopDetail() {
  return <GenericServiceDetail config={config} />
}
