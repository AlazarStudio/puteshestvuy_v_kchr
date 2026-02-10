"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { GripVertical, ChevronUp, ChevronDown, X, ArrowLeft, Flag, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useRouteConstructor } from '@/contexts/RouteConstructorContext'
import { userAPI, userRoutesAPI } from '@/lib/api'
import { publicRoutesAPI, publicPlacesAPI, publicServicesAPI, getImageUrl } from '@/lib/api'
import YandexMapRoute from '@/components/YandexMapRoute/YandexMapRoute'
import RouteBlock from '@/components/RouteBlock/RouteBlock'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'
import FavoriteButton from '@/components/FavoriteButton/FavoriteButton'
import { ImageCropModal, ConfirmModal } from '@/app/admin/components'
import RichTextEditor from '@/components/RichTextEditor/RichTextEditor'
import styles from './profile.module.css'
import serviceStyles from '@/sections/Services/Services_page.module.css'

const TABS = [
  { id: 'routes', label: 'Маршруты', icon: 'route' },
  { id: 'places', label: 'Интересные места', icon: 'place' },
  { id: 'services', label: 'Сервисы и услуги', icon: 'service' },
  { id: 'routes-constructor', label: 'Конструктор маршрутов', icon: 'constructor', iconImage: '/konst_tours_black.svg' },
  { id: 'edit', label: 'Изменить профиль', icon: 'edit' },
]

