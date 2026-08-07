import terms from './terms'
import privacyPolicy from './privacy-policy'
import consent from './consent'

const DOCUMENTS = [terms, privacyPolicy, consent]

export const LEGAL_PATHS = {
  terms: `/legal/${terms.slug}`,
  privacyPolicy: `/legal/${privacyPolicy.slug}`,
  consent: `/legal/${consent.slug}`,
}

export function getLegalDocument(slug) {
  return DOCUMENTS.find((doc) => doc.slug === slug) || null
}
