/**
 * Схема полей шаблона по типу услуги для формы в админке.
 * key — ключ в data; label — подпись в форме; type — тип контрола.
 */
export const SERVICE_TYPE_FIELDS = {
  guide: [
    { key: 'aboutContent', label: 'О специалисте (описание)', type: 'richtext' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
    { key: 'pricesInData', label: 'Услуги и цены (название — цена)', type: 'priceList' },
    { key: 'certificatesInData', label: 'Сертификаты и документы', type: 'certificateList' },
  ],
  activities: [
    { key: 'aboutContent', label: 'О активности (описание)', type: 'richtext' },
    { key: 'programSteps', label: 'Программа (каждый пункт — заголовок и текст через «: »)', type: 'stringList' },
    { key: 'equipmentList', label: 'Что взять с собой (пункты списка)', type: 'stringList' },
    { key: 'requirementsList', label: 'Требования к участникам', type: 'stringList' },
    { key: 'safetyNotes', label: 'Безопасность (пункты)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  'equipment-rental': [
    { key: 'aboutContent', label: 'О прокате (описание)', type: 'richtext' },
    { key: 'equipmentItems', label: 'Каталог оборудования', type: 'equipmentList' },
    { key: 'conditions', label: 'Условия проката (пункты списка)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  'roadside-service': [
    { key: 'aboutContent', label: 'О сервисе (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'servicesList', label: 'Услуги (пункты списка)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  'roadside-point': [
    { key: 'aboutContent', label: 'О пункте (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'servicesList', label: 'Услуги (пункты списка)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  shop: [
    { key: 'aboutContent', label: 'О магазине (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'assortment', label: 'Ассортимент (пункты списка)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  souvenirs: [
    { key: 'aboutContent', label: 'О магазине (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'products', label: 'Что продаём (пункты списка)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  hotel: [
    { key: 'aboutContent', label: 'О гостинице (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'roomTypes', label: 'Номера и цены (название — цена)', type: 'priceList' },
    { key: 'amenities', label: 'Удобства (пункты списка)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  cafe: [
    { key: 'aboutContent', label: 'О заведении (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'cuisineList', label: 'Кухня / меню (пункты списка)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  transfer: [
    { key: 'aboutContent', label: 'О трансфере (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'routesList', label: 'Направления и цены (пункты списка)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  'gas-station': [
    { key: 'aboutContent', label: 'Об АЗС (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'servicesList', label: 'Услуги (пункты списка)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  toilets: [
    { key: 'aboutContent', label: 'Об объекте (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'conditions', label: 'Условия (пункты списка)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  medical: [
    { key: 'aboutContent', label: 'О пункте (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'howtoList', label: 'Как добраться (пункты списка)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  police: [
    { key: 'aboutContent', label: 'Об отделении (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  fire: [
    { key: 'aboutContent', label: 'О подразделении (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
  'tour-operator': [
    { key: 'aboutContent', label: 'О компании (описание)', type: 'richtext' },
    { key: 'tags', label: 'Теги (через запятую)', type: 'tags' },
    { key: 'toursList', label: 'Туры и программы (пункты списка)', type: 'stringList' },
    { key: 'contacts', label: 'Контакты', type: 'contactList' },
  ],
}

/** Типы полей для формы */
export const FIELD_TYPES = {
  text: 'text',
  textarea: 'textarea',
  richtext: 'richtext',
  tags: 'tags',
  contactList: 'contactList',
  sectionList: 'sectionList',
  equipmentList: 'equipmentList',
  stringList: 'stringList',
  priceList: 'priceList',
  certificateList: 'certificateList',
}
