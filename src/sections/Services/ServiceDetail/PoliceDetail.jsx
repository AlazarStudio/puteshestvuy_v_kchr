'use client'

import GenericServiceDetail from './GenericServiceDetail'
import common from './ServiceDetailCommon.module.css'

const config = {
  breadcrumbTitle: 'МВД',
  categoryLabel: 'МВД',
  serviceName: 'Отделение полиции',
  tags: ['участок', 'экстренная связь'],
  aboutTitle: 'Об отделении',
  aboutContent: (
    <>
      <p>Участок полиции для обращения по вопросам безопасности и правопорядка. В экстренных случаях звоните 102 или 112.</p>
    </>
  ),
  sections: [],
  contacts: [
    { label: 'Адрес', value: 'КЧР, пос. Архыз, ул. Советская, 10' },
    { label: 'Телефон дежурной части', value: '+7 (878) 123-45-67', href: 'tel:+78781234567' },
    { label: 'Режим работы', value: 'круглосуточно (дежурная часть)' },
    { label: 'Экстренная связь', value: '102 или 112', href: 'tel:102' },
  ],
  primaryButtonText: 'Позвонить',
  showReviews: false,
}

export default function PoliceDetail() {
  return <GenericServiceDetail config={config} />
}
