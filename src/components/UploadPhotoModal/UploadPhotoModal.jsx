import { useState, useEffect, useRef } from 'react'
import { X, Upload, Search } from 'lucide-react'
import { userMediaAPI, galleryAPI, publicPlacesAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import styles from './UploadPhotoModal.module.css'

const MAX_FILES = 10
const MAX_FILE_BYTES = 40 * 1024 * 1024
const PLACE_SEARCH_DELAY = 300

export const CONSENT_TEXT =
  'Ставя галочку, я подтверждаю, что загружаемые фотографии передаются в общее пользование и могут быть использованы в качестве иллюстраций как другими пользователями портала, так и его администрацией.'

let itemUidCounter = 0
const nextItemUid = () => `photo-${++itemUidCounter}`

export default function UploadPhotoModal({ isOpen, onClose, onUploaded }) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  const [items, setItems] = useState([])
  const [consent, setConsent] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [failedCount, setFailedCount] = useState(0)
  const [placeQuery, setPlaceQuery] = useState({ uid: null, results: [] })

  const fileInputRef = useRef(null)
  const itemsRef = useRef([])
  const isSavingRef = useRef(false)
  const dropdownRef = useRef(null)
  const placeSearchTimerRef = useRef(null)
  const placeSearchIdRef = useRef(0)

  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => { isSavingRef.current = isSaving }, [isSaving])

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

  useEffect(() => () => {
    if (placeSearchTimerRef.current) clearTimeout(placeSearchTimerRef.current)
  }, [])

  // Закрытие выпадающего списка мест по клику вне него.
  // Регистрация отложена на тик, иначе тот же клик закроет список до срабатывания выбора.
  useEffect(() => {
    if (!placeQuery.uid) return
    const onDocClick = (e) => {
      if (dropdownRef.current?.contains(e.target)) return
      setPlaceQuery({ uid: null, results: [] })
    }
    const timer = setTimeout(() => document.addEventListener('click', onDocClick), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', onDocClick)
    }
  }, [placeQuery.uid])

  const cleanup = () => {
    itemsRef.current.forEach((item) => URL.revokeObjectURL(item.preview))
  }

  const resetState = () => {
    cleanup()
    setItems([])
    setConsent(false)
    setError('')
    setProgress(null)
    setPlaceQuery({ uid: null, results: [] })
  }

  const handleClose = () => {
    if (isSavingRef.current) return
    resetState()
    setSuccess(false)
    setFailedCount(0)
    onClose?.()
  }

  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return

    const tooBig = files.filter((f) => f.size > MAX_FILE_BYTES)
    const allowed = files.filter((f) => f.size <= MAX_FILE_BYTES)
    const free = MAX_FILES - items.length
    const accepted = allowed.slice(0, free)

    if (tooBig.length) {
      setError('Файл больше 40 МБ загрузить нельзя')
    } else if (allowed.length > free) {
      setError(`Можно отправить не больше ${MAX_FILES} фотографий за раз`)
    } else {
      setError('')
    }

    setItems((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        uid: nextItemUid(),
        file,
        preview: URL.createObjectURL(file),
        authorCaption: user?.name || '',
        placeCaption: '',
        placeId: null,
      })),
    ])
  }

  const updateItem = (uid, patch) => {
    setItems((prev) => prev.map((item) => (item.uid === uid ? { ...item, ...patch } : item)))
  }

  const removeItem = (uid) => {
    const item = items.find((i) => i.uid === uid)
    if (item) URL.revokeObjectURL(item.preview)
    setItems((prev) => prev.filter((i) => i.uid !== uid))
    setPlaceQuery((prev) => (prev.uid === uid ? { uid: null, results: [] } : prev))
  }

  const applyAuthorToAll = () => {
    const author = items[0]?.authorCaption || ''
    setItems((prev) => prev.map((item) => ({ ...item, authorCaption: author })))
  }

  const searchPlaces = (uid, value) => {
    updateItem(uid, { placeCaption: value, placeId: null })
    if (placeSearchTimerRef.current) clearTimeout(placeSearchTimerRef.current)

    const query = value.trim()
    if (query.length < 2) {
      setPlaceQuery({ uid: null, results: [] })
      return
    }

    const requestId = ++placeSearchIdRef.current
    placeSearchTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await publicPlacesAPI.getAll({ search: query, limit: 10 })
        if (requestId !== placeSearchIdRef.current) return
        setPlaceQuery({ uid, results: data?.items || [] })
      } catch {
        if (requestId !== placeSearchIdRef.current) return
        setPlaceQuery({ uid: null, results: [] })
      }
    }, PLACE_SEARCH_DELAY)
  }

  const pickPlace = (uid, place) => {
    updateItem(uid, { placeCaption: place.title, placeId: place.id })
    setPlaceQuery({ uid: null, results: [] })
  }

  const canSubmit = consent && items.length > 0 && !isSaving
    && items.every((item) => item.authorCaption.trim() && item.placeCaption.trim())

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { onClose?.(); openAuthModal(); return }
    if (!canSubmit) return

    setIsSaving(true)
    isSavingRef.current = true
    setError('')

    const uploaded = []
    let failed = 0

    for (let i = 0; i < items.length; i++) {
      setProgress({ current: i + 1, total: items.length })
      const item = items[i]
      try {
        const fd = new FormData()
        fd.append('file', item.file)
        const { data } = await userMediaAPI.upload(fd)
        uploaded.push({
          url: data.url,
          filename: data.filename,
          size: data.size,
          width: data.width,
          height: data.height,
          authorCaption: item.authorCaption.trim(),
          placeCaption: item.placeCaption.trim(),
          placeId: item.placeId,
        })
      } catch {
        failed += 1
      }
    }

    setProgress(null)

    if (uploaded.length === 0) {
      setError('Не удалось загрузить ни одной фотографии. Попробуйте ещё раз')
      setIsSaving(false)
      isSavingRef.current = false
      return
    }

    try {
      await galleryAPI.create({ consent: true, photos: uploaded })
      resetState()
      setFailedCount(failed)
      setSuccess(true)
      onUploaded?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отправке фотографий')
    } finally {
      setIsSaving(false)
      isSavingRef.current = false
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-photo-title"
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleBlock}>
            <h2 className={styles.modalTitle} id="upload-photo-title">Загрузить фотографии</h2>
            {user && !success && (
              <p className={styles.modalSubtitle}>
                Снимки попадут в фотобанк региона после проверки администратором
              </p>
            )}
          </div>
          <button className={styles.closeBtn} onClick={handleClose} disabled={isSaving} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {!user ? (
            <div className={styles.notAuth}>
              <p>Чтобы загрузить фотографии, войдите в свой аккаунт</p>
              <button className={styles.primaryBtn} onClick={() => { onClose?.(); openAuthModal() }}>
                Войти
              </button>
            </div>
          ) : success ? (
            <div className={styles.successBlock}>
              <div className={styles.successIcon}>✓</div>
              <h3>Фотографии отправлены на проверку</h3>
              <p>После подтверждения администратором они появятся в фотобанке региона.</p>
              {failedCount > 0 && (
                <p className={styles.successWarning}>
                  Не удалось загрузить фотографий: {failedCount}. Попробуйте добавить их ещё раз.
                </p>
              )}
              <div className={styles.successActions}>
                <button className={styles.primaryBtn} onClick={handleClose}>Закрыть</button>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => { setSuccess(false); setFailedCount(0) }}
                >
                  Загрузить ещё
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Фотографии</h3>

                {items.length > 0 && (
                  <div className={styles.itemsList}>
                    {items.map((item) => (
                      <div key={item.uid} className={styles.item}>
                        <div className={styles.itemPreview}>
                          <img src={item.preview} alt="" />
                          <button
                            type="button"
                            className={styles.itemRemove}
                            onClick={() => removeItem(item.uid)}
                            aria-label="Убрать фотографию"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className={styles.itemFields}>
                          <div className={styles.field}>
                            <label className={styles.label} htmlFor={`author-${item.uid}`}>
                              Автор <span className={styles.required}>*</span>
                            </label>
                            <input
                              id={`author-${item.uid}`}
                              type="text"
                              className={styles.input}
                              value={item.authorCaption}
                              onChange={(e) => updateItem(item.uid, { authorCaption: e.target.value })}
                              placeholder="Имя автора снимка"
                            />
                          </div>

                          <div className={styles.field}>
                            <label className={styles.label} htmlFor={`place-${item.uid}`}>
                              Место <span className={styles.required}>*</span>
                            </label>
                            <div
                              className={styles.placeInputWrap}
                              ref={placeQuery.uid === item.uid ? dropdownRef : null}
                            >
                              <Search size={15} className={styles.placeInputIcon} />
                              <input
                                id={`place-${item.uid}`}
                                type="text"
                                className={`${styles.input} ${styles.placeInput}`}
                                value={item.placeCaption}
                                onChange={(e) => searchPlaces(item.uid, e.target.value)}
                                placeholder="Например: Домбай, Русская поляна"
                              />
                              {placeQuery.uid === item.uid && placeQuery.results.length > 0 && (
                                <div className={styles.placeDropdown}>
                                  {placeQuery.results.map((place) => (
                                    <button
                                      key={place.id}
                                      type="button"
                                      className={styles.placeOption}
                                      onClick={() => pickPlace(item.uid, place)}
                                    >
                                      {place.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {item.placeId && <span className={styles.placeLinked}>Привязано к месту на сайте</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.uploadRow}>
                  <button
                    type="button"
                    className={styles.uploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={items.length >= MAX_FILES}
                  >
                    <Upload size={18} />
                    <span>{items.length ? 'Добавить ещё' : 'Выбрать фотографии'}</span>
                  </button>
                  {items.length > 1 && (
                    <button type="button" className={styles.linkBtn} onClick={applyAuthorToAll}>
                      Применить автора ко всем
                    </button>
                  )}
                  <span className={styles.hint}>До {MAX_FILES} фото, каждое до 40 МБ</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFilesSelect}
                  />
                </div>
              </div>

              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>{CONSENT_TEXT}</span>
              </label>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.submitRow}>
                <button type="submit" className={styles.primaryBtn} disabled={!canSubmit}>
                  {progress
                    ? `Загрузка ${progress.current} из ${progress.total}`
                    : isSaving ? 'Отправка...' : 'Отправить на проверку'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
