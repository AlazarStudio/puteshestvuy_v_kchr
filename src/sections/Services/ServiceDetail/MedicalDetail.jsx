'use client'

import GenericServiceDetail from './GenericServiceDetail'
import common from './ServiceDetailCommon.module.css'

const config = {
  breadcrumbTitle: 'Пункт медпомощи',
  categoryLabel: 'Пункт медпомощи',
  serviceName: 'Фельдшерско-акушерский пункт',
  tags: ['первая помощь', 'медпункт'],
  aboutTitle: 'О пункте',
  aboutContent: (
    <>
      <p>Пункт первой медицинской помощи для туристов и местных жителей. Базовая диагностика, первая помощь, направление в стационар при необходимости.</p>
    </>
  ),
  sections: [
    {
      id: 'howto',
      title: 'Как добраться',
      content: (
        <ul className={common.bulletList}>
          <li>Расположен в центре посёлка, рядом с администрацией</li>
          <li>Пешком от центральной парковки — 3–5 минут</li>
          <li>В экстренных случаях звоните 103 или 112</li>
        </ul>
      ),
    },
  ],
  contacts: [
    { label: 'Адрес', value: 'КЧР, пос. Архыз, ул. Медицинская, 2' },
    { label: 'Телефон', value: '+7 (878) 123-45-67', href: 'tel:+78781234567' },
    { label: 'Режим работы', value: 'пн–пт 8:00–18:00, сб 9:00–15:00' },
    { label: 'Скорая', value: '103 или 112', href: 'tel:103' },
  ],
  primaryButtonText: 'Позвонить',
  showReviews: false,
}

export default function MedicalDetail() {
  return <GenericServiceDetail config={config} />
}
