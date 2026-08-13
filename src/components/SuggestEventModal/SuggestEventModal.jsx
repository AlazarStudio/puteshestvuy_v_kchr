import { useState, useEffect, useRef } from 'react'
import { X, Upload } from 'lucide-react'
import { suggestionsAPI, userMediaAPI, getImageUrl } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import RichTextEditor from '@/components/RichTextEditor'
import ImageCropModal from '@/app/admin/components/ImageCropModal'
// Стили общие с формой предложения места: форма та же по строению,
// свой модуль был бы копией двухсот строк
import styles from '@/components/SuggestPlaceModal/SuggestPlaceModal.module.css'

const INITIAL_FORM = {
  title: '',
  startAt: '',
  endAt: '',
  location: '',
  shortDescription: '',
  description: '',
  organizer: '',
  price: '',
  registrationUrl: '',
  image: '',
}

export default function SuggestEventModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  const [formData, setFormData] = useState(INITIAL_FORM)
  const [pendingPreview, setPendingPreview] = useState(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)
  const cropFileUrlRef = useRef(null)
  const previewInputRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  const cleanup = () => {
    if (pendingPreview?.preview) URL.revokeObjectURL(pendingPreview.preview)
    if (cropFileUrlRef.current) URL.revokeObjectURL(cropFileUrlRef.current)
  }

  const handleClose = () => {
    cleanup()
    setPendingPreview(null)
    setFormData(INITIAL_FORM)
    setSuccess(false)
    setError('')
    onClose()
  }

  const resetForm = () => {
    cleanup()
    setPendingPreview(null)
    setFormData(INITIAL_FORM)
    setSuccess(false)
    setError('')
  }

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }))

  const openCropModal = (src) => {
    if (cropFileUrlRef.current && cropFileUrlRef.current !== src) URL.revokeObjectURL(cropFileUrlRef.current)
    cropFileUrlRef.current = src
    setCropImageSrc(src)
    setCropModalOpen(true)
  }

  const handlePreviewFileSelect = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    openCropModal(URL.createObjectURL(file))
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { onClose(); openAuthModal(); return }
    if (!formData.title.trim()) { setError('Название обязательно'); return }
    if (!formData.startAt) { setError('Укажите дату начала'); return }
    if (!formData.location.trim()) { setError('Укажите, где пройдёт событие'); return }
    if (!formData.shortDescription.trim()) { setError('Добавьте краткое описание'); return }
    if (formData.endAt && formData.endAt < formData.startAt) {
      setError('Дата окончания раньше даты начала')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      let imageUrl = formData.image
      if (pendingPreview) {
        const fd = new FormData()
        fd.append('file', pendingPreview.file)
        const { data } = await userMediaAPI.upload(fd)
        imageUrl = data.url
      }

      await suggestionsAPI.createEvent({ ...formData, image: imageUrl })

      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отправке заявки')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const previewSrc = pendingPreview?.preview || (formData.image ? getImageUrl(formData.image) : null)

  return (
    <>
      <div className={styles.overlay} onClick={handleClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div className={styles.modalTitleBlock}>
              <h2 className={styles.modalTitle}>Предложить событие</h2>
              {!success && user && (
                <p className={styles.modalSubtitle}>Заполните форму — мы рассмотрим и опубликуем в афише</p>
              )}
            </div>
            <button className={styles.closeBtn} onClick={handleClose}><X size={18} /></button>
          </div>

          <div className={styles.modalBody}>
            {!user ? (
              <div className={styles.notAuth}>
                <p>Чтобы предложить событие, войдите в свой аккаунт</p>
                <button className={styles.authBtn} onClick={() => { onClose(); openAuthModal() }}>Войти</button>
              </div>
            ) : success ? (
              <div className={styles.successBlock}>
                <div className={styles.successIcon}>✓</div>
                <h2>Заявка отправлена!</h2>
                <p>Мы рассмотрим ваше предложение и опубликуем событие в афише. Спасибо за вклад в развитие платформы!</p>
                <div className={styles.successActions}>
                  <button className={styles.authBtn} onClick={handleClose}>Закрыть</button>
                  <button className={styles.secondaryBtn} onClick={resetForm}>Предложить ещё</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Основная информация</h3>

                  <div className={styles.field}>
                    <label className={styles.label}>Название <span className={styles.required}>*</span></label>
                    <input type="text" className={styles.input} value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)} placeholder="Название события" />
                  </div>

                  <div className={styles.twoCol}>
                    <div className={styles.field}>
                      <label className={styles.label}>Начало <span className={styles.required}>*</span></label>
                      <input type="datetime-local" className={styles.input} value={formData.startAt}
                        onChange={(e) => handleChange('startAt', e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Окончание</label>
                      <input type="datetime-local" className={styles.input} value={formData.endAt}
                        onChange={(e) => handleChange('endAt', e.target.value)} />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Где пройдёт <span className={styles.required}>*</span></label>
                    <input type="text" className={styles.input} value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="Например: Черкесск, парк «Зелёный остров»" />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Краткое описание <span className={styles.required}>*</span></label>
                    <RichTextEditor value={formData.shortDescription}
                      onChange={(v) => handleChange('shortDescription', v)}
                      placeholder="Одно-два предложения для карточки..." minHeight={90} />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Подробное описание</label>
                    <RichTextEditor value={formData.description}
                      onChange={(v) => handleChange('description', v)}
                      placeholder="Программа, участники, что будет происходить..." minHeight={140} />
                  </div>
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Обложка</h3>
                  <div className={styles.previewArea}>
                    {previewSrc ? (
                      <div className={styles.previewWrap}>
                        <img src={previewSrc} alt="Превью" className={styles.previewImg} />
                        <button type="button" className={styles.removePreviewBtn} onClick={clearPreview}><X size={16} /></button>
                      </div>
                    ) : (
                      <button type="button" className={styles.uploadBtn} onClick={() => previewInputRef.current?.click()}>
                        <Upload size={18} /><span>Загрузить обложку</span>
                      </button>
                    )}
                    <input ref={previewInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePreviewFileSelect} />
                  </div>
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Дополнительно</h3>
                  <div className={styles.twoCol}>
                    <div className={styles.field}>
                      <label className={styles.label}>Организатор</label>
                      <input type="text" className={styles.input} value={formData.organizer}
                        onChange={(e) => handleChange('organizer', e.target.value)} placeholder="Кто проводит" />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Стоимость</label>
                      <input type="text" className={styles.input} value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)} placeholder="Бесплатно, от 500 ₽" />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Ссылка на регистрацию</label>
                    <input type="text" className={styles.input} value={formData.registrationUrl}
                      onChange={(e) => handleChange('registrationUrl', e.target.value)} placeholder="https://..." />
                  </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.submitRow}>
                  <button type="submit" className={styles.submitBtn} disabled={isSaving}>
                    {isSaving ? 'Отправка...' : 'Отправить предложение'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <ImageCropModal open={cropModalOpen} imageSrc={cropImageSrc}
        onComplete={handleCropComplete} onCancel={handleCropCancel} aspect={16 / 9} />
    </>
  )
}
