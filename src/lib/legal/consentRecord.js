import terms from './terms'
import privacyPolicy from './privacy-policy'
import consent from './consent'
import accountConsent from './account-consent'

// Политика требует хранить подтверждение согласия: дату и время, редакцию текста,
// сведения о форме и факт установки отметки. Фронтенд эти сведения формирует,
// сохраняет их бэкенд.
function baseRecord(form) {
  return {
    acceptedAt: new Date().toISOString(),
    // только путь, без query — данные формы в URL не попадают
    page: window.location.pathname,
    form,
    privacyPolicy: {
      version: privacyPolicy.version || null,
      url: `/legal/${privacyPolicy.slug}`,
    },
  }
}

function documentRecord(doc, accepted) {
  return {
    accepted,
    version: doc.version || null,
    url: `/legal/${doc.slug}`,
  }
}

export function buildConsentRecord({ termsAccepted, dataAccepted }) {
  return {
    ...baseRecord('footer-feedback'),
    terms: documentRecord(terms, termsAccepted),
    dataProcessing: documentRecord(consent, dataAccepted),
  }
}

export function buildRegistrationConsentRecord({ termsAccepted, dataAccepted }) {
  return {
    ...baseRecord('registration'),
    terms: documentRecord(terms, termsAccepted),
    dataProcessing: documentRecord(accountConsent, dataAccepted),
  }
}
