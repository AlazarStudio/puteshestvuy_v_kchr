import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getImageUrl } from '@/lib/api'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'
import { formatReviews } from '@/utils/rating'
import styles from './profile.module.css'

export default function PlacesTab({ wantedPlaces, visitedPlaces, loading }) {
  const navigate = useNavigate()
  const [group, setGroup] = useState('wanted')

  const items = group === 'visited' ? visitedPlaces : wantedPlaces

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Интересные места</h2>
      <div className={styles.editTabs}>
        <button
          type="button"
          className={`${styles.editTab} ${group === 'wanted' ? styles.editTabActive : ''}`}
          onClick={() => setGroup('wanted')}
        >
          Хочу посетить ({wantedPlaces.length})
        </button>
        <button
          type="button"
          className={`${styles.editTab} ${group === 'visited' ? styles.editTabActive : ''}`}
          onClick={() => setGroup('visited')}
        >
          Уже посетил ({visitedPlaces.length})
        </button>
      </div>
      {loading ? (
        <p className={styles.favLoading}>Загрузка...</p>
      ) : items.length === 0 ? (
        group === 'visited' ? (
          <p className={styles.empty}>
            Вы ещё не отмечали посещённые места. Отметьте их галочкой на карточке места.
          </p>
        ) : (
          <p className={styles.empty}>
            Нет избранных мест. <Link to="/places">Добавить места</Link>
          </p>
        )
      ) : (
        <div className={styles.placesGrid}>
          {items.map((place) => (
            <div key={place.id} className={styles.placeCardWrap}>
              <PlaceBlock
                placeId={place.id}
                img={getImageUrl(place.image || place.images?.[0]) || '/placeholder.jpg'}
                place={place.location || ''}
                slug={place.slug}
                title={place.title}
                desc={place.shortDescription || ''}
                rating={place.rating}
                feedback={formatReviews(place.reviewsCount)}
                reviewsCount={place.reviewsCount || 0}
                onClick={() => navigate(`/places/${place.slug}`)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
