import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { publicPlacesAPI } from '@/lib/api'
import styles from './RandomPlaceBlock.module.css'

/**
 * Кнопка «случайное место» на странице мест.
 * Условиями служат фильтры и поиск самой страницы — своих селектов блок не заводит.
 * @param {object} filters — текущие фильтры страницы: { directions: [], seasons: [], ... }
 * @param {string} search — поисковый запрос, которым страница сузила выдачу
 * @param {number} total — сколько мест страница нашла по этим же условиям
 */
export default function RandomPlaceBlock({ filters, search = '', total = 0 }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [lastId, setLastId] = useState(null)

  // Уходят все непустые группы фильтров, а не перечисленные поимённо: группу,
  // заведённую редактором в админке, блок подхватит без правок кода — как и список
  const params = useMemo(() => {
    const next = {}
    for (const [key, values] of Object.entries(filters || {})) {
      if (Array.isArray(values) && values.length) next[key] = values
    }
    if (search) next.search = search
    return next
  }, [filters, search])

  const hasConditions = Object.keys(params).length > 0
  const isEmpty = hasConditions && total === 0

  // Условия изменились — прежняя жалоба на пустую выборку больше не актуальна
  const conditions = JSON.stringify(params)
  useEffect(() => {
    setMessage('')
  }, [conditions])

  const roll = async () => {
    setLoading(true)
    setMessage('')
    try {
      // Предыдущее место исключается, чтобы кнопка не выглядела сломанной
      // на узких выборках: у «Медовых водопадов» всего четыре места
      const { data } = await publicPlacesAPI.getRandom(lastId ? { ...params, exclude: lastId } : params)
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
      <div className={styles.text}>
        {!hasConditions && 'Не знаете, куда поехать — пусть решит случай'}
        {isEmpty && 'Под текущие фильтры не подошло ни одного места'}
        {hasConditions && !isEmpty && (
          <>
            Выберем случайное из <span className={styles.count}>{total}</span>{' '}
            {total === 1 ? 'подходящего' : 'подходящих'}
          </>
        )}
      </div>
      <button
        type="button"
        className={styles.button}
        onClick={roll}
        disabled={loading || total === 0}
      >
        {loading ? 'Ищем…' : 'Показать случайное место'}
      </button>
      {message && <div className={styles.message}>{message}</div>}
    </div>
  )
}
