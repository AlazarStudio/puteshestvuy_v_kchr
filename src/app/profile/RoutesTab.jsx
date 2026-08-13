import { useState } from 'react'
import { Link } from 'react-router-dom'
import RouteBlock from '@/components/RouteBlock/RouteBlock'
import styles from './profile.module.css'

export default function RoutesTab({ wantedRoutes, visitedRoutes, loading }) {
  const [group, setGroup] = useState('wanted')

  const items = group === 'visited' ? visitedRoutes : wantedRoutes

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Маршруты</h2>
      <div className={styles.editTabs}>
        <button
          type="button"
          className={`${styles.editTab} ${group === 'wanted' ? styles.editTabActive : ''}`}
          onClick={() => setGroup('wanted')}
        >
          Хочу пройти ({wantedRoutes.length})
        </button>
        <button
          type="button"
          className={`${styles.editTab} ${group === 'visited' ? styles.editTabActive : ''}`}
          onClick={() => setGroup('visited')}
        >
          Уже прошёл ({visitedRoutes.length})
        </button>
      </div>
      {loading ? (
        <p className={styles.favLoading}>Загрузка...</p>
      ) : items.length === 0 ? (
        group === 'visited' ? (
          <p className={styles.empty}>
            Вы ещё не отмечали пройденные маршруты. Отметьте их галочкой на карточке маршрута.
          </p>
        ) : (
          <p className={styles.empty}>
            Нет избранных маршрутов. <Link to="/routes">Добавить маршруты</Link>
          </p>
        )
      ) : (
        <div className={styles.routesList}>
          {items.map((route) => (
            <div key={route.id} className={styles.routeCardWrap}>
              <RouteBlock route={route} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
