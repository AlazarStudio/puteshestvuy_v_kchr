import { LEGAL_PATHS } from '@/lib/legal'
import styles from './LegalConsentFields.module.css'

/**
 * Принятие Соглашения и согласие на обработку данных для регистрации.
 * Ознакомление с Политикой — отдельная ссылка без отметки: согласие
 * по статье 9 Закона № 152-ФЗ оформляется отдельно от иной информации.
 */
export default function LegalConsentFields({ terms, data, onTermsChange, onDataChange }) {
  return (
    <div className={styles.consents}>
      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => onTermsChange(e.target.checked)}
          required
        />
        <span>
          Принимаю{' '}
          <a href={LEGAL_PATHS.terms} target="_blank" rel="noopener noreferrer">
            «Пользовательское соглашение»
          </a>
        </span>
      </label>

      <p className={styles.policyNote}>
        Перед регистрацией ознакомьтесь с{' '}
        <a href={LEGAL_PATHS.privacyPolicy} target="_blank" rel="noopener noreferrer">
          «Политикой в отношении обработки персональных данных»
        </a>
      </p>

      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={data}
          onChange={(e) => onDataChange(e.target.checked)}
          required
        />
        <span>
          Даю{' '}
          <a href={LEGAL_PATHS.accountConsent} target="_blank" rel="noopener noreferrer">
            «Согласие на обработку персональных данных»
          </a>{' '}
          для регистрации и личного кабинета
        </span>
      </label>
    </div>
  )
}
