import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { publicPlacesAPI } from '@/lib/api'
import styles from './RandomPlaceBlock.module.css'

/**
 * Кнопка «случайное место» на странице мест.
 * Условиями служат фильтры самой страницы — своих селектов блок не заводит.
 * @param {object} filters — текущие фильтры страницы: { directions: [], seasons: [], ... }
 */
export default function RandomPlaceBlock({ filters }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [lastId, setLastId] = useState(null)

  // Условия запроса — только направление и сезон. Строка из их значений
  // не меняется на перерисовках страницы, поэтому сообщение держится,
  // пока пользователь действительно не тронул фильтры
  const conditions = [
    (filters?.directions || []).join(','),
    (filters?.seasons || []).join(','),
  ].join('|')

  // Фильтры изменились — прежняя жалоба на пустую выборку больше не актуальна
  useEffect(() => {
    setMessage('')
  }, [conditions])

  const roll = async () => {
    setLoading(true)
    setMessage('')
    try {
      const params = {}
      if (filters?.directions?.length) params.directions = filters.directions
      if (filters?.seasons?.length) params.seasons = filters.seasons
      // Предыдущее место исключается, чтобы кнопка не выглядела сломанной
      // на узких выборках: у «Медовых водопадов» всего четыре места
      if (lastId) params.exclude = lastId

      const { data } = await publicPlacesAPI.getRandom(params)
      setLastId(data.id)
      navigate(`/places/${data.slug}`)
    } catch (e) {
      setMessage(
        e?.response?.status === 404
          ? 'Под текущие фильтры не подошло ни одного места. Попробуйте убрать один из них.'
          : 'Не удалось выбрать место. Попробуйте ещё раз.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.block}>
      <div className={styles.text}>Не знаете, куда поехать — пусть решит случай</div>
      <button type="button" className={styles.button} onClick={roll} disabled={loading}>
        {loading ? 'Ищем…' : 'Показать случайное место'}
      </button>
      {message && <div className={styles.message}>{message}</div>}
    </div>
  )
}
