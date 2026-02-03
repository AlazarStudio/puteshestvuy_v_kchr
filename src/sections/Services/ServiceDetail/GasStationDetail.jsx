'use client'

import GenericServiceDetail from './GenericServiceDetail'
import common from './ServiceDetailCommon.module.css'

const config = {
  breadcrumbTitle: 'АЗС',
  categoryLabel: 'АЗС',
  serviceName: 'АЗС на трассе А-155',
  tags: ['АИ-92', 'АИ-95', 'дизель'],
  aboutTitle: 'Об АЗС',
  aboutContent: (
    <>
      <p>Круглосуточная заправка на трассе. Виды топлива: АИ-92, АИ-95, дизель. Дополнительно: магазин, кафе, туалеты.</p>
    </>
  ),
  sections: [
    {
      id: 'services',
      title: 'Услуги',
      content: (
        <ul className={common.bulletList}>
          <li>АИ-92, АИ-95, дизель</li>
          <li>Магазин продуктов и товаров первой необходимости</li>
          <li>Кафе</li>
          <li>Туалеты, парковка</li>
        </ul>
      ),
    },
  ],
  contacts: [
    { label: 'Адрес', value: 'КЧР, трасса А-155, км 55' },
    { label: 'Режим работы', value: 'круглосуточно' },
  ],
  primaryButtonText: 'Уточнить информацию',
  reviewPlaceholder: 'Ваш отзыв',
}

export default function GasStationDetail() {
  return <GenericServiceDetail config={config} />
}
