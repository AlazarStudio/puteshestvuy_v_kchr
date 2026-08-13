import { useEffect, useState } from 'react'
import { publicRoutesAPI, publicPlacesAPI, publicServicesAPI } from '@/lib/api'

const EMPTY = {
  wantedRoutes: [],
  wantedPlaces: [],
  services: [],
  visitedRoutes: [],
  visitedPlaces: [],
}

// Сущности грузятся поштучно, по одному запросу на идентификатор: пакетной
// выдачи в API нет, а профиль хранит только массивы id
const loadByIds = (ids, fetchOne) =>
  Promise.all(
    (ids || []).map((id) => fetchOne(id).then((r) => r.data).catch(() => null))
  ).then((items) => items.filter(Boolean))

// Флаги в базе независимы: объект может быть и в избранном, и в посещённом.
// Группы кабинета при этом обязаны не пересекаться, иначе одна карточка
// лежит в двух вкладках сразу, а счётчики групп в сумме врут. Факт сильнее
// намерения, поэтому посещённое побеждает и вычитается из «хочу».
const excludeVisited = (favorites, visited) => {
  const visitedIds = new Set(visited.map((item) => item.id))
  return favorites.filter((item) => !visitedIds.has(item.id))
}

export function useProfileLists(user) {
  const [lists, setLists] = useState(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLists(EMPTY)
      setLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [routes, places, services, visitedRoutes, visitedPlaces] = await Promise.all([
          loadByIds(user.favoriteRouteIds, publicRoutesAPI.getByIdOrSlug),
          loadByIds(user.favoritePlaceIds, publicPlacesAPI.getByIdOrSlug),
          loadByIds(user.favoriteServiceIds, publicServicesAPI.getByIdOrSlug),
          loadByIds(user.visitedRouteIds, publicRoutesAPI.getByIdOrSlug),
          loadByIds(user.visitedPlaceIds, publicPlacesAPI.getByIdOrSlug),
        ])
        if (!cancelled) {
          setLists({
            wantedRoutes: excludeVisited(routes, visitedRoutes),
            wantedPlaces: excludeVisited(places, visitedPlaces),
            services,
            visitedRoutes,
            visitedPlaces,
          })
        }
      } catch {
        if (!cancelled) setLists(EMPTY)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [
    user?.id,
    user?.favoriteRouteIds,
    user?.favoritePlaceIds,
    user?.favoriteServiceIds,
    user?.visitedRouteIds,
    user?.visitedPlaceIds,
  ])

  return { ...lists, loading }
}
