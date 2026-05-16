import { Link } from 'react-router-dom'
import styles from './CtaSection.module.css'

export default function CtaSection({
  title = 'Готовы к путешествию?',
  text = 'Откройте для себя красоту Карачаево-Черкесии. Выберите маршрут и отправляйтесь в незабываемое приключение!',
  primaryButtonText = 'Выбрать маршрут',
  primaryButtonLink = '/routes',
  secondaryButtonText,
  secondaryButtonLink = '/services',
}) {
  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaOverlay} />
      <div className={styles.ctaContent}>
        <h2 className={styles.ctaTitle}>{title}</h2>
        <p className={styles.ctaText}>{text}</p>
        <div className={styles.ctaButtons}>
          <Link to={primaryButtonLink} className={styles.ctaButtonPrimary}>
            {primaryButtonText}
          </Link>
          {secondaryButtonText && (
            <Link to={secondaryButtonLink} className={styles.ctaButtonSecondary}>
              {secondaryButtonText}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
