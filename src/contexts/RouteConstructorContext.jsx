'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { publicPlacesAPI, userAPI } from '@/lib/api'

const RouteConstructorContext = createContext(null)

export function useRouteConstructor() {
  const ctx = useContext(RouteConstructorContext)
  if (!ctx) throw new Error('useRouteConstructor must be used within RouteConstructorProvider')
  return ctx
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function RouteConstructorProvider({ children }) {
  const { user } = useAuth()
  const [placeIds, setPlaceIds] = useState([])
  const [places, setPlaces] = useState([])
  const [startPlaceId, setStartPlaceIdState] = useState(null)
  const [endPlaceId, setEndPlaceIdState] = useState(null)
  const [placesLoading, setPlacesLoading] = useState(false)
  const [constructorLoading, setConstructorLoading] = useState(false)
  const saveTimeoutRef = useRef(null)

  const saveToBackend = useCallback((ids) => {
    if (!user) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      userAPI.updateConstructorPoints(ids).catch(() => {})
      saveTimeoutRef.current = null
    }, 300)
  }, [user])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setPlaceIds([])
      setPlaces([])
      return
    }
    setConstructorLoading(true)
    userAPI
      .getConstructorPoints()
      .then(({ data }) => {
        const ids = Array.isArray(data?.placeIds) ? data.placeIds : []
        setPlaceIds(ids)
      })
      .catch(() => setPlaceIds([]))
      .finally(() => setConstructorLoading(false))
  }, [user?.id])

  useEffect(() => {
    if (placeIds.length === 0) {
      setPlaces([])
      return
    }
    let cancelled = false
    setPlacesLoading(true)
    Promise.all(
      placeIds.map((id) =>
        publicPlacesAPI.getByIdOrSlug(id).then((r) => r.data).catch(() => null)
      )
    )
      .then((items) => {
        if (cancelled) return
        const ordered = placeIds
          .map((id) => items.find((p) => p && p.id === id))
          .filter(Boolean)
        setPlaces(ordered)
      })
      .catch(() => {
        if (!cancelled) setPlaces([])
      })
      .finally(() => {
        if (!cancelled) setPlacesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [placeIds.join(',')])

  const addPlace = useCallback(
    (place) => {
      if (!place?.id) return
      setPlaceIds((prev) => {
        if (prev.includes(place.id)) return prev
        const next = [...prev, place.id]
        saveToBackend(next)
        return next
      })
    },
    [saveToBackend]
  )

  const removePlace = useCallback(
    (placeId) => {
      setStartPlaceIdState((prev) => (prev === placeId ? null : prev))
      setEndPlaceIdState((prev) => (prev === placeId ? null : prev))
      setPlaceIds((prev) => {
        const next = prev.filter((id) => id !== placeId)
        saveToBackend(next)
        return next
      })
    },
    [saveToBackend]
  )

  const setStartPlace = useCallback(
    (placeId) => {
      if (!placeId) {
        setStartPlaceIdState(null)
        return
      }
      setEndPlaceIdState((prev) => (prev === placeId ? null : prev))
      setStartPlaceIdState(placeId)
      setPlaceIds((prev) => {
        const i = prev.indexOf(placeId)
        if (i <= 0) return prev
        const next = [...prev]
        next.splice(i, 1)
        next.unshift(placeId)
        saveToBackend(next)
        return next
      })
    },
    [saveToBackend]
  )

  const setEndPlace = useCallback(
    (placeId) => {
      if (!placeId) {
        setEndPlaceIdState(null)
        return
      }
      setStartPlaceIdState((prev) => (prev === placeId ? null : prev))
      setEndPlaceIdState(placeId)
      setPlaceIds((prev) => {
        const i = prev.indexOf(placeId)
        if (i < 0 || i === prev.length - 1) return prev
        const next = [...prev]
        next.splice(i, 1)
        next.push(placeId)
        saveToBackend(next)
        return next
      })
    },
    [saveToBackend]
  )

  const movePlace = useCallback(
    (fromIndex, direction) => {
      setPlaceIds((prev) => {
        const fromId = prev[fromIndex]
        if (fromId === startPlaceId || fromId === endPlaceId) return prev
        const toIndex = fromIndex + direction
        if (toIndex < 0 || toIndex >= prev.length) return prev
        const toId = prev[toIndex]
        if (toId === startPlaceId || toId === endPlaceId) return prev
        const next = [...prev]
        ;[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]]
        saveToBackend(next)
        return next
      })
    },
    [saveToBackend, startPlaceId, endPlaceId]
  )

  const movePlaceByDrag = useCallback(
    (draggedIndex, targetIndex) => {
      if (draggedIndex === targetIndex) return
      setPlaceIds((prev) => {
        const fromId = prev[draggedIndex]
        const toId = prev[targetIndex]
        if (fromId === startPlaceId || fromId === endPlaceId) return prev
        if (toId === startPlaceId || toId === endPlaceId) return prev
        const next = [...prev]
        const [removed] = next.splice(draggedIndex, 1)
        next.splice(targetIndex, 0, removed)
        saveToBackend(next)
        return next
      })
    },
    [saveToBackend, startPlaceId, endPlaceId]
  )

  const reorderPlaceIds = useCallback(
    (newIds) => {
      if (!Array.isArray(newIds)) return
      setPlaceIds((prev) => {
        const valid = newIds.filter((id) => prev.includes(id))
        const missing = prev.filter((id) => !newIds.includes(id))
        const next = [...valid, ...missing]
        saveToBackend(next)
        return next
      })
    },
    [saveToBackend]
  )

  const clear = useCallback(() => {
    setPlaceIds([])
    setPlaces([])
    setStartPlaceIdState(null)
    setEndPlaceIdState(null)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    if (user) userAPI.updateConstructorPoints([]).catch(() => {})
  }, [user])

  const loadPlaceIds = useCallback(
    (ids) => {
      const next = Array.isArray(ids) ? ids.filter((id) => id) : []
      setPlaceIds(next)
      if (user && next.length > 0) saveToBackend(next)
    },
    [user, saveToBackend]
  )

  const optimizeRoute = useCallback(() => {
    const ids = placeIds
    if (ids.length < 2) return Promise.resolve(null)

    setPlacesLoading(true)
    return publicPlacesAPI
      .getAll({ limit: 500 })
      .then(({ data }) => {
        const allPlaces = data?.items || []
        const byId = Object.fromEntries(allPlaces.map((p) => [p.id, p]))

        const withCoords = []
        const withoutCoords = []

        ids.forEach((id) => {
          const p = byId[id] || places.find((x) => x.id === id)
          if (p && p.latitude != null && p.longitude != null && Number(p.latitude) && Number(p.longitude)) {
            withCoords.push({ id, lat: Number(p.latitude), lon: Number(p.longitude), title: p.title })
          } else {
            withoutCoords.push(id)
          }
        })

        if (withCoords.length < 2) return null

        const totalDistanceBefore = (() => {
          let sum = 0
          for (let i = 0; i < withCoords.length - 1; i++) {
            sum += haversineKm(withCoords[i].lat, withCoords[i].lon, withCoords[i + 1].lat, withCoords[i + 1].lon)
          }
          return sum
        })()

        let ordered
        let middle
        const startItem = startPlaceId ? withCoords.find((c) => c.id === startPlaceId) : null
        const endItem = endPlaceId ? withCoords.find((c) => c.id === endPlaceId) : null

        if (startItem && endItem && startItem.id !== endItem.id) {
          middle = withCoords.filter((c) => c.id !== startPlaceId && c.id !== endPlaceId)
          const orderedMiddle = middle.length > 0 ? [middle[0]] : []
          let remaining = middle.slice(1)
          let current = middle[0]
          while (remaining.length > 0) {
            let minDist = Infinity
            let minIdx = -1
            remaining.forEach((p, i) => {
              const d = haversineKm(current.lat, current.lon, p.lat, p.lon)
              if (d < minDist) {
                minDist = d
                minIdx = i
              }
            })
            if (minIdx >= 0) {
              const next = remaining[minIdx]
              orderedMiddle.push(next)
              current = next
              remaining.splice(minIdx, 1)
            }
          }
          ordered = [startItem, ...orderedMiddle, endItem]
        } else if (startItem) {
          middle = withCoords.filter((c) => c.id !== startPlaceId)
          const orderedMiddle = middle.length > 0 ? [middle[0]] : []
          let remaining = middle.slice(1)
          let current = middle[0]
          while (remaining.length > 0) {
            let minDist = Infinity
            let minIdx = -1
            remaining.forEach((p, i) => {
              const d = haversineKm(current.lat, current.lon, p.lat, p.lon)
              if (d < minDist) {
                minDist = d
                minIdx = i
              }
            })
            if (minIdx >= 0) {
              const next = remaining[minIdx]
              orderedMiddle.push(next)
              current = next
              remaining.splice(minIdx, 1)
            }
          }
          ordered = [startItem, ...orderedMiddle]
        } else if (endItem) {
          middle = withCoords.filter((c) => c.id !== endPlaceId)
          const orderedMiddle = middle.length > 0 ? [middle[0]] : []
          let remaining = middle.slice(1)
          let current = middle[0]
          while (remaining.length > 0) {
            let minDist = Infinity
            let minIdx = -1
            remaining.forEach((p, i) => {
              const d = haversineKm(current.lat, current.lon, p.lat, p.lon)
              if (d < minDist) {
                minDist = d
                minIdx = i
              }
            })
            if (minIdx >= 0) {
              const next = remaining[minIdx]
              orderedMiddle.push(next)
              current = next
              remaining.splice(minIdx, 1)
            }
          }
          ordered = [...orderedMiddle, endItem]
        } else {
          ordered = [withCoords[0]]
          let remaining = withCoords.slice(1)
          let current = withCoords[0]
          while (remaining.length > 0) {
            let minDist = Infinity
            let minIdx = -1
            remaining.forEach((p, i) => {
              const d = haversineKm(current.lat, current.lon, p.lat, p.lon)
              if (d < minDist) {
                minDist = d
                minIdx = i
              }
            })
            if (minIdx >= 0) {
              const next = remaining[minIdx]
              ordered.push(next)
              current = next
              remaining.splice(minIdx, 1)
            }
          }
        }

        const totalDistanceAfter = (() => {
          let sum = 0
          for (let i = 0; i < ordered.length - 1; i++) {
            sum += haversineKm(ordered[i].lat, ordered[i].lon, ordered[i + 1].lat, ordered[i + 1].lon)
          }
          return sum
        })()

        const nextIds = ordered.map((p) => p.id).concat(withoutCoords)
        const changed = nextIds.some((id, i) => id !== ids[i])

        saveToBackend(nextIds)
        setPlaceIds(nextIds)

        return {
          changed,
          distanceBefore: totalDistanceBefore,
          distanceAfter: totalDistanceAfter,
          optimizedCount: ordered.length,
          withoutCoordsCount: withoutCoords.length,
          placeTitles: ordered.map((p) => p.title),
        }
      })
      .catch(() => null)
      .finally(() => setPlacesLoading(false))
  }, [placeIds, places, saveToBackend, startPlaceId, endPlaceId])

  const isInConstructor = useCallback(
    (placeId) => placeIds.includes(placeId),
    [placeIds]
  )

  const value = {
    placeIds,
    places,
    placesLoading,
    startPlaceId,
    endPlaceId,
    setStartPlace,
    setEndPlace,
    addPlace,
    removePlace,
    movePlace,
    movePlaceByDrag,
    reorderPlaceIds,
    clear,
    loadPlaceIds,
    optimizeRoute,
    isInConstructor,
  }

  return (
    <RouteConstructorContext.Provider value={value}>
      {children}
    </RouteConstructorContext.Provider>
  )
}
