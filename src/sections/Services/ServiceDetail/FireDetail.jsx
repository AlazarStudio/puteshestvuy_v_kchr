'use client'

import GenericServiceDetail from './GenericServiceDetail'

const config = {
  breadcrumbTitle: 'Пожарная охрана',
  categoryLabel: 'Пожарная охрана',
  serviceName: 'Пожарная часть',
  tags: ['экстренная связь'],
  aboutTitle: 'О подразделении',
  aboutContent: (
    <>
      <p>Подразделение пожарной охраны. В случае возгорания или чрезвычайной ситуации звоните 101 или 112.</p>
    </>
  ),
  sections: [],
  contacts: [
    { label: 'Адрес', value: 'КЧР, пос. Архыз, ул. Пожарная, 1' },
    { label: 'Телефон', value: '+7 (878) 123-45-67', href: 'tel:+78781234567' },
    { label: 'Экстренная связь', value: '101 или 112', href: 'tel:101' },
  ],
  primaryButtonText: 'Позвонить',
  showReviews: false,
}

export default function FireDetail() {
  return <GenericServiceDetail config={config} />
}
