'use client'

import GenericServiceDetail from './GenericServiceDetail'
import common from './ServiceDetailCommon.module.css'

const config = {
  breadcrumbTitle: 'Санитарные узлы',
  categoryLabel: 'Санитарные узлы',
  serviceName: 'Туалетный комплекс',
  tags: ['платный', 'трасса А-155'],
  aboutTitle: 'Об объекте',
  aboutContent: (
    <>
      <p>Санитарный узел для путешественников на трассе. Платный вход. Поддерживается в чистоте, есть раковины.</p>
    </>
  ),
  sections: [
    {
      id: 'conditions',
      title: 'Условия',
      content: (
        <ul className={common.bulletList}>
          <li>Платный вход (ориентировочно 50 ₽)</li>
          <li>Расположение: трасса, парковка рядом</li>
          <li>Работает в светлое время суток в сезон</li>
        </ul>
      ),
    },
  ],
  contacts: [
    { label: 'Расположение', value: 'КЧР, трасса А-155, парковка у км 38' },
  ],
  primaryButtonText: 'Уточнить',
  reviewPlaceholder: 'Ваш отзыв',
}

export default function ToiletsDetail() {
  return <GenericServiceDetail config={config} />
}
