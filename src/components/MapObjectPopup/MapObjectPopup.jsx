import AppImage from '@/components/ui/AppImage'
import styles from './MapObjectPopup.module.css'

/**
 * Карточка объекта поверх карты.
 * @param {object} object — точка карты: title, location, image
 * @param {string} actionLabel — подпись кнопки перехода
 * @param {function} onAction — переход к объекту
 * @param {function} onClose — закрыть попап
 */
export default function MapObjectPopup({ object, actionLabel = 'Подробнее', onAction, onClose }) {
  if (!object) return null

  return (
    <div className={styles.popup}>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">×</button>

      {object.image && (
        <div className={styles.image}>
          <AppImage src={object.image} alt="" />
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.title}>{object.title}</div>
        {object.location && (
          <div className={styles.location}>
            <img src="/place_black.png" alt="" />
            {object.location}
          </div>
        )}
        <button type="button" className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
