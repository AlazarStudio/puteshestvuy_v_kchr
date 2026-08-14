

import { formatReviews } from '@/utils/rating';
import styles from '../../admin.module.css';

/**
 * Блок «Рейтинг» редакторов места, маршрута и услуги: переключатель источника,
 * поле ручного значения и строка состояния по отзывам.
 * onChange получает частичный патч формы — { ratingSource } и/или { manualRating }.
 */
export default function RatingField({ source, manualRating, reviewsRating, reviewsCount = 0, onChange }) {
  const isManual = source === 'manual';
  const isEmpty = manualRating === '' || manualRating == null;

  // Переход в ручной режим с пустым полем иначе молча обнулил бы действующий рейтинг при сохранении
  const selectManual = () => onChange(
    isEmpty && reviewsRating != null
      ? { ratingSource: 'manual', manualRating: String(reviewsRating) }
      : { ratingSource: 'manual' }
  );

  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>Рейтинг</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="radio"
            name="ratingSource"
            value="reviews"
            checked={!isManual}
            onChange={() => onChange({ ratingSource: 'reviews' })}
          />
          По отзывам
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="radio"
            name="ratingSource"
            value="manual"
            checked={isManual}
            onChange={selectManual}
          />
          Вручную
        </label>
        <input
          type="number"
          name="manualRating"
          min="0"
          max="5"
          step="0.1"
          value={manualRating ?? ''}
          onChange={(e) => onChange({ manualRating: e.target.value })}
          disabled={!isManual}
          className={styles.formInput}
          placeholder="от 0 до 5, например 4.8"
          style={{ maxWidth: 220 }}
        />
      </div>
      <div style={{ marginTop: 6, fontSize: '0.85rem', color: '#64748b' }}>
        {reviewsRating != null
          ? `По отзывам: ${reviewsRating}, ${formatReviews(reviewsCount)}`
          : 'Отзывов пока нет'}
      </div>
    </div>
  );
}
