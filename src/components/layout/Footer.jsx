

import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CenterBlock from '../CenterBlock/CenterBlock'
import { publicFooterAPI, feedbackAPI, getImageUrl } from '@/lib/api'
import AppImage from '@/components/ui/AppImage'
import { resolveLink } from '@/app/admin/components/LinkSelector/LinkSelector'
import { LEGAL_PATHS } from '@/lib/legal'
import { buildConsentRecord } from '@/lib/legal/consentRecord'
import { useCookieConsent } from '@/contexts/CookieConsentContext'
import styles from './Footer.module.css'

const EMPTY_CONTENT = {
  left: { logo: '', social: [], phone: '', address: '' },
  center: { title: '', links: [] },
  right: { title: '', formPlaceholderName: '', formPlaceholderEmail: '', formPlaceholderText: '', formButtonText: '', formRecipientEmail: '' },
  bottom: { orgName: '', links: [], partners: [] },
}

export default function Footer() {
  const navigate = useNavigate()
  const { openSettings } = useCookieConsent()
  const [content, setContent] = useState(EMPTY_CONTENT)

  const fetchFooter = useCallback(() => {
    publicFooterAPI.get()
      .then((res) => {
        const data = res?.data
        const apiContent = (data && typeof data === 'object' && !Array.isArray(data))
          ? data
          : (data?.content && typeof data.content === 'object')
            ? data.content
            : null
        if (apiContent) {
          setContent({
            left: apiContent.left || EMPTY_CONTENT.left,
            center: apiContent.center || EMPTY_CONTENT.center,
            right: apiContent.right || EMPTY_CONTENT.right,
            bottom: apiContent.bottom || EMPTY_CONTENT.bottom,
          })
        }
      })
      .catch((err) => {
        console.error('Ошибка загрузки футера:', err?.message || err)
      })
  }, [])

  useEffect(() => {
    fetchFooter()
    document.addEventListener('visibilitychange', fetchFooter)
    return () => document.removeEventListener('visibilitychange', fetchFooter)
  }, [fetchFooter])

  const left = content.left || EMPTY_CONTENT.left
  const center = content.center || EMPTY_CONTENT.center
  const right = content.right || EMPTY_CONTENT.right
  const bottom = content.bottom || EMPTY_CONTENT.bottom

  const phoneHref = (left.phone || '').replace(/\D/g, '')

  const [feedback, setFeedback] = useState({ name: '', email: '', text: '' })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [dataAccepted, setDataAccepted] = useState(false)
  const [feedbackStatus, setFeedbackStatus] = useState(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const [feedbackError, setFeedbackError] = useState('')

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    if (!right.formRecipientEmail?.trim()) {
      setFeedbackError('Почта для получения не настроена')
      return
    }
    // Дублирует нативный required: без обеих отметок отправка невозможна
    if (!termsAccepted || !dataAccepted) {
      setFeedbackStatus('error')
      setFeedbackError('Отметьте согласие с соглашением и обработкой персональных данных')
      return
    }
    setFeedbackLoading(true)
    setFeedbackStatus(null)
    setFeedbackError('')
    try {
      await feedbackAPI.send({
        name: feedback.name.trim(),
        email: feedback.email.trim(),
        text: feedback.text.trim(),
        consent: buildConsentRecord({ termsAccepted, dataAccepted }),
      })
      setFeedback({ name: '', email: '', text: '' })
      setTermsAccepted(false)
      setDataAccepted(false)
      setFeedbackStatus('success')
    } catch (err) {
      setFeedbackStatus('error')
      setFeedbackError(err.response?.data?.message || 'Ошибка отправки')
    } finally {
      setFeedbackLoading(false)
    }
  }

  return (
    <footer className={styles.footer}>
      <CenterBlock>
        <div className={styles.footerTop}>
          <div className={styles.column}>
            <div className={styles.img}><AppImage src={left.logo} alt="Путешествуй КЧР" /></div>
            <div className={styles.social}>
              {(left.social || []).map((s, i) => (
                <Link key={i} to={s.url || '#'} target="_blank" rel="noopener noreferrer" className={styles.imgBlock}>
                  <AppImage src={s.icon} alt={s.name || s.title || 'Соцсеть'} />
                </Link>
              ))}
            </div>
            <Link to={phoneHref ? `tel:${phoneHref}` : '#'} className={styles.phone}>{left.phone}</Link>
            <div className={styles.text} dangerouslySetInnerHTML={{ __html: (left.address || '').replace(/\n/g, '<br />') }} />
          </div>

          <div className={styles.column}>
            <div className={styles.textTitle}>{center.title}</div>
            {(center.links || []).map((link, i) => {
              const { text, url, isFile } = resolveLink(link)
              const isFileLink = isFile || (url && url.startsWith('/uploads/'))
              const fileUrl = isFileLink && url ? getImageUrl(url) : url
              return isFileLink ? (
                <a key={i} href={fileUrl || '#'} target="_blank" rel="noopener noreferrer" className={`${styles.text} ${styles.linkText}`}>{text}</a>
              ) : (
                <Link key={i} to={url || '#'} className={`${styles.text} ${styles.linkText}`}>{text}</Link>
              )
            })}
            <Link to="/gallery" className={`${styles.text} ${styles.linkText}`}>Фотогалерея региона</Link>
            <button onClick={() => navigate('/', { state: { emergencySection: 'medhelp' } })} className={`${styles.emergencyBtn} ${styles.text} ${styles.linkText}`}>Пункты медпомощи</button>
            <button onClick={() => navigate('/', { state: { emergencySection: 'mvd' } })} className={`${styles.emergencyBtn} ${styles.text} ${styles.linkText}`}>МВД</button>
            <button onClick={() => navigate('/', { state: { emergencySection: 'fire' } })} className={`${styles.emergencyBtn} ${styles.text} ${styles.linkText}`}>МЧС</button>
          </div>

          <div className={styles.column}>
            <div className={styles.textTitle}>{right.title}</div>
            {right.formRecipientEmail ? (
              <form onSubmit={handleFeedbackSubmit} method="post">
                <input
                  type="text"
                  aria-label={right.formPlaceholderName || 'Имя'}
                  placeholder={right.formPlaceholderName}
                  value={feedback.name}
                  onChange={(e) => setFeedback((p) => ({ ...p, name: e.target.value }))}
                  required
                />
                <input
                  type="email"
                  aria-label={right.formPlaceholderEmail || 'Электронная почта'}
                  placeholder={right.formPlaceholderEmail}
                  value={feedback.email}
                  onChange={(e) => setFeedback((p) => ({ ...p, email: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  aria-label={right.formPlaceholderText || 'Сообщение'}
                  placeholder={right.formPlaceholderText}
                  value={feedback.text}
                  onChange={(e) => setFeedback((p) => ({ ...p, text: e.target.value }))}
                  required
                />
                <div className={styles.consents}>
                  <label className={styles.consent} htmlFor="footer-consent-terms">
                    <input
                      id="footer-consent-terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      required
                    />
                    <span>
                      Согласен с{' '}
                      <a href={LEGAL_PATHS.terms} target="_blank" rel="noopener noreferrer">
                        «Соглашением пользования сайтом»
                      </a>
                    </span>
                  </label>

                  <p className={styles.policyNote}>
                    Перед отправкой ознакомьтесь с{' '}
                    <a href={LEGAL_PATHS.privacyPolicy} target="_blank" rel="noopener noreferrer">
                      «Политикой в отношении обработки персональных данных»
                    </a>
                  </p>

                  <label className={styles.consent} htmlFor="footer-consent-data">
                    <input
                      id="footer-consent-data"
                      type="checkbox"
                      checked={dataAccepted}
                      onChange={(e) => setDataAccepted(e.target.checked)}
                      required
                    />
                    <span>
                      Даю{' '}
                      <a href={LEGAL_PATHS.consent} target="_blank" rel="noopener noreferrer">
                        «Согласие на обработку персональных данных»
                      </a>
                    </span>
                  </label>
                </div>

                <button type="submit" disabled={feedbackLoading}>
                  {feedbackLoading ? 'Отправка...' : right.formButtonText}
                </button>
                {feedbackStatus === 'success' && <p className={styles.feedbackSuccess}>Сообщение отправлено</p>}
                {feedbackStatus === 'error' && <p className={styles.feedbackError}>{feedbackError}</p>}
              </form>
            ) : (
              <p className={styles.feedbackHint}>Укажите почту для получения сообщений в админке футера</p>
            )}
          </div>
        </div>
      </CenterBlock>

      <div className={styles.line}></div>

      <CenterBlock>
        <div className={styles.orgInfo}>
          <div className={styles.infoCol}>
            <div className={styles.name}>{bottom.orgName}</div>
            <div className={styles.links}>
              {(bottom.links || []).map((link, i) => {
                const { text, url, isFile } = resolveLink(link)
                const isFileLink = isFile || (url && url.startsWith('/uploads/'))
                const fileUrl = isFileLink && url ? getImageUrl(url) : url
                return isFileLink ? (
                  <a key={i} href={fileUrl || '#'} target="_blank" rel="noopener noreferrer" className={styles.linkText}>{text}</a>
                ) : (
                  <Link key={i} to={url || '#'} className={styles.linkText}>{text}</Link>
                )
              })}
              <button type="button" onClick={openSettings} className={`${styles.linkText} ${styles.cookieSettingsBtn}`}>
                Настройки cookie
              </button>
            </div>
          </div>
          <div className={styles.partners}>
            {(bottom.partners || []).map((p, i) => {
              const { url } = resolveLink(p)
              return (
                <Link key={i} to={url || '#'} target="_blank" rel="noopener noreferrer">
                  <AppImage src={p.image} alt={p.name || p.title || 'Партнёр'} />
                </Link>
              )
            })}
          </div>
        </div>
      </CenterBlock>
    </footer>
  )
}
