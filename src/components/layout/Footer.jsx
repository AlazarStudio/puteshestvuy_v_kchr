'use client'

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import CenterBlock from '../CenterBlock/CenterBlock'
import { publicFooterAPI, feedbackAPI, getImageUrl } from '@/lib/api'
import { resolveLink } from '@/app/admin/components/LinkSelector/LinkSelector'
import styles from './Footer.module.css'

const EMPTY_CONTENT = {
  left: { logo: '', social: [], phone: '', address: '' },
  center: { title: '', links: [] },
  right: { title: '', formPlaceholderName: '', formPlaceholderEmail: '', formPlaceholderText: '', formButtonText: '', formRecipientEmail: '' },
  bottom: { orgName: '', links: [], partners: [] },
}

export default function Footer() {
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
  const [feedbackStatus, setFeedbackStatus] = useState(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const [feedbackError, setFeedbackError] = useState('')

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    if (!right.formRecipientEmail?.trim()) {
      setFeedbackError('Почта для получения не настроена')
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
      })
      setFeedback({ name: '', email: '', text: '' })
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
            <div className={styles.img}><img src={getImageUrl(left.logo)} alt="" /></div>
            <div className={styles.social}>
              {(left.social || []).map((s, i) => (
                <Link key={i} to={s.url || '#'} target="_blank" rel="noopener noreferrer" className={styles.imgBlock}>
                  <img src={getImageUrl(s.icon)} alt="" />
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
          </div>

          <div className={styles.column}>
            <div className={styles.textTitle}>{right.title}</div>
            {right.formRecipientEmail ? (
              <form onSubmit={handleFeedbackSubmit}>
                <input
                  type="text"
                  placeholder={right.formPlaceholderName}
                  value={feedback.name}
                  onChange={(e) => setFeedback((p) => ({ ...p, name: e.target.value }))}
                  required
                />
                <input
                  type="email"
                  placeholder={right.formPlaceholderEmail}
                  value={feedback.email}
                  onChange={(e) => setFeedback((p) => ({ ...p, email: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder={right.formPlaceholderText}
                  value={feedback.text}
                  onChange={(e) => setFeedback((p) => ({ ...p, text: e.target.value }))}
                  required
                />
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
            </div>
          </div>
          <div className={styles.partners}>
            {(bottom.partners || []).map((p, i) => {
              const { url } = resolveLink(p)
              return (
                <Link key={i} to={url || '#'} target="_blank" rel="noopener noreferrer">
                  <img src={getImageUrl(p.image)} alt="" />
                </Link>
              )
            })}
          </div>
        </div>
      </CenterBlock>
    </footer>
  )
}
