import terms from './terms'
import privacyPolicy from './privacy-policy'
import consent from './consent'
import accountConsent from './account-consent'
import cookiePolicy from './cookie-policy'
import distributionConsent from './distribution-consent'

const DOCUMENTS = [terms, privacyPolicy, consent, accountConsent, cookiePolicy, distributionConsent]

export const LEGAL_PATHS = {
  terms: `/legal/${terms.slug}`,
  privacyPolicy: `/legal/${privacyPolicy.slug}`,
  consent: `/legal/${consent.slug}`,
  accountConsent: `/legal/${accountConsent.slug}`,
  cookiePolicy: `/legal/${cookiePolicy.slug}`,
  distributionConsent: `/legal/${distributionConsent.slug}`,
}

export function getLegalDocument(slug) {
  return DOCUMENTS.find((doc) => doc.slug === slug) || null
}
