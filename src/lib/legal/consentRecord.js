import terms from './terms'
import privacyPolicy from './privacy-policy'
import consent from './consent'

// Политика требует хранить подтверждение согласия: дату и время, версию текста,
// сведения о форме и факт установки отметки. Фронтенд эти сведения формирует,
// сохраняет их бэкенд.
export function buildConsentRecord({ termsAccepted, dataAccepted }) {
  return {
    acceptedAt: new Date().toISOString(),
    // только путь, без query — данные формы в URL не попадают
    page: window.location.pathname,
    form: 'footer-feedback',
    terms: {
      accepted: termsAccepted,
      version: terms.version || null,
      url: `/legal/${terms.slug}`,
    },
    dataProcessing: {
      accepted: dataAccepted,
      version: consent.version || null,
      url: `/legal/${consent.slug}`,
    },
    privacyPolicy: {
      version: privacyPolicy.version || null,
      url: `/legal/${privacyPolicy.slug}`,
    },
  }
}