function NavIcon({ icon, iconImage, className }) {
  if (iconImage) {
    return <img src={iconImage} alt="" className={className} />
  }
  const svgProps = { className, viewBox: '0 0 24 24', 'aria-hidden': true }
  switch (icon) {
    case 'route':
      return (
        <svg {...svgProps} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    case 'place':
      return (
        <svg {...svgProps} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )
    case 'service':
      return (
        <svg {...svgProps} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9z" />
          <path d="M6 6h.01M10 6h.01M14 6h.01" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...svgProps} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      )
    default:
      return null
  }
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, loading: authLoading, logout, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const {
    places: constructorPlaces,
    placesLoading: constructorPlacesLoading,
    startPlaceId: constructorStartPlaceId,
    endPlaceId: constructorEndPlaceId,
    setStartPlace: setConstructorStartPlace,
    setEndPlace: setConstructorEndPlace,
    removePlace,
    movePlace,
    movePlaceByDrag,
    clear: clearConstructor,
    optimizeRoute,
  } = useRouteConstructor()
  const tabFromUrl = searchParams.get('tab')
  const activeTab = TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'routes'

  const setActiveTab = (tabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (tabId === 'routes') {
        next.delete('tab')
      } else {
        next.set('tab', tabId)
      }
      return next
    })
  }
  const [selectedPlacePopup, setSelectedPlacePopup] = useState(null)
  const [optimizeResultModal, setOptimizeResultModal] = useState(null)
  const [constructorDraggedIndex, setConstructorDraggedIndex] = useState(null)
  const [constructorDragOverIndex, setConstructorDragOverIndex] = useState(null)
  const constructorLastDragOverRef = useRef(null)
  const [routeDetailDraggedIndex, setRouteDetailDraggedIndex] = useState(null)
  const [routeDetailDragOverIndex, setRouteDetailDragOverIndex] = useState(null)
  const routeDetailLastDragOverRef = useRef(null)
  const [routeDetailOptimizeLoading, setRouteDetailOptimizeLoading] = useState(false)
  const [routeDeleteConfirm, setRouteDeleteConfirm] = useState(null)
  const [editTab, setEditTab] = useState('profile')
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [favoriteRoutes, setFavoriteRoutes] = useState([])
  const [favoritePlaces, setFavoritePlaces] = useState([])
  const [favoriteServices, setFavoriteServices] = useState([])
  const [favLoading, setFavLoading] = useState(true)
  const [userRoutes, setUserRoutes] = useState([])
  const [userRoutesLoading, setUserRoutesLoading] = useState(true)
  const [userRoutesError, setUserRoutesError] = useState('')
  const [isRouteEditorOpen, setIsRouteEditorOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [routeForm, setRouteForm] = useState({
    title: '',
    description: '',
    notes: '',
    placeIds: [],
  })
  const [routePlaces, setRoutePlaces] = useState([])
  const [routePlacesSearch, setRoutePlacesSearch] = useState('')
  const [routeSaving, setRouteSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarCropOpen, setAvatarCropOpen] = useState(false)
  const [avatarCropSrc, setAvatarCropSrc] = useState(null)
  const avatarFileInputRef = useRef(null)
  const avatarFileUrlRef = useRef(null)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/profile', { replace: true })
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!user) return
    setFormData({
      email: user.email || '',
      firstName: user.userInformation?.firstName ?? '',
      lastName: user.userInformation?.lastName ?? '',
    })
  }, [user])

  useEffect(() => {
    if (!user) {
      setFavLoading(false)
      return
    }
    const load = async () => {
      setFavLoading(true)
      try {
        const [routes, places, services] = await Promise.all([
          Promise.all((user.favoriteRouteIds || []).map((id) => publicRoutesAPI.getByIdOrSlug(id).then((r) => r.data).catch(() => null))),
          Promise.all((user.favoritePlaceIds || []).map((id) => publicPlacesAPI.getByIdOrSlug(id).then((r) => r.data).catch(() => null))),
          Promise.all((user.favoriteServiceIds || []).map((id) => publicServicesAPI.getByIdOrSlug(id).then((r) => r.data).catch(() => null))),
        ])
        setFavoriteRoutes(routes.filter(Boolean))
        setFavoritePlaces(places.filter(Boolean))
        setFavoriteServices(services.filter(Boolean))
      } catch {
        setFavoriteRoutes([])
        setFavoritePlaces([])
        setFavoriteServices([])
      } finally {
        setFavLoading(false)
      }
    }
    load()
  }, [user?.id, user?.favoriteRouteIds, user?.favoritePlaceIds, user?.favoriteServiceIds])

  // Загрузка пользовательских маршрутов и доступных мест для конструктора
  useEffect(() => {
    if (!user) {
      setUserRoutes([])
      setUserRoutesLoading(false)
      return
    }
    const load = async () => {
      setUserRoutesLoading(true)
      setUserRoutesError('')
      try {
        const [routesRes, placesRes] = await Promise.all([
          userRoutesAPI.getAll(),
          publicPlacesAPI.getAll({ limit: 500 }),
        ])
        setUserRoutes(routesRes.data || [])
        setRoutePlaces(placesRes.data?.items || [])
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Не удалось загрузить маршруты'
        setUserRoutesError(message)
      } finally {
        setUserRoutesLoading(false)
      }
    }
    load()
  }, [user?.id])

  // Синхронизация открытого маршрута с URL (?route=id)
  const routeIdFromUrl = searchParams.get('route')
  useEffect(() => {
    if (!routeIdFromUrl) {
      setOpenedRouteId(null)
      setOpenedRouteEdit(null)
      return
    }
    if (userRoutes.length === 0) return
    const route = userRoutes.find((r) => String(r.id) === String(routeIdFromUrl))
    if (!route) return
    setOpenedRouteId(route.id)
    setOpenedRouteEdit({
      title: route.title || '',
      description: route.description || '',
      notes: route.notes || '',
      placeIds: Array.isArray(route.placeIds) ? [...route.placeIds] : [],
    })
  }, [routeIdFromUrl, userRoutes])

  useEffect(() => {
    return () => {
      if (avatarFileUrlRef.current) {
        URL.revokeObjectURL(avatarFileUrlRef.current)
        avatarFileUrlRef.current = null
      }
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setSaveError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaveLoading(true)
    setSaveError('')
    try {
      const fullNameFromParts = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim()
      const payload = {
        name: fullNameFromParts || user.name,
        email: formData.email,
        userInformation: {
          firstName: formData.firstName || null,
          lastName: formData.lastName || null,
        },
      }

      const { currentPassword, newPassword, confirmPassword } = passwordForm
      const hasPasswordChange = currentPassword || newPassword || confirmPassword

      if (hasPasswordChange) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          setSaveError('Заполните текущий пароль и дважды новый пароль')
          setSaveLoading(false)
          return
        }
        if (newPassword.length < 6) {
          setSaveError('Новый пароль должен быть не менее 6 символов')
          setSaveLoading(false)
          return
        }
        if (newPassword !== confirmPassword) {
          setSaveError('Новый пароль и подтверждение не совпадают')
          setSaveLoading(false)
          return
        }
        payload.currentPassword = currentPassword
        payload.newPassword = newPassword
      }

      await userAPI.updateProfile(payload)
      await refreshProfile()
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Не удалось сохранить'
      setSaveError(message)
      if (message.includes('Неверный текущий пароль')) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } finally {
      setSaveLoading(false)
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
    setSaveError('')
  }

  const displayName = [user?.userInformation?.firstName, user?.userInformation?.lastName].filter(Boolean).join(' ') || user?.name || user?.login || 'Пользователь'
  const avatarUrl = user?.avatar ? getImageUrl(user.avatar) : null

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (avatarFileUrlRef.current) {
      URL.revokeObjectURL(avatarFileUrlRef.current)
    }
    const url = URL.createObjectURL(file)
    avatarFileUrlRef.current = url
    setAvatarCropSrc(url)
    setAvatarCropOpen(true)
  }

  const handleAvatarCropComplete = async (blob) => {
    if (!blob) return
    setAvatarUploading(true)
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      await userAPI.uploadAvatar(file)
      await refreshProfile()
      setAvatarCropOpen(false)
      setAvatarCropSrc(null)
    } catch (err) {
      console.error('Avatar upload failed', err)
    } finally {
      setAvatarUploading(false)
      if (avatarFileUrlRef.current) {
        URL.revokeObjectURL(avatarFileUrlRef.current)
        avatarFileUrlRef.current = null
      }
    }
  }

  const handleAvatarCropCancel = () => {
    setAvatarCropOpen(false)
    setAvatarCropSrc(null)
    if (avatarFileUrlRef.current) {
      URL.revokeObjectURL(avatarFileUrlRef.current)
      avatarFileUrlRef.current = null
    }
  }

  const handleAvatarRemove = async () => {
    if (!user?.avatar) return
    setAvatarUploading(true)
    try {
      await userAPI.updateProfile({ avatar: null })
      await refreshProfile()
    } catch (err) {
      console.error('Avatar remove failed', err)
    } finally {
      setAvatarUploading(false)
    }
  }

  // =============== КОНСТРУКТОР МАРШРУТОВ ===============

  const openCreateRoute = () => {
    setEditingRoute(null)
    setRouteForm({
      title: '',
      description: '',
      notes: '',
      placeIds: [],
    })
    setRoutePlacesSearch('')
    setIsRouteEditorOpen(true)
  }

  const openCreateRouteFromConstructor = () => {
    if (constructorPlaces.length === 0) return
    setEditingRoute(null)
    setRouteForm({
      title: '',
      description: '',
      notes: '',
      placeIds: constructorPlaces.map((p) => p.id),
    })
    setRoutePlacesSearch('')
    setRoutePlaces((prev) => {
      const existingIds = new Set(prev.map((p) => p.id))
      const toAdd = constructorPlaces.filter((p) => !existingIds.has(p.id))
      return toAdd.length ? [...prev, ...toAdd] : prev
    })
    setIsRouteEditorOpen(true)
  }

  const openEditRoute = (route) => {
    setEditingRoute(route)
    setRouteForm({
      title: route.title || '',
      description: route.description || '',
      notes: route.notes || '',
      placeIds: constructorPlaces.map((p) => p.id),
    })
    setRoutePlacesSearch('')
    setRoutePlaces((prev) => {
      const existingIds = new Set(prev.map((p) => p.id))
      const toAdd = constructorPlaces.filter((p) => !existingIds.has(p.id))
      return toAdd.length ? [...prev, ...toAdd] : prev
    })
    setIsRouteEditorOpen(true)
  }

  const [openedRouteId, setOpenedRouteId] = useState(null)
  const [openedRouteEdit, setOpenedRouteEdit] = useState(null)
  const [openedRouteStartPlaceId, setOpenedRouteStartPlaceId] = useState(null)
  const [openedRouteEndPlaceId, setOpenedRouteEndPlaceId] = useState(null)

  const openRouteDetail = (route) => {
    setOpenedRouteId(route.id)
    setOpenedRouteStartPlaceId(null)
    setOpenedRouteEndPlaceId(null)
    setOpenedRouteEdit({
      title: route.title || '',
      description: route.description || '',
      notes: route.notes || '',
      placeIds: Array.isArray(route.placeIds) ? [...route.placeIds] : [],
    })
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', 'routes-constructor')
      next.set('route', String(route.id))
      return next
    })
  }

  const closeRouteDetail = () => {
    setOpenedRouteId(null)
    setOpenedRouteEdit(null)
    setOpenedRouteStartPlaceId(null)
    setOpenedRouteEndPlaceId(null)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('route')
      return next
    })
  }

  const setOpenedRouteStartPlace = (placeId) => {
    if (!openedRouteEdit) return
    if (!placeId) {
      setOpenedRouteStartPlaceId(null)
      return
    }
    setOpenedRouteEndPlaceId((prev) => (prev === placeId ? null : prev))
    setOpenedRouteStartPlaceId(placeId)
    const ids = [...openedRouteEdit.placeIds]
    const i = ids.indexOf(placeId)
    if (i <= 0) return
    ids.splice(i, 1)
    ids.unshift(placeId)
    setOpenedRouteEdit((prev) => ({ ...prev, placeIds: ids }))
  }

  const setOpenedRouteEndPlace = (placeId) => {
    if (!openedRouteEdit) return
    if (!placeId) {
      setOpenedRouteEndPlaceId(null)
      return
    }
    setOpenedRouteStartPlaceId((prev) => (prev === placeId ? null : prev))
    setOpenedRouteEndPlaceId(placeId)
    const ids = [...openedRouteEdit.placeIds]
    const i = ids.indexOf(placeId)
    if (i < 0 || i === ids.length - 1) return
    ids.splice(i, 1)
    ids.push(placeId)
    setOpenedRouteEdit((prev) => ({ ...prev, placeIds: ids }))
  }

  const moveOpenedRoutePlace = (index, direction) => {
    if (!openedRouteEdit) return
    const ids = [...openedRouteEdit.placeIds]
    const fromId = ids[index]
    if (fromId === openedRouteStartPlaceId || fromId === openedRouteEndPlaceId) return
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= ids.length) return
    const toId = ids[newIndex]
    if (toId === openedRouteStartPlaceId || toId === openedRouteEndPlaceId) return
    ;[ids[index], ids[newIndex]] = [ids[newIndex], ids[index]]
    setOpenedRouteEdit((prev) => ({ ...prev, placeIds: ids }))
  }

  const haversineKm = (lat1, lon1, lat2, lon2) => {
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

  const optimizeOpenedRoute = () => {
    if (!openedRouteEdit || openedRouteEdit.placeIds.length < 2) return Promise.resolve(null)
    const ids = [...openedRouteEdit.placeIds]
    setRouteDetailOptimizeLoading(true)
    const withCoords = []
    const withoutCoords = []
    ids.forEach((id) => {
      const p = getPlaceById(id)
      if (p && p.latitude != null && p.longitude != null && Number(p.latitude) && Number(p.longitude)) {
        withCoords.push({ id, lat: Number(p.latitude), lon: Number(p.longitude), title: p.title })
      } else {
        withoutCoords.push(id)
      }
    })
    if (withCoords.length < 2) {
      setRouteDetailOptimizeLoading(false)
      return Promise.resolve(null)
    }
    const totalDistanceBefore = (() => {
      let sum = 0
      for (let i = 0; i < withCoords.length - 1; i++) {
        sum += haversineKm(withCoords[i].lat, withCoords[i].lon, withCoords[i + 1].lat, withCoords[i + 1].lon)
      }
      return sum
    })()
    const startItem = openedRouteStartPlaceId ? withCoords.find((c) => c.id === openedRouteStartPlaceId) : null
    const endItem = openedRouteEndPlaceId ? withCoords.find((c) => c.id === openedRouteEndPlaceId) : null
    let ordered
    if (startItem && endItem && startItem.id !== endItem.id) {
      const middle = withCoords.filter((c) => c.id !== openedRouteStartPlaceId && c.id !== openedRouteEndPlaceId)
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
          remaining = remaining.filter((_, i) => i !== minIdx)
        }
      }
      ordered = [startItem, ...orderedMiddle, endItem]
    } else if (startItem) {
      const middle = withCoords.filter((c) => c.id !== openedRouteStartPlaceId)
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
          remaining = remaining.filter((_, i) => i !== minIdx)
        }
      }
      ordered = [startItem, ...orderedMiddle]
    } else if (endItem) {
      const middle = withCoords.filter((c) => c.id !== openedRouteEndPlaceId)
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
          remaining = remaining.filter((_, i) => i !== minIdx)
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
          remaining = remaining.filter((_, i) => i !== minIdx)
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
    setOpenedRouteEdit((prev) => ({ ...prev, placeIds: nextIds }))
    setRouteDetailOptimizeLoading(false)
    return Promise.resolve({
      changed,
      distanceBefore: totalDistanceBefore,
      distanceAfter: totalDistanceAfter,
      optimizedCount: ordered.length,
      withoutCoordsCount: withoutCoords.length,
      placeTitles: ordered.map((p) => p.title),
    })
  }

  const moveOpenedRoutePlaceByDrag = (draggedIndex, targetIndex) => {
    if (draggedIndex === targetIndex || !openedRouteEdit) return
    const ids = [...openedRouteEdit.placeIds]
    const fromId = ids[draggedIndex]
    const toId = ids[targetIndex]
    if (fromId === openedRouteStartPlaceId || fromId === openedRouteEndPlaceId) return
    if (toId === openedRouteStartPlaceId || toId === openedRouteEndPlaceId) return
    const [removed] = ids.splice(draggedIndex, 1)
    ids.splice(targetIndex, 0, removed)
    setOpenedRouteEdit((prev) => ({ ...prev, placeIds: ids }))
  }

  const removeOpenedRoutePlace = (placeId) => {
    setOpenedRouteStartPlaceId((prev) => (prev === placeId ? null : prev))
    setOpenedRouteEndPlaceId((prev) => (prev === placeId ? null : prev))
    setOpenedRouteEdit((prev) => ({
      ...prev,
      placeIds: prev.placeIds.filter((id) => id !== placeId),
    }))
  }

  const handleOpenedRouteSave = async () => {
    if (!openedRouteId || !openedRouteEdit?.title.trim()) return
    setRouteSaving(true)
    try {
      const payload = {
        title: openedRouteEdit.title.trim(),
        description: openedRouteEdit.description || null,
        notes: openedRouteEdit.notes || null,
        placeIds: openedRouteEdit.placeIds,
        isActive: true,
      }
      const { data } = await userRoutesAPI.update(openedRouteId, payload)
      setUserRoutes((prev) => prev.map((r) => (r.id === data.id ? data : r)))
      setOpenedRouteEdit((prev) => ({ ...prev, title: data.title, description: data.description, notes: data.notes, placeIds: data.placeIds || [] }))
      showToast('Маршрут сохранён')
      closeRouteDetail()
    } catch (err) {
      console.error('Не удалось сохранить маршрут', err)
    } finally {
      setRouteSaving(false)
    }
  }

  const closeRouteEditor = () => {
    if (routeSaving) return
    setIsRouteEditorOpen(false)
  }

  const handleRouteFormChange = (e) => {
    const { name, value } = e.target
    setRouteForm((prev) => ({ ...prev, [name]: value }))
  }

  const getPlaceById = (id) => routePlaces.find((p) => p.id === id)

  const addPlaceToRoute = (placeId) => {
    setRouteForm((prev) => {
      if (prev.placeIds.includes(placeId)) return prev
      return { ...prev, placeIds: [...prev.placeIds, placeId] }
    })
  }

  const removePlaceFromRoute = (placeId) => {
    setRouteForm((prev) => ({
      ...prev,
      placeIds: prev.placeIds.filter((id) => id !== placeId),
    }))
  }

  const moveRoutePlace = (index, direction) => {
    setRouteForm((prev) => {
      const ids = [...prev.placeIds]
      const newIndex = index + direction
      if (newIndex < 0 || newIndex >= ids.length) return prev
      ;[ids[index], ids[newIndex]] = [ids[newIndex], ids[index]]
      return { ...prev, placeIds: ids }
    })
  }

  const filteredConstructorPlaces = useMemo(() => {
    const search = routePlacesSearch.trim().toLowerCase()
    return routePlaces.filter(
      (place) =>
        !routeForm.placeIds.includes(place.id) &&
        (!search ||
          place.title.toLowerCase().includes(search) ||
          (place.location || '').toLowerCase().includes(search)),
    )
  }, [routePlaces, routeForm.placeIds, routePlacesSearch])

  const handleRouteSave = async (e) => {
    e.preventDefault()
    if (!routeForm.title.trim()) return
    setRouteSaving(true)
    try {
      const payload = {
        title: routeForm.title.trim(),
        description: routeForm.description || null,
        notes: routeForm.notes || null,
        placeIds: routeForm.placeIds,
        isActive: true,
      }

      let response
      if (editingRoute?.id) {
        response = await userRoutesAPI.update(editingRoute.id, payload)
        const updated = response.data
        setUserRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        setEditingRoute(updated)
      } else {
        response = await userRoutesAPI.create(payload)
        const created = response.data
        setUserRoutes((prev) => [created, ...prev])
        setEditingRoute(null)
        clearConstructor()
        setActiveTab('routes-constructor')
      }
      setIsRouteEditorOpen(false)
    } catch (err) {
      console.error('Не удалось сохранить маршрут', err)
    } finally {
      setRouteSaving(false)
    }
  }

  const handleRouteDelete = async (routeId) => {
    if (!routeId) return
    try {
      await userRoutesAPI.delete(routeId)
      setUserRoutes((prev) => prev.filter((r) => r.id !== routeId))
      if (editingRoute?.id === routeId) {
        setIsRouteEditorOpen(false)
        setEditingRoute(null)
      }
      if (openedRouteId === routeId) closeRouteDetail()
      setRouteDeleteConfirm(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Не удалось удалить маршрут', err)
      setRouteDeleteConfirm(null)
    }
  }

  if (authLoading || !user) {
    return (
      <main className={styles.profilePage}>
        <div className={styles.loading}>Загрузка...</div>
      </main>
    )
  }

  return (
    <main className={styles.profilePage}>
      <div className={styles.wrap}>
        <aside className={styles.sidebar}>
          <div className={styles.profileCard}>
            <div
              className={styles.avatar}
              role="button"
              tabIndex={0}
              aria-label={avatarUrl ? 'Изменить аватар' : 'Загрузить аватар'}
              onClick={() => avatarFileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  avatarFileInputRef.current?.click()
                }
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
              <span className={styles.avatarEditIcon} aria-hidden="true">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </span>
            </div>
            <h2 className={styles.userName}>{displayName}</h2>
            <nav className={styles.nav}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.navItem} ${activeTab === tab.id ? styles.navItemActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <NavIcon icon={tab.icon} iconImage={tab.iconImage} className={styles.navIcon} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
            <button type="button" onClick={logout} className={styles.logoutBtn}>
              Выйти
            </button>
          </div>
        </aside>

        <div className={styles.content}>
          {openedRouteId && openedRouteEdit ? (
            <div className={styles.routeDetailView}>
              <div className={styles.routeDetailTopBar}>
                <button type="button" className={styles.backBtn} onClick={closeRouteDetail}>
                  <ArrowLeft size={18} />
                  Вернуться назад
                </button>
                <div className={styles.routeDetailTopBarActions}>
                  
                  <button
                    type="button"
                    className={styles.modalFooterSubmit}
                    onClick={handleOpenedRouteSave}
                    disabled={routeSaving || !openedRouteEdit.title.trim()}
                  >
                    {routeSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </div>

              <div className={styles.routeDetailFormBlock}>
                <div className={styles.formRow}>
                  <label className={styles.label}>Название *</label>
                  <input
                    type="text"
                    value={openedRouteEdit.title}
                    onChange={(e) => setOpenedRouteEdit((prev) => ({ ...prev, title: e.target.value }))}
                    className={styles.input}
                    placeholder="Название маршрута"
                  />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>Описание</label>
                  <RichTextEditor
                    value={openedRouteEdit.description}
                    onChange={(v) => setOpenedRouteEdit((prev) => ({ ...prev, description: v }))}
                    placeholder="Описание маршрута"
                    minHeight={140}
                  />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>Заметки</label>
                  <RichTextEditor
                    value={openedRouteEdit.notes}
                    onChange={(v) => setOpenedRouteEdit((prev) => ({ ...prev, notes: v }))}
                    placeholder="Личные заметки"
                    minHeight={140}
                  />
                </div>
              </div>

              <div className={styles.routeDetailLayout}>
                <div className={styles.routeDetailLeft}>
                  <div className={styles.routeDetailPointsHeader}>
                    <h4 className={styles.expandedRoutePointsTitle}>Точки маршрута</h4>
                    {openedRouteEdit.placeIds.length >= 2 && (
                      <button
                        type="button"
                        className={styles.constructorOptimizeBtn}
                        onClick={() => optimizeOpenedRoute().then((result) => result && setOptimizeResultModal(result))}
                        disabled={routeDetailOptimizeLoading}
                      >
                        {routeDetailOptimizeLoading ? 'Оптимизация...' : 'Оптимизировать маршрут'}
                      </button>
                    )}
                  </div>
                  <div className={styles.expandedRoutePointsList}>
                    {openedRouteEdit.placeIds.map((placeId, index) => {
                      const place = getPlaceById(placeId)
                      if (!place) return null
                      const isPinnedStart = placeId === openedRouteStartPlaceId
                      const isPinnedEnd = placeId === openedRouteEndPlaceId
                      const isPinned = isPinnedStart || isPinnedEnd
                      return (
                        <div
                          key={placeId}
                          className={`${styles.expandedRoutePointRow} ${routeDetailDraggedIndex === index ? styles.dragging : ''} ${routeDetailDragOverIndex === index ? styles.dragOver : ''} ${isPinned ? styles.constructorPointPinned : ''}`}
                          onDragOver={isPinned ? undefined : (e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            if (
                              routeDetailDraggedIndex != null &&
                              routeDetailDraggedIndex !== index &&
                              routeDetailLastDragOverRef.current !== index
                            ) {
                              routeDetailLastDragOverRef.current = index
                              moveOpenedRoutePlaceByDrag(routeDetailDraggedIndex, index)
                              setRouteDetailDraggedIndex(index)
                            }
                            setRouteDetailDragOverIndex(index)
                          }}
                          onDragLeave={isPinned ? undefined : () => setRouteDetailDragOverIndex((i) => (i === index ? null : i))}
                          onDrop={isPinned ? undefined : (e) => {
                            e.preventDefault()
                            setRouteDetailDraggedIndex(null)
                            setRouteDetailDragOverIndex(null)
                            routeDetailLastDragOverRef.current = null
                          }}
                        >
                          {!isPinned && (
                            <div
                              className={styles.constructorDragHandle}
                              draggable
                              onDragStart={(e) => {
                                const img = document.createElement('canvas')
                                img.width = 1
                                img.height = 1
                                e.dataTransfer.setDragImage(img, 0, 0)
                                e.dataTransfer.setData('text/plain', String(index))
                                e.dataTransfer.effectAllowed = 'move'
                                setRouteDetailDraggedIndex(index)
                                routeDetailLastDragOverRef.current = null
                              }}
                              onDragEnd={() => {
                                setRouteDetailDraggedIndex(null)
                                setRouteDetailDragOverIndex(null)
                                routeDetailLastDragOverRef.current = null
                              }}
                            >
                              <GripVertical size={20} />
                            </div>
                          )}
                          {!isPinned && (
                            <div className={styles.expandedRouteMoveBtns}>
                              <button
                                type="button"
                                onClick={() => moveOpenedRoutePlace(index, -1)}
                                disabled={index === 0}
                                className={styles.constructorMoveBtn}
                                aria-label="Поднять"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveOpenedRoutePlace(index, 1)}
                                disabled={index === openedRouteEdit.placeIds.length - 1}
                                className={styles.constructorMoveBtn}
                                aria-label="Опустить"
                              >
                                <ChevronDown size={14} />
                              </button>
                            </div>
                          )}
                          <div className={styles.constructorStartEndIcons}>
                            <button
                              type="button"
                              className={`${styles.constructorPinBtn} ${isPinnedStart ? styles.constructorPinActive : ''}`}
                              onClick={() => setOpenedRouteStartPlace(isPinnedStart ? null : placeId)}
                              title={isPinnedStart ? 'Открепить начало' : 'Начало маршрута'}
                              aria-label={isPinnedStart ? 'Открепить начало' : 'Начало маршрута'}
                            >
                              <Flag size={16} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.constructorPinBtn} ${isPinnedEnd ? styles.constructorPinActive : ''}`}
                              onClick={() => setOpenedRouteEndPlace(isPinnedEnd ? null : placeId)}
                              title={isPinnedEnd ? 'Открепить конец' : 'Конец маршрута'}
                              aria-label={isPinnedEnd ? 'Открепить конец' : 'Конец маршрута'}
                            >
                              <MapPin size={16} />
                            </button>
                          </div>
                          <span className={styles.constructorOrderBadge}>{String(index + 1).padStart(2, '0')}</span>
                          <img
                            src={getImageUrl(place.image || place.images?.[0]) || '/placeholder.jpg'}
                            alt=""
                            className={styles.constructorPointImg}
                            onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.jpg' }}
                          />
                          <div className={styles.constructorPointInfo}>
                            <div className={styles.constructorPointTitle}>{place.title}</div>
                          </div>
                          <button
                            type="button"
                            className={styles.constructorRemoveBtn}
                            onClick={() => removeOpenedRoutePlace(placeId)}
                            aria-label="Удалить"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className={styles.expandedRouteRight}>
                  <div className={styles.routeDetailMapWrap}>
                    <YandexMapRoute
                      places={openedRouteEdit.placeIds
                        .map((id) => getPlaceById(id))
                        .filter(Boolean)
                        .map((p) => ({ id: p.id, title: p.title, latitude: p.latitude, longitude: p.longitude }))}
                      height={600}
                      showRouteFromMe
                    />
                  </div>
                </div>
              </div>

              <div className={styles.routeDetailDeleteBlock}>
                <button
                  type="button"
                  className={styles.userRouteActionBtnDanger}
                  onClick={() => setRouteDeleteConfirm({ routeId: openedRouteId })}
                >
                  Удалить маршрут
                </button>
              </div>
            </div>
          ) : (
            <>
          {activeTab === 'edit' && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Изменить профиль</h2>
              <div className={styles.editTabs}>
                <button
                  type="button"
                  className={`${styles.editTab} ${editTab === 'account' ? styles.editTabActive : ''}`}
                  onClick={() => setEditTab('account')}
                >
                  Учётная запись
                </button>
                <button
                  type="button"
                  className={`${styles.editTab} ${editTab === 'profile' ? styles.editTabActive : ''}`}
                  onClick={() => setEditTab('profile')}
                >
                  Профиль
                </button>
                <button
                  type="button"
                  className={`${styles.editTab} ${editTab === 'security' ? styles.editTabActive : ''}`}
                  onClick={() => setEditTab('security')}
                >
                  Безопасность
                </button>
              </div>
              <form onSubmit={handleSubmit} className={styles.form}>
                {saveError && <div className={styles.error}>{saveError}</div>}
                {editTab === 'account' && (
                  <>
                    <h3 className={styles.formSectionTitle}>Учётная запись</h3>
                    <div className={styles.formRow}>
                      <label className={styles.label}>Логин</label>
                      <input type="text" value={user.login} disabled className={styles.inputDisabled} />
                    </div>
                    <div className={styles.formRow}>
                      <label className={styles.label}>Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className={styles.input} placeholder="Email" required />
                    </div>
                  </>
                )}

                {editTab === 'profile' && (
                  <>
                    <div className={styles.formRow}>
                      <label className={styles.label}>Аватар</label>
                      <div className={styles.avatarEditBlock}>
                        <div className={styles.avatarEditPreview}>
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} />
                          ) : (
                            displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className={styles.avatarEditButtons}>
                          <button
                            type="button"
                            className={styles.avatarIconButton}
                            onClick={() => avatarFileInputRef.current?.click()}
                            disabled={avatarUploading}
                            aria-label={avatarUrl ? 'Изменить фото' : 'Загрузить фото'}
                            title={avatarUrl ? 'Изменить фото' : 'Загрузить фото'}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {avatarUrl && (
                            <button
                              type="button"
                              className={`${styles.avatarIconButton} ${styles.avatarIconButtonDanger}`}
                              onClick={handleAvatarRemove}
                              disabled={avatarUploading}
                              aria-label="Удалить аватар"
                              title="Удалить аватар"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <h3 className={styles.formSectionTitle}>Профиль</h3>
                    <div className={`${styles.formRow} ${styles.formRowInline}`}>
                      <div style={{ flex: 1 }}>
                        <label className={styles.label}>Имя</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={styles.input} placeholder="Имя" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className={styles.label}>Фамилия</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={styles.input} placeholder="Фамилия" />
                      </div>
                    </div>
                  </>
                )}

                {editTab === 'security' && (
                  <>
                    <h3 className={styles.formSectionTitle}>Безопасность</h3>
                    <div className={styles.formRow}>
                      <label className={styles.label}>Текущий пароль</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className={styles.input}
                        placeholder="Введите текущий пароль"
                        autoComplete="current-password"
                      />
                    </div>
                    <div className={styles.formRow}>
                      <label className={styles.label}>Новый пароль</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className={styles.input}
                        placeholder="Минимум 6 символов"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className={styles.formRow}>
                      <label className={styles.label}>Повторите новый пароль</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className={styles.input}
                        placeholder="Повторите новый пароль"
                        autoComplete="new-password"
                      />
                    </div>
                  </>
                )}
                <button type="submit" className={styles.submitBtn} disabled={saveLoading}>
                  {saveLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'routes' && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Избранные маршруты</h2>
              {favLoading ? (
                <p className={styles.favLoading}>Загрузка...</p>
              ) : favoriteRoutes.length === 0 ? (
                <p className={styles.empty}>
                  Нет избранных маршрутов. <Link to="/routes">Добавить маршруты</Link>
                </p>
              ) : (
                <div className={styles.routesList}>
                  {favoriteRoutes.map((route) => (
                    <div key={route.id} className={styles.routeCardWrap}>
                      <RouteBlock route={route} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'routes-constructor' && (
            <div className={styles.panel}>
              <div className={styles.constructorHeader}>
                <h2 className={styles.panelTitle}>Конструктор маршрутов</h2>
                {constructorPlaces.length >= 2 && (
                  <button
                    type="button"
                    className={styles.constructorOptimizeBtn}
                    onClick={() => {
                      optimizeRoute().then((result) => {
                        if (result) setOptimizeResultModal(result)
                      })
                    }}
                    disabled={constructorPlacesLoading}
                  >
                    Оптимизировать маршрут
                  </button>
                )}
              </div>

              {constructorPlaces.length === 0 ? (
                <div className={styles.constructorEmpty}>
                  <p className={styles.empty}>
                    Добавляйте места с карточек через иконку конструктора.
                  </p>
                  <Link to="/places" className={styles.constructorEmptyLink}>
                    Перейти к интересным местам
                  </Link>
                  {userRoutes.length > 0 && (
                    <div className={styles.userRoutesSection}>
                      <h3 className={styles.userRoutesSectionTitle}>Мои маршруты</h3>
                      <div className={styles.userRoutesList}>
                        {userRoutes.map((route) => (
                          <div key={route.id} className={styles.userRouteCard}>
                            <div className={styles.userRouteMain}>
                              <div className={styles.userRouteInfo}>
                                <div className={styles.userRouteTitle}>{route.title}</div>
                                <div className={styles.userRouteMeta}>
                                  {Array.isArray(route.placeIds) && route.placeIds.length > 0
                                    ? `${route.placeIds.length} точек на маршруте`
                                    : 'Без точек'}
                                </div>
                              </div>
                              <div className={styles.userRouteActions}>
                                <button
                                  type="button"
                                  className={styles.userRouteActionBtn}
                                  onClick={() => openRouteDetail(route)}
                                >
                                  Открыть
                                </button>
                                <button
                                  type="button"
                                  className={styles.userRouteActionBtnDanger}
                                  onClick={() => setRouteDeleteConfirm({ routeId: route.id })}
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.constructorLayout}>
                  <div className={styles.constructorLeft}>
                    <h3 className={styles.constructorPointsTitle}>Выбранные точки</h3>
                    <div className={styles.constructorPointsList}>
                      {constructorPlaces.map((place, index) => {
                        const isPinnedStart = place.id === constructorStartPlaceId
                        const isPinnedEnd = place.id === constructorEndPlaceId
                        const isPinned = isPinnedStart || isPinnedEnd
                        return (
                        <div
                          key={place.id}
                          className={`${styles.constructorPointRow} ${constructorDraggedIndex === index ? styles.dragging : ''} ${constructorDragOverIndex === index ? styles.dragOver : ''} ${isPinned ? styles.constructorPointPinned : ''}`}
                          onDragOver={isPinned ? undefined : (e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            if (
                              constructorDraggedIndex != null &&
                              constructorDraggedIndex !== index &&
                              constructorLastDragOverRef.current !== index
                            ) {
                              constructorLastDragOverRef.current = index
                              movePlaceByDrag(constructorDraggedIndex, index)
                              setConstructorDraggedIndex(index)
                            }
                            setConstructorDragOverIndex(index)
                          }}
                          onDrop={isPinned ? undefined : (e) => {
                            e.preventDefault()
                            setConstructorDraggedIndex(null)
                            setConstructorDragOverIndex(null)
                            constructorLastDragOverRef.current = null
                          }}
                          onDragLeave={isPinned ? undefined : () => setConstructorDragOverIndex((i) => (i === index ? null : i))}
                        >
                          {!isPinned && (
                            <div
                              className={styles.constructorDragHandle}
                              draggable
                              onDragStart={(e) => {
                                const img = document.createElement('canvas')
                                img.width = 1
                                img.height = 1
                                e.dataTransfer.setDragImage(img, 0, 0)
                                e.dataTransfer.setData('text/plain', String(index))
                                e.dataTransfer.effectAllowed = 'move'
                                setConstructorDraggedIndex(index)
                                constructorLastDragOverRef.current = null
                              }}
                              onDragEnd={() => {
                                setConstructorDraggedIndex(null)
                                setConstructorDragOverIndex(null)
                                constructorLastDragOverRef.current = null
                              }}
                            >
                              <GripVertical size={20} />
                            </div>
                          )}
                          {!isPinned && (
                            <div className={styles.constructorMoveButtons}>
                              <button
                                type="button"
                                onClick={() => movePlace(index, -1)}
                                disabled={index === 0}
                                className={styles.constructorMoveBtn}
                                aria-label="Поднять"
                              >
                                <ChevronUp size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => movePlace(index, 1)}
                                disabled={index === constructorPlaces.length - 1}
                                className={styles.constructorMoveBtn}
                                aria-label="Опустить"
                              >
                                <ChevronDown size={16} />
                              </button>
                            </div>
                          )}
                          <div className={styles.constructorStartEndIcons}>
                            <button
                              type="button"
                              className={`${styles.constructorPinBtn} ${isPinnedStart ? styles.constructorPinActive : ''}`}
                              onClick={() => setConstructorStartPlace(isPinnedStart ? null : place.id)}
                              title={isPinnedStart ? 'Открепить начало' : 'Начало маршрута'}
                              aria-label={isPinnedStart ? 'Открепить начало' : 'Начало маршрута'}
                            >
                              <Flag size={16} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.constructorPinBtn} ${isPinnedEnd ? styles.constructorPinActive : ''}`}
                              onClick={() => setConstructorEndPlace(isPinnedEnd ? null : place.id)}
                              title={isPinnedEnd ? 'Открепить конец' : 'Конец маршрута'}
                              aria-label={isPinnedEnd ? 'Открепить конец' : 'Конец маршрута'}
                            >
                              <MapPin size={16} />
                            </button>
                          </div>
                          <span className={styles.constructorOrderBadge}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <img
                            src={getImageUrl(place.image || place.images?.[0]) || '/placeholder.jpg'}
                            alt=""
                            className={styles.constructorPointImg}
                            onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.jpg' }}
                          />
                          <div className={styles.constructorPointInfo}>
                            <div className={styles.constructorPointTitle}>{place.title}</div>
                            <div className={styles.constructorPointMeta}>
                              {place.rating != null ? `${place.rating} ` : ''}
                              {place.reviewsCount != null ? `${place.reviewsCount} отзывов` : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.constructorRemoveBtn}
                            onClick={() => removePlace(place.id)}
                            title="Удалить"
                            aria-label="Удалить"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        )
                      })}
                    </div>
                    <div className={styles.constructorBottomBtns}>
                      <button
                        type="button"
                        className={styles.constructorResetBtn}
                        onClick={() => {
                          if (window.confirm('Очистить все точки?')) clearConstructor()
                        }}
                      >
                        Сбросить
                      </button>
                      <button
                        type="button"
                        className={styles.constructorCreateBtn}
                        onClick={openCreateRouteFromConstructor}
                      >
                        Создать маршрут
                      </button>
                    </div>
                  </div>
                  <div className={styles.constructorRight}>
                    <div className={styles.constructorMapWrap}>
                      <YandexMapRoute
                        places={constructorPlaces}
                        height="100%"
                        className={styles.constructorMapFill}
                        showRouteFromMe
                        onPlacemarkClick={(place) => setSelectedPlacePopup(place)}
                      />
                    </div>
                    {selectedPlacePopup && (
                      <div
                        className={styles.constructorPopupOverlay}
                        onClick={() => setSelectedPlacePopup(null)}
                      >
                        <div
                          className={styles.constructorPopup}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={styles.constructorPopupClose}
                            onClick={() => setSelectedPlacePopup(null)}
                            aria-label="Закрыть"
                          >
                            <X size={20} />
                          </button>
                          <div className={styles.constructorPopupImage}>
                            <img
                              src={getImageUrl(selectedPlacePopup.image || selectedPlacePopup.images?.[0]) || '/placeholder.jpg'}
                              alt={selectedPlacePopup.title}
                              onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.jpg' }}
                            />
                            <div className={styles.constructorPopupRating}>
                              {selectedPlacePopup.rating ?? '—'} {selectedPlacePopup.reviewsCount != null ? `${selectedPlacePopup.reviewsCount} отзывов` : ''}
                            </div>
                          </div>
                          <h4 className={styles.constructorPopupTitle}>{selectedPlacePopup.title}</h4>
                          <div className={styles.constructorPopupTabs}>
                            <span className={styles.constructorPopupTabActive}>Обзор</span>
                          </div>
                          <div className={styles.constructorPopupOverview}>
                            {selectedPlacePopup.location && (
                              <div className={styles.constructorPopupRow}>
                                <span className={styles.constructorPopupIcon}>📍</span>
                                {selectedPlacePopup.location}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className={styles.constructorPopupMore}
                            onClick={() => {
                              if (selectedPlacePopup.slug) {
                                navigate(`/places/${selectedPlacePopup.slug}`)
                                setSelectedPlacePopup(null)
                              }
                            }}
                          >
                            Узнать больше
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'places' && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Избранные интересные места</h2>
              {favLoading ? (
                <p className={styles.favLoading}>Загрузка...</p>
              ) : favoritePlaces.length === 0 ? (
                <p className={styles.empty}>Нет избранных мест. <Link to="/places">Добавить места</Link></p>
              ) : (
                <div className={styles.placesGrid}>
                  {favoritePlaces.map((place) => (
                    <div key={place.id} className={styles.placeCardWrap}>
                      <PlaceBlock
                        placeId={place.id}
                        img={getImageUrl(place.image || place.images?.[0]) || '/placeholder.jpg'}
                        place={place.location || ''}
                        title={place.title}
                        desc={place.shortDescription || ''}
                        rating={place.rating}
                        feedback={`${place.reviewsCount || 0} отзывов`}
                        reviewsCount={place.reviewsCount || 0}
                        onClick={() => navigate(`/places/${place.slug}`)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Избранные услуги и сервисы</h2>
              {favLoading ? (
                <p className={styles.favLoading}>Загрузка...</p>
              ) : favoriteServices.length === 0 ? (
                <p className={styles.empty}>Нет избранных услуг. <Link to="/services">Добавить услуги</Link></p>
              ) : (
                <div className={serviceStyles.servicesGrid}>
                  {favoriteServices.map((service) => (
                    <div key={service.id} className={styles.serviceCardWrap}>
                      <Link to={`/services/${service.slug || service.id}`} className={serviceStyles.serviceCard}>
                        <div className={serviceStyles.serviceCardImg}>
                          <img src={getImageUrl(service.image || service.images?.[0]) || '/placeholder.jpg'} alt={service.title} onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.jpg' }} />
                        </div>
                        <div className={serviceStyles.serviceCardTopLine} data-no-navigate onClick={(e) => e.preventDefault()}>
                          <div className={serviceStyles.serviceCardLike}>
                            <FavoriteButton entityType="service" entityId={service.id} />
                          </div>
                        </div>
                        <div className={serviceStyles.serviceCardInfo}>
                          <div className={serviceStyles.serviceCardCategory}>{service.category || 'Услуга'}</div>
                          <div className={serviceStyles.serviceCardRating}>
                            <div className={serviceStyles.serviceCardStars}>
                              <img src="/star.png" alt="" />
                              {service.rating ?? '—'}
                            </div>
                            <div className={serviceStyles.serviceCardFeedback}>
                              {service.reviewsCount ?? 0} отзывов
                            </div>
                          </div>
                          <div className={serviceStyles.serviceCardName}>{service.title}</div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </div>
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleAvatarFileChange}
      />
      <ImageCropModal
        open={avatarCropOpen}
        imageSrc={avatarCropSrc}
        title="Обрезка аватара"
        aspect={1}
        onComplete={handleAvatarCropComplete}
        onCancel={handleAvatarCropCancel}
      />
      <ConfirmModal
        open={!!routeDeleteConfirm}
        title="Удалить маршрут?"
        message="Вы уверены, что хотите удалить этот маршрут? Действие нельзя отменить."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="danger"
        onConfirm={() => routeDeleteConfirm && handleRouteDelete(routeDeleteConfirm.routeId)}
        onCancel={() => setRouteDeleteConfirm(null)}
      />
      {optimizeResultModal && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Результат оптимизации маршрута"
          onClick={() => setOptimizeResultModal(null)}
        >
          <div
            className={styles.optimizeResultModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.optimizeResultTitle}>Результат оптимизации маршрута</h2>
            <div className={styles.optimizeResultContent}>
              {optimizeResultModal.changed ? (
                <>
                  <p className={styles.optimizeResultP}>
                    <strong>Что изменилось:</strong> Порядок точек перестроен по алгоритму «ближайший сосед».
                  </p>
                  <p className={styles.optimizeResultP}>
                    Алгоритм последовательно выбирает следующую точку как ближайшую к текущей по прямому расстоянию.
                    Это уменьшает общую протяжённость маршрута.
                  </p>
                  <p className={styles.optimizeResultP}>
                    Расстояние по прямой (сумма отрезков): было{' '}
                    <strong>{optimizeResultModal.distanceBefore.toFixed(1)} км</strong>, стало{' '}
                    <strong>{optimizeResultModal.distanceAfter.toFixed(1)} км</strong>.
                    {optimizeResultModal.distanceBefore > optimizeResultModal.distanceAfter && (
                      <> Сокращение: {(optimizeResultModal.distanceBefore - optimizeResultModal.distanceAfter).toFixed(1)} км.</>
                    )}
                  </p>
                  {optimizeResultModal.placeTitles.length > 0 && (
                    <p className={styles.optimizeResultP}>
                      <strong>Новый порядок:</strong> {optimizeResultModal.placeTitles.join(' → ')}
                    </p>
                  )}
                  {optimizeResultModal.withoutCoordsCount > 0 && (
                    <p className={styles.optimizeResultP} style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                      {optimizeResultModal.withoutCoordsCount} {optimizeResultModal.withoutCoordsCount === 1 ? 'точка без координат' : 'точек без координат'} оставлена в конце.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className={styles.optimizeResultP}>
                    Порядок точек уже был близок к оптимальному — изменений не внесено.
                  </p>
                  <p className={styles.optimizeResultP}>
                    Алгоритм «ближайший сосед» перебирает точки, выбирая каждый раз самую близкую.
                    Текущая последовательность даёт аналогичный или лучший результат.
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              className={styles.constructorCreateBtn}
              style={{ marginTop: 16 }}
              onClick={() => setOptimizeResultModal(null)}
            >
              Понятно
            </button>
          </div>
        </div>
      )}
      {isRouteEditorOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={editingRoute ? 'Редактирование маршрута' : 'Создание маршрута'}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRouteEditor()
          }}
        >
          <div
            className={styles.modalDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingRoute ? 'Редактирование маршрута' : 'Новый маршрут'}
              </h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeRouteEditor}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleRouteSave} className={styles.modalBody}>
              <div className={styles.formRow}>
                <label className={styles.label}>Название маршрута *</label>
                <input
                  type="text"
                  name="title"
                  value={routeForm.title}
                  onChange={handleRouteFormChange}
                  className={styles.input}
                  placeholder="Например: Уикенд в Архызе"
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>Описание</label>
                <RichTextEditor
                  value={routeForm.description}
                  onChange={(value) => setRouteForm((prev) => ({ ...prev, description: value }))}
                  placeholder="Кратко опишите маршрут"
                  minHeight={180}
                />
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>Заметки</label>
                <RichTextEditor
                  value={routeForm.notes}
                  onChange={(value) => setRouteForm((prev) => ({ ...prev, notes: value }))}
                  placeholder="Личные заметки: что взять, на что обратить внимание"
                  minHeight={180}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalFooterCancel}
                  onClick={closeRouteEditor}
                  disabled={routeSaving}
                >
                  Отмена
                </button>
                <button type="submit" className={styles.modalFooterSubmit} disabled={routeSaving}>
                  {routeSaving ? 'Сохранение...' : 'Сохранить маршрут'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
