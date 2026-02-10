"use client"

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { userAPI } from '@/lib/api'
import { publicRoutesAPI, publicPlacesAPI, publicServicesAPI, getImageUrl } from '@/lib/api'
import RouteBlock from '@/components/RouteBlock/RouteBlock'
import PlaceBlock from '@/components/PlaceBlock/PlaceBlock'
import FavoriteButton from '@/components/FavoriteButton/FavoriteButton'
import { ImageCropModal } from '@/app/admin/components'
import styles from './profile.module.css'
import serviceStyles from '@/sections/Services/Services_page.module.css'

const TABS = [
  { id: 'routes', label: 'Маршруты', icon: 'route' },
  { id: 'places', label: 'Интересные места', icon: 'place' },
  { id: 'services', label: 'Сервисы и услуги', icon: 'service' },
  { id: 'edit', label: 'Изменить профиль', icon: 'edit' },
]

function NavIcon({ icon, className }) {
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
  const { user, loading: authLoading, logout, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('routes')
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
                  <NavIcon icon={tab.icon} className={styles.navIcon} />
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
                <p className={styles.empty}>Нет избранных маршрутов. <Link to="/routes">Добавить маршруты</Link></p>
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
    </main>
  )
}
