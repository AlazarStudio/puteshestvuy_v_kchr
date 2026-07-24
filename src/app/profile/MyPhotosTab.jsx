import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Trash2 } from 'lucide-react'
import { galleryAPI, getImageUrl } from '@/lib/api'
import { GALLERY_STATUS_COLORS, GALLERY_STATUS_LABELS_USER } from '@/lib/galleryStatus'
import { useToast } from '@/contexts/ToastContext'
import UploadPhotoModal from '@/components/UploadPhotoModal'
import { ConfirmModal } from '@/app/admin/components'
import styles from './profile.module.css'

export default function MyPhotosTab() {
  const { showToast } = useToast()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await galleryAPI.getMy()
      setPhotos(Array.isArray(data) ? data : [])
    } catch {
      setError('Не удалось загрузить ваши фотографии. Попробуйте обновить страницу')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    const id = deleteTarget
    setDeleteTarget(null)
    try {
      await galleryAPI.delete(id)
      showToast('Фотография удалена')
      load()
    } catch {
      showToast('Ошибка при удалении')
    }
  }

  return (
    <div className={styles.photosTab}>
      <div className={styles.photosHead}>
        <div className={styles.photosHeadText}>
          Ваши фотографии в фотобанке региона. Опубликованные видны всем на странице{' '}
          <Link to="/gallery" className={styles.photosLink}>фотогалереи</Link>.
        </div>
        <button type="button" className={styles.photosUploadBtn} onClick={() => setUploadOpen(true)}>
          <Upload size={18} />
          <span>Загрузить фото</span>
        </button>
      </div>

      {loading ? (
        <div className={styles.photosEmpty}>Загрузка...</div>
      ) : error ? (
        <div className={styles.photosEmpty}>{error}</div>
      ) : photos.length === 0 ? (
        <div className={styles.photosEmpty}>
          Вы ещё не загружали фотографии. Добавьте свои снимки Карачаево-Черкесии в фотобанк региона.
        </div>
      ) : (
        <div className={styles.photosGrid}>
          {photos.map((photo) => (
            <div key={photo.id} className={styles.photoCard}>
              <div className={styles.photoImgWrap}>
                <img src={getImageUrl(photo.url)} alt={photo.placeCaption || ''} loading="lazy" />
                <span
                  className={styles.photoStatus}
                  style={{ background: GALLERY_STATUS_COLORS[photo.status] + '20', color: GALLERY_STATUS_COLORS[photo.status] }}
                >
                  {GALLERY_STATUS_LABELS_USER[photo.status] || photo.status}
                </span>
              </div>
              <div className={styles.photoBody}>
                <div className={styles.photoPlace}>{photo.placeCaption}</div>
                <div className={styles.photoAuthor}>Автор: {photo.authorCaption}</div>
                {photo.status === 'rejected' && photo.adminComment && (
                  <div className={styles.photoComment}>{photo.adminComment}</div>
                )}
                <button
                  type="button"
                  className={styles.photoDeleteBtn}
                  onClick={() => setDeleteTarget(photo.id)}
                >
                  <Trash2 size={14} />
                  <span>Удалить</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadPhotoModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={load}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Удалить фотографию?"
        message="Фотография будет удалена из фотобанка без возможности восстановления."
        variant="danger"
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
