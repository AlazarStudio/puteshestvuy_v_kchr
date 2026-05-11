

import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { suggestionsAPI, publicPlacesAPI, mediaAPI, getImageUrl } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import YandexMapPicker from '@/components/YandexMapPicker'
import RichTextEditor from '@/components/RichTextEditor'
import ImageCropModal from '@/app/admin/components/ImageCropModal'
import styles from './suggest-place.module.css'

export default function SuggestPlacePage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { openAuthModal } = useAuthModal()

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    latitude: null,
    longitude: null,
    shortDescription: '',
    description: '',
    howToGet: '',
    importantInfo: '',
    mapUrl: '',
    audioGuide: '',
    video: '',
    image: '',
    images: [],
    directions: [],
    seasons: [],
    objectTypes: [],
    accessibility: [],
  })

  const [filterOptions, setFilterOptions] = useState({
    directions: [],
    seasons: [],
    objectTypes: [],
    accessibility: [],
  })

  const [pendingPreview, setPendingPreview] = useState(null)
  const [pendingGallery, setPendingGallery] = useState([])
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)
  const cropFileUrlRef = useRef(null)
  const previewInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const [mapSearchMode, setMapSearchMode] = useState('byName')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    publicPlacesAPI.getFilters()
      .then(({ data }) => {
        setFilterOptions({
          directions: data?.directions || [],
          seasons: data?.seasons || [],
          objectTypes: data?.objectTypes || [],
          accessibility: data?.accessibility || [],
        })
      })
      .catch(() => {})
  }, [])

  const allGalleryItems = useMemo(() => [
    ...formData.images.map((url) => ({ type: 'saved', url })),
    ...pendingGallery.map(({ file, preview }) => ({ type: 'pending', file, preview })),
  ], [formData.images, pendingGallery])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleFilter = (field, value) => {
    setFormData((prev) => {
      const arr = prev[field]
      return { ...prev, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] }
    })
  }

  const openCropModal = (src) => {
    if (cropFileUrlRef.current) URL.revokeObjectURL(cropFileUrlRef.current)
    cropFileUrlRef.current = null
    setCropImageSrc(src)
    setCropModalOpen(true)
  }

  const handlePreviewFileSelect = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const url = URL.createObjectURL(file)
    cropFileUrlRef.current = url
    openCropModal(url)
  }

  const handleCropComplete = (blob) => {
    const file = new File([blob], 'preview.jpg', { type: 'image/jpeg' })
    setPendingPreview({ file, preview: URL.createObjectURL(file) })
    setCropModalOpen(false)
    setCropImageSrc(null)
    if (cropFileUrlRef.current) { URL.revokeObjectURL(cropFileUrlRef.current); cropFileUrlRef.current = null }
  }

  const handleCropCancel = () => {
    setCropModalOpen(false)
    setCropImageSrc(null)
    if (cropFileUrlRef.current) { URL.revokeObjectURL(cropFileUrlRef.current); cropFileUrlRef.current = null }
  }

  const clearPreview = () => {
    if (pendingPreview) { URL.revokeObjectURL(pendingPreview.preview); setPendingPreview(null) }
    setFormData((prev) => ({ ...prev, image: '' }))
  }

  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setPendingGallery((prev) => [
      ...prev,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ])
  }

  const applyGalleryOrder = (items) => {
    const saved = items.filter((x) => x.type === 'saved').map((x) => x.url)
    const pending = items.filter((x) => x.type === 'pending').map((x) => ({ file: x.file, preview: x.preview }))
    setFormData((prev) => ({ ...prev, images: saved }))
    setPendingGallery(pending)
  }

  const removeGalleryItem = (index) => {
    const item = allGalleryItems[index]
    if (item?.type === 'pending' && item.preview) URL.revokeObjectURL(item.preview)
    applyGalleryOrder(allGalleryItems.filter((_, i) => i !== index))
  }

  const moveGalleryItem = (index, dir) => {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= allGalleryItems.length) return
    const next = [...allGalleryItems]
    ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
    applyGalleryOrder(next)
  }

  useEffect(() => {
    return () => {
      if (pendingPreview?.preview) URL.revokeObjectURL(pendingPreview.preview)
      pendingGallery.forEach((p) => URL.revokeObjectURL(p.preview))
      if (cropFileUrlRef.current) URL.revokeObjectURL(cropFileUrlRef.current)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { openAuthModal(); return }
    if (!formData.title.trim()) { setError('Название обязательно'); return }

    setIsSaving(true)
    setError('')

    try {
      let imageUrl = formData.image
      if (pendingPreview) {
        const fd = new FormData()
        fd.append('file', pendingPreview.file)
        const { data } = await mediaAPI.upload(fd)
        imageUrl = data.url
      }

      const uploadedImages = [...formData.images]
      for (const { file } of pendingGallery) {
        const fd = new FormData()
        fd.append('file', file)
        const { data } = await mediaAPI.upload(fd)
        uploadedImages.push(data.url)
      }

      await suggestionsAPI.create({
        ...formData,
        image: imageUrl,
        images: uploadedImages,
        latitude: formData.latitude != null ? Number(formData.latitude) : null,
        longitude: formData.longitude != null ? Number(formData.longitude) : null,
      })

      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отправке заявки')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) return null

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.notAuth}>
          <h2>Необходима авторизация</h2>
          <p>Чтобы предложить место, войдите в свой аккаунт</p>
          <button className={styles.authBtn} onClick={() => openAuthModal()}>
            Войти
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.successBlock}>
          <div className={styles.successIcon}>✓</div>
          <h2>Заявка отправлена!</h2>
          <p>Мы рассмотрим ваше предложение и свяжемся с вами. Спасибо за вклад в развитие платформы!</p>
          <div className={styles.successActions}>
            <button className={styles.authBtn} onClick={() => navigate('/places')}>
              К местам
            </button>
            <button className={styles.secondaryBtn} onClick={() => { setSuccess(false); setFormData({ title: '', location: '', latitude: null, longitude: null, shortDescription: '', description: '', howToGet: '', importantInfo: '', mapUrl: '', audioGuide: '', video: '', image: '', images: [], directions: [], seasons: [], objectTypes: [], accessibility: [] }) }}>
              Предложить ещё
            </button>
          </div>
        </div>
      </div>
    )
  }

  const previewSrc = pendingPreview?.preview || (formData.image ? getImageUrl(formData.image) : null)

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Предложить место</h1>
          <p className={styles.subtitle}>Знаете интересное место, которого нет на платформе? Заполните форму — мы рассмотрим и опубликуем.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Основные данные */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Основная информация</h2>

            <div className={styles.field}>
              <label className={styles.label}>Название <span className={styles.required}>*</span></label>
              <input
                type="text"
                className={styles.input}
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Название места"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Локация</label>
              <input
                type="text"
                className={styles.input}
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Например: Домбай, Карачаево-Черкесия"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Краткое описание</label>
              <RichTextEditor
                value={formData.shortDescription}
                onChange={(v) => handleChange('shortDescription', v)}
                placeholder="Короткое описание для карточки..."
                minHeight={100}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Полное описание</label>
              <RichTextEditor
                value={formData.description}
                onChange={(v) => handleChange('description', v)}
                placeholder="Подробное описание места..."
                minHeight={180}
              />
            </div>

            <div className={styles.twoCol}>
              <div className={styles.field}>
                <label className={styles.label}>Как добраться</label>
                <RichTextEditor
                  value={formData.howToGet}
                  onChange={(v) => handleChange('howToGet', v)}
                  placeholder="Описание маршрута..."
                  minHeight={100}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Важно знать</label>
                <RichTextEditor
                  value={formData.importantInfo}
                  onChange={(v) => handleChange('importantInfo', v)}
                  placeholder="Важная информация для посетителей..."
                  minHeight={100}
                />
              </div>
            </div>
          </div>

          {/* Карта */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Местоположение на карте</h2>

            <div className={styles.mapModeRow}>
              <button
                type="button"
                className={`${styles.mapModeBtn} ${mapSearchMode === 'byName' ? styles.mapModeBtnActive : ''}`}
                onClick={() => setMapSearchMode('byName')}
              >
                По названию
              </button>
              <button
                type="button"
                className={`${styles.mapModeBtn} ${mapSearchMode === 'byCoordinates' ? styles.mapModeBtnActive : ''}`}
                onClick={() => setMapSearchMode('byCoordinates')}
              >
                По координатам
              </button>
            </div>

            <YandexMapPicker
              lat={formData.latitude}
              lng={formData.longitude}
              searchMode={mapSearchMode}
              onLocationSelect={({ lat, lng, address }) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                  location: address || prev.location,
                }))
              }}
            />

            {formData.latitude && formData.longitude && (
              <div className={styles.coordsRow}>
                <MapPin size={14} />
                <span>{Number(formData.latitude).toFixed(6)}, {Number(formData.longitude).toFixed(6)}</span>
              </div>
            )}
          </div>

          {/* Медиа */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Фотографии</h2>

            <div className={styles.field}>
              <label className={styles.label}>Обложка</label>
              <div className={styles.previewArea}>
                {previewSrc ? (
                  <div className={styles.previewWrap}>
                    <img src={previewSrc} alt="Превью" className={styles.previewImg} />
                    <button type="button" className={styles.removePreviewBtn} onClick={clearPreview}><X size={16} /></button>
                  </div>
                ) : (
                  <button type="button" className={styles.uploadBtn} onClick={() => previewInputRef.current?.click()}>
                    <Upload size={20} />
                    <span>Загрузить обложку</span>
                  </button>
                )}
                <input ref={previewInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePreviewFileSelect} />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Фотогалерея</label>
              <div className={styles.gallery}>
                {allGalleryItems.map((item, index) => (
                  <div key={index} className={styles.galleryItem}>
                    <img
                      src={item.type === 'saved' ? getImageUrl(item.url) : item.preview}
                      alt=""
                      className={styles.galleryImg}
                    />
                    <div className={styles.galleryControls}>
                      <button type="button" onClick={() => moveGalleryItem(index, -1)} disabled={index === 0}><ChevronLeft size={14} /></button>
                      <button type="button" onClick={() => removeGalleryItem(index)}><X size={14} /></button>
                      <button type="button" onClick={() => moveGalleryItem(index, 1)} disabled={index === allGalleryItems.length - 1}><ChevronRight size={14} /></button>
                    </div>
                  </div>
                ))}
                <button type="button" className={styles.addGalleryBtn} onClick={() => galleryInputRef.current?.click()}>
                  <Upload size={20} />
                  <span>Добавить</span>
                </button>
                <input ref={galleryInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleGallerySelect} />
              </div>
            </div>
          </div>

          {/* Фильтры */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Категории</h2>

            {[
              { key: 'directions', label: 'Направление' },
              { key: 'seasons', label: 'Сезон' },
              { key: 'objectTypes', label: 'Вид объекта' },
              { key: 'accessibility', label: 'Доступность' },
            ].map(({ key, label }) => (
              filterOptions[key].length > 0 && (
                <div key={key} className={styles.field}>
                  <label className={styles.label}>{label}</label>
                  <div className={styles.chips}>
                    {filterOptions[key].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`${styles.chip} ${formData[key].includes(val) ? styles.chipActive : ''}`}
                        onClick={() => toggleFilter(key, val)}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Доп. ссылки */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Дополнительно</h2>

            <div className={styles.twoCol}>
              <div className={styles.field}>
                <label className={styles.label}>Ссылка на карту (Яндекс / Google)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.mapUrl}
                  onChange={(e) => handleChange('mapUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Аудиогид (ссылка)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.audioGuide}
                  onChange={(e) => handleChange('audioGuide', e.target.value)}
                  placeholder="https://music.yandex.ru/..."
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Видео (ссылка VK Video / YouTube)</label>
              <input
                type="text"
                className={styles.input}
                value={formData.video}
                onChange={(e) => handleChange('video', e.target.value)}
                placeholder="https://vkvideo.ru/..."
              />
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.submitRow}>
            <button type="submit" className={styles.submitBtn} disabled={isSaving}>
              {isSaving ? 'Отправка...' : 'Отправить предложение'}
            </button>
          </div>
        </form>
      </div>

      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        aspect={16 / 9}
      />
    </div>
  )
}
