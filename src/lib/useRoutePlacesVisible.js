import { useEffect, useState } from 'react'
import { publicRoutesAPI } from './api'

// null — ещё не загружено; загруженное значение всегда boolean (в т.ч. false)
let cachedValue = null
let inFlight = null

function loadValue() {
  if (cachedValue !== null) return Promise.resolve(cachedValue)
  if (!inFlight) {
    inFlight = publicRoutesAPI
      .getFilters()
      .then(({ data }) => {
        cachedValue = data?.showPlacesOnCard !== false
        return cachedValue
      })
      .catch(() => {
        // Не кэшируем неуспех: следующее монтирование попробует снова.
        // Пока не ответили — ведём себя как раньше, показываем блок.
        return true
      })
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}

/**
 * Глобальная настройка: показывать ли блок точек на карточке маршрута.
 * Запрос уходит один раз на всё приложение — промис кэшируется на уровне модуля.
 * @returns {boolean|null} null — ещё не загружено, иначе значение флага
 */
export function useRoutePlacesVisible() {
  const [visible, setVisible] = useState(cachedValue)

  useEffect(() => {
    let cancelled = false
    loadValue().then((v) => {
      if (!cancelled) setVisible(v)
    })
    return () => { cancelled = true }
  }, [])

  return visible
}
