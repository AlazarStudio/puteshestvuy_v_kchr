import FavoriteButton from '@/components/FavoriteButton/FavoriteButton'
import VisitedButton from '@/components/VisitedButton/VisitedButton'
import RouteConstructorButton from '@/components/RouteConstructorButton/RouteConstructorButton'
import AppImage from '@/components/ui/AppImage'
import styles from './MapObjectPopup.module.css'

/**
 * Карточка объекта у метки на карте. Кликабельна целиком — ведёт на страницу
 * объекта; кнопки действий гасят всплытие и никуда не уводят.
 * @param {object} object — точка карты: title, location, image
 * @param {string} entityType — 'place' | 'service', определяет набор действий
 * @param {number|string} entityId — id объекта для кнопок действий
 * @param {object} place — объект места целиком, нужен конструктору маршрута
 * @param {string} placement — 'above' | 'below': с какой стороны метки стоит карточка
 * @param {function} onOpen — переход к объекту
 * @param {function} onMouseEnter — курсор перешёл на попап
 * @param {function} onMouseLeave — курсор ушёл с попапа
 */
export default function MapObjectPopup({ object, entityType, entityId, place, placement = 'above', onOpen, onMouseEnter, onMouseLeave }) {
  if (!object) return null

  return (
    <div
      className={`${styles.popup} ${placement === 'below' ? styles.popupBelow : ''}`}
      role="link"
      tabIndex={0}
      aria-label={`Открыть: ${object.title}`}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen?.() }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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

      {entityId && (
        <div className={styles.actions}>
          <div className={styles.actionsLeft}>
            {entityType === 'place' && <VisitedButton entityType="place" entityId={entityId} />}
          </div>
          <div className={styles.actionsRight}>
            <FavoriteButton entityType={entityType} entityId={entityId} />
            {entityType === 'place' && <RouteConstructorButton placeId={entityId} place={place} />}
          </div>
        </div>
      )}
    </div>
  )
}
