// src/lib/seo/serviceSeo.js
import { CATEGORY_TO_TEMPLATE_KEY } from '@/sections/Services/ServiceDetail/serviceTypeTemplates'

const KCR = 'Карачаево-Черкесии'

const BY_KEY = {
  guide:             { title: (n) => `${n} — гид в ${KCR}`,                 schema: 'TouristInformationCenter' },
  hotel:             { title: (n) => `${n} — размещение в ${KCR}`,          schema: 'Hotel' },
  cafe:              { title: (n) => `${n} — кафе в ${KCR}`,                schema: 'Restaurant' },
  'equipment-rental':{ title: (n) => `${n} — прокат для путешествий по КЧР`, schema: 'LocalBusiness' },
  transfer:          { title: (n) => `${n} — трансфер в ${KCR}`,            schema: 'LocalBusiness' },
  museum:            { title: (n) => `${n} — музей в ${KCR}`,               schema: 'Museum' },
  'tour-operator':   { title: (n) => `${n} — туристические услуги в ${KCR}`, schema: 'TouristInformationCenter' },
  tic:               { title: (n) => `${n} — туристические услуги в ${KCR}`, schema: 'TouristInformationCenter' },
}

const FALLBACK = { title: (n) => `${n} — услуги для туристов в КЧР`, schema: 'LocalBusiness' }

export function getServiceSeo(category, name) {
  const key = CATEGORY_TO_TEMPLATE_KEY?.[category]
  const cfg = BY_KEY[key] || FALLBACK
  return { title: cfg.title(name), schemaType: cfg.schema }
}
