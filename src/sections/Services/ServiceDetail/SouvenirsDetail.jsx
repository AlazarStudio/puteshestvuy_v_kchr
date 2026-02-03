'use client'

import GenericServiceDetail from './GenericServiceDetail'
import common from './ServiceDetailCommon.module.css'

const config = {
  breadcrumbTitle: 'Сувениры',
  categoryLabel: 'Сувениры',
  serviceName: 'Сувенирная лавка «Карачаево-Черкесия»',
  tags: ['рукоделие', 'украшения', 'керамика'],
  aboutTitle: 'О магазине',
  aboutContent: (
    <>
      <p>Сувениры и изделия ручной работы: украшения, керамика, изделия из кожи и войлока, магниты, открытки. Авторские работы местных мастеров.</p>
    </>
  ),
  sections: [
    {
      id: 'products',
      title: 'Что продаём',
      content: (
        <ul className={common.bulletList}>
          <li>Украшения и бижутерия</li>
          <li>Керамика и посуда</li>
          <li>Изделия из кожи и войлока</li>
          <li>Магниты, открытки, карты</li>
          <li>Текстиль с национальной символикой</li>
        </ul>
      ),
    },
  ],
  contacts: [
    { label: 'Адрес', value: 'КЧР, г. Черкесск, ул. Ленина, 42' },
    { label: 'Телефон', value: '+7 (928) 123-45-67', href: 'tel:+79281234567' },
    { label: 'Режим работы', value: 'пн–вс 10:00–19:00' },
  ],
  primaryButtonText: 'Написать',
  reviewPlaceholder: 'Ваш отзыв',
}

export default function SouvenirsDetail() {
  return <GenericServiceDetail config={config} />
}
