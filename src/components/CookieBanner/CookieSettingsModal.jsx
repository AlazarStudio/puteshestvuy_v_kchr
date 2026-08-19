import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCookieConsent, OPTIONAL_SERVICES } from '@/contexts/CookieConsentContext'
import { LEGAL_PATHS } from '@/lib/legal'
import styles from './CookieSettingsModal.module.css'

export default function CookieSettingsModal() {
  const { isSettingsOpen, closeSettings, services, save, acceptAll, rejectOptional } = useCookieConsent()
  const [draft, setDraft] = useState(services)

  useEffect(() => {
    if (isSettingsOpen) setDraft(services)
  }, [isSettingsOpen, services])

  useEffect(() => {
    if (!isSettingsOpen) return
    const onKeyDown = (e) => { if (e.key === 'Escape') closeSettings() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isSettingsOpen, closeSettings])

  if (!isSettingsOpen) return null

  const toggle = (id) => setDraft((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className={styles.overlay} onClick={closeSettings}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="cookie-settings-title" className={styles.title}>Настройки cookie</h2>
          <button type="button" className={styles.close} onClick={closeSettings} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.group}>
            <div className={styles.groupHead}>
              <span className={styles.groupTitle}>Необходимые cookie</span>
              <span className={styles.always}>Всегда включены</span>
            </div>
            <p className={styles.groupText}>
              Поддержание сеанса, безопасность, предотвращение злоупотреблений и сохранение выбранных
              технических настроек. Сессионные удаляются после завершения сеанса, постоянные хранятся
              не более 12 месяцев.
            </p>
          </div>

          {OPTIONAL_SERVICES.map((service) => (
            <div key={service.id} className={styles.group}>
              <div className={styles.groupHead}>
                <span className={styles.groupTitle}>{service.title}</span>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={Boolean(draft[service.id])}
                    onChange={() => toggle(service.id)}
                  />
                  <span className={styles.slider} />
                </label>
              </div>
              <p className={styles.groupText}>{service.description}</p>
            </div>
          ))}

          <p className={styles.note}>
            Отказ от необязательных сервисов не ограничивает доступ к материалам сайта. Подробнее —{' '}
            <a href={LEGAL_PATHS.cookiePolicy} target="_blank" rel="noopener noreferrer">
              Политика cookie
            </a>{' '}
            и{' '}
            <a href={LEGAL_PATHS.privacyPolicy} target="_blank" rel="noopener noreferrer">
              Политика обработки персональных данных
            </a>
            .
          </p>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.btn} onClick={acceptAll}>Принять все</button>
          <button type="button" className={styles.btn} onClick={rejectOptional}>Отклонить необязательные</button>
          <button type="button" className={styles.btnGhost} onClick={() => save(draft)}>Сохранить выбор</button>
        </div>
      </div>
    </div>
  )
}
