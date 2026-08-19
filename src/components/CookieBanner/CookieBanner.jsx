import { useCookieConsent } from '@/contexts/CookieConsentContext'
import { LEGAL_PATHS } from '@/lib/legal'
import CookieSettingsModal from './CookieSettingsModal'
import styles from './CookieBanner.module.css'

export default function CookieBanner() {
  const { isDecided, isSettingsOpen, acceptAll, rejectOptional, openSettings } = useCookieConsent()

  return (
    <>
      {!isDecided && !isSettingsOpen && (
        <div className={styles.banner} role="dialog" aria-label="Использование файлов cookie">
          <p className={styles.text}>
            Мы используем необходимые cookie для работы и безопасности сайта. С вашего согласия мы
            также можем включить онлайн-чат и переводчик, которые передают технические данные внешним
            поставщикам. Вы можете принять все, отклонить необязательные или настроить выбор.
          </p>

          <div className={styles.links}>
            <a href={LEGAL_PATHS.cookiePolicy} target="_blank" rel="noopener noreferrer" className={styles.link}>
              Политика cookie
            </a>
            <a href={LEGAL_PATHS.privacyPolicy} target="_blank" rel="noopener noreferrer" className={styles.link}>
              Политика обработки персональных данных
            </a>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.btn} onClick={acceptAll}>
              Принять все
            </button>
            <button type="button" className={styles.btn} onClick={rejectOptional}>
              Отклонить необязательные
            </button>
            <button type="button" className={styles.btnGhost} onClick={openSettings}>
              Настроить
            </button>
          </div>
        </div>
      )}

      <CookieSettingsModal />
    </>
  )
}
