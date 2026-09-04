import FavoriteButton from '@/components/FavoriteButton/FavoriteButton'
import VisitedButton from '@/components/VisitedButton/VisitedButton'
import RouteConstructorButton from '@/components/RouteConstructorButton/RouteConstructorButton'
import AppImage from '@/components/ui/AppImage'
import styles from './MapObjectPopup.module.css'

/**
 * Карточка объекта поверх карты.
 * @param {object} object — точка карты: title, location, image
 * @param {string} entityType — 'place' | 'service', определяет набор действий
 * @param {number|string} entityId — id объекта для кнопок действий
 * @param {object} place — объект места целиком, нужен конструктору маршрута
 * @param {string} actionLabel — подпись кнопки перехода
 * @param {function} onAction — переход к объекту
 * @param {function} onClose — закрыть попап
 */
export default function MapObjectPopup({ object, entityType, entityId, place, actionLabel = 'Подробнее', onAction, onClose }) {
  if (!object) return null

  return (
    <div className={styles.popup}>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">×</button>

      {/* Фотография и заголовок — одна кликабельная зона: она ведёт на страницу
          объекта, кнопки действий ниже гасят всплытие и никуда не уводят */}
      <div
        className={styles.link}
        role="link"
        tabIndex={0}
        onClick={onAction}
        onKeyDown={(e) => { if (e.key === 'Enter') onAction?.() }}
      >
        {object.image && (
          <div className={styles.image}>
            <AppImage src={object.image} alt={object.title || ''} />
          </div>
        )}
        <div className={styles.titleRow}>
          <div className={styles.title}>{object.title}</div>
          {object.location && (
            <div className={styles.location}>
              <img src="/place_black.png" alt="" />
              {object.location}
            </div>
          )}
        </div>
      </div>

      <div className={styles.body}>
        {entityId && (
          <div className={styles.actions}>
            {entityType === 'place' && <RouteConstructorButton placeId={entityId} place={place} />}
            <FavoriteButton entityType={entityType} entityId={entityId} />
            {entityType === 'place' && <VisitedButton entityType="place" entityId={entityId} />}
          </div>
        )}
        <button type="button" className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
