'use client'

import GenericServiceDetail from './GenericServiceDetail'
import common from './ServiceDetailCommon.module.css'

const config = {
  breadcrumbTitle: 'Придорожный пункт',
  categoryLabel: 'Придорожный пункт',
  serviceName: 'Придорожный пункт отдыха',
  tags: ['парковка', 'туалеты', 'кафе'],
  aboutTitle: 'О пункте',
  aboutContent: (
    <>
      <p>Место для остановки на трассе: парковка, санитарные узлы, возможность перекусить. Безопасная стоянка для отдыха в пути.</p>
    </>
  ),
  sections: [
    {
      id: 'services',
      title: 'Услуги',
      content: (
        <ul className={common.bulletList}>
          <li>Парковка для легковых и автобусов</li>
          <li>Санитарные узлы</li>
          <li>Кафе / столовая</li>
          <li>Информация о маршрутах</li>
        </ul>
      ),
    },
  ],
  contacts: [
    { label: 'Адрес', value: 'КЧР, трасса А-155' },
    { label: 'Режим работы', value: 'круглосуточно' },
  ],
  primaryButtonText: 'Уточнить информацию',
  reviewPlaceholder: 'Ваш отзыв',
}

export default function RoadsidePointDetail() {
  return <GenericServiceDetail config={config} />
}
