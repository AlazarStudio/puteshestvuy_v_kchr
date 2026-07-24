import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Trash2, Download, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminGalleryAPI, getImageUrl } from '@/lib/api'
import { downloadFile } from '@/lib/utils'
import { GALLERY_STATUS_COLORS, GALLERY_STATUS_LABELS_ADMIN } from '@/lib/galleryStatus'
import ConfirmModal from '../components/ConfirmModal'
import styles from '../admin.module.css'
import galleryStyles from './gallery.module.css'

const STATUS_TABS = [
  { value: 'pending', label: 'Ожидают' },
  { value: 'approved', label: 'Опубликованы' },
  { value: 'rejected', label: 'Отклонены' },
  { value: '', label: 'Все' },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminGalleryPage() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1, limit: 24 })
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({ authorCaption: '', placeCaption: '' })
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectComment, setRejectComment] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async (page = 1, status = statusFilter) => {
    setLoading(true)
    try {
      const { data } = await adminGalleryAPI.getAll({ page, limit: 24, status: status || undefined })
      const nextPagination = data.pagination || { page: 1, total: 0, pages: 1, limit: 24 }
      // после модерации последнего элемента страница может исчезнуть — откатываемся назад
      if (page > 1 && (data.items || []).length === 0 && nextPagination.pages < page) {
        setLoading(false)
        return load(page - 1, status)
      }
      setItems(data.items || [])
      setPagination(nextPagination)
      setSelectedIds([])
      setEditingId(null)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load(1, statusFilter) }, [statusFilter])

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const selectAllOnPage = () => setSelectedIds(items.map((item) => item.id))

  const setStatus = async (id, status, adminComment) => {
    try {
      await adminGalleryAPI.update(id, { status, ...(adminComment !== undefined ? { adminComment } : {}) })
      showToast(status === 'approved' ? 'Фотография опубликована' : 'Фотография отклонена')
      load(pagination.page)
      return true
    } catch {
      showToast('Ошибка при сохранении')
      return false
    }
  }

  const bulkSetStatus = async (status) => {
    try {
      const { data } = await adminGalleryAPI.bulkUpdate(selectedIds, status)
      showToast(`Обновлено фотографий: ${data.updated}`)
      load(pagination.page)
    } catch {
      showToast('Ошибка при массовом изменении')
    }
  }

  const confirmBulk = (status) => {
    const isApprove = status === 'approved'
    setConfirmModal({
      title: isApprove ? 'Опубликовать выбранные фотографии?' : 'Отклонить выбранные фотографии?',
      message: isApprove
        ? `Фотографий будет опубликовано: ${selectedIds.length}. Они сразу появятся в фотобанке региона.`
        : `Фотографий будет отклонено: ${selectedIds.length}.`,
      confirmLabel: isApprove ? 'Опубликовать' : 'Отклонить',
      variant: isApprove ? 'default' : 'danger',
      onConfirm: () => {
        setConfirmModal(null)
        bulkSetStatus(status)
      },
      onCancel: () => setConfirmModal(null),
    })
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditDraft({ authorCaption: item.authorCaption, placeCaption: item.placeCaption })
  }

  const saveEdit = async (id) => {
    if (!editDraft.authorCaption.trim() || !editDraft.placeCaption.trim()) {
      showToast('Подписи не могут быть пустыми')
      return
    }
    try {
      await adminGalleryAPI.update(id, editDraft)
      setEditingId(null)
      showToast('Подписи сохранены')
      load(pagination.page)
    } catch {
      showToast('Ошибка при сохранении подписей')
    }
  }

  const handleDelete = (id) => {
    setConfirmModal({
      title: 'Удалить фотографию?',
      message: 'Файл будет удалён с сервера без возможности восстановления.',
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await adminGalleryAPI.delete(id)
          showToast('Фотография удалена')
          load(pagination.page)
        } catch {
          showToast('Ошибка при удалении')
        }
      },
      onCancel: () => setConfirmModal(null),
    })
  }

  const submitReject = async () => {
    const ok = await setStatus(rejectTarget, 'rejected', rejectComment)
    if (!ok) return
    setRejectTarget(null)
    setRejectComment('')
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Фотогалерея</h1>
          <p className={styles.pageSubtitle}>Модерация фотобанка региона</p>
        </div>
      </div>

      <div className={galleryStyles.filters}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            onClick={() => setStatusFilter(tab.value)}
            className={`${galleryStyles.filterBtn} ${statusFilter === tab.value ? galleryStyles.filterBtnActive : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className={galleryStyles.bulkBar}>
          <span>Выбрано: {selectedIds.length}</span>
          <button className={galleryStyles.approveBtn} onClick={() => confirmBulk('approved')}>
            <CheckCircle size={15} /> Опубликовать
          </button>
          <button className={galleryStyles.rejectBtn} onClick={() => confirmBulk('rejected')}>
            <XCircle size={15} /> Отклонить
          </button>
          <button className={galleryStyles.plainBtn} onClick={selectAllOnPage}>Выбрать все на странице</button>
          <button className={galleryStyles.plainBtn} onClick={() => setSelectedIds([])}>Снять выделение</button>
        </div>
      )}

      {loading ? (
        <div className={galleryStyles.emptyState}>Загрузка...</div>
      ) : items.length === 0 ? (
        <div className={galleryStyles.emptyState}>Фотографий нет</div>
      ) : (
        <div className={galleryStyles.grid}>
          {items.map((item) => (
            <div key={item.id} className={galleryStyles.card}>
              <div className={galleryStyles.cardImgWrap}>
                <img src={getImageUrl(item.url)} alt="" className={galleryStyles.cardImg} />
                <label className={galleryStyles.cardCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    aria-label={`Выбрать фотографию: ${item.placeCaption}`}
                  />
                </label>
                <span
                  className={galleryStyles.statusBadge}
                  style={{ background: GALLERY_STATUS_COLORS[item.status] + '20', color: GALLERY_STATUS_COLORS[item.status] }}
                >
                  {GALLERY_STATUS_LABELS_ADMIN[item.status] || item.status}
                </span>
              </div>

              <div className={galleryStyles.cardBody}>
                {editingId === item.id ? (
                  <div className={galleryStyles.editForm}>
                    <input
                      className={galleryStyles.editInput}
                      value={editDraft.placeCaption}
                      onChange={(e) => setEditDraft((p) => ({ ...p, placeCaption: e.target.value }))}
                      placeholder="Место"
                    />
                    <input
                      className={galleryStyles.editInput}
                      value={editDraft.authorCaption}
                      onChange={(e) => setEditDraft((p) => ({ ...p, authorCaption: e.target.value }))}
                      placeholder="Автор"
                    />
                    <div className={galleryStyles.editActions}>
                      <button className={galleryStyles.approveBtn} onClick={() => saveEdit(item.id)}>Сохранить</button>
                      <button className={galleryStyles.plainBtn} onClick={() => setEditingId(null)}>Отмена</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={galleryStyles.cardPlace}>{item.placeCaption}</div>
                    <div className={galleryStyles.cardAuthor}>Автор: {item.authorCaption}</div>
                  </>
                )}

                <div className={galleryStyles.cardMeta}>
                  <span>{item.uploaderName || item.uploaderEmail || '—'}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>

                {item.status === 'rejected' && item.adminComment && (
                  <div className={galleryStyles.adminComment}>{item.adminComment}</div>
                )}

                <div className={galleryStyles.cardActions}>
                  {item.status !== 'approved' && (
                    <button className={galleryStyles.approveBtn} onClick={() => setStatus(item.id, 'approved', null)}>
                      <CheckCircle size={14} /> Опубликовать
                    </button>
                  )}
                  {item.status !== 'rejected' && (
                    <button className={galleryStyles.rejectBtn} onClick={() => setRejectTarget(item.id)}>
                      <XCircle size={14} /> Отклонить
                    </button>
                  )}
                  <button className={galleryStyles.iconBtn} onClick={() => startEdit(item)} title="Изменить подписи" aria-label="Изменить подписи">
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className={galleryStyles.iconBtn}
                    onClick={() => downloadFile(getImageUrl(item.url), item.filename)}
                    title="Скачать"
                    aria-label="Скачать фотографию"
                  >
                    <Download size={14} />
                  </button>
                  <button className={galleryStyles.iconBtnDanger} onClick={() => handleDelete(item.id)} title="Удалить" aria-label="Удалить фотографию">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className={galleryStyles.pagination}>
          <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span>{pagination.page} / {pagination.pages}</span>
          <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {rejectTarget && (
        <div className={galleryStyles.modalOverlay} onClick={() => setRejectTarget(null)}>
          <div
            className={galleryStyles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-photo-title"
          >
            <h3 id="reject-photo-title" className={galleryStyles.modalTitle}>Отклонить фотографию</h3>
            <p className={galleryStyles.modalDesc}>Укажите причину отклонения (необязательно):</p>
            <textarea
              className={galleryStyles.modalTextarea}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Причина отклонения..."
              rows={4}
            />
            <div className={galleryStyles.modalActions}>
              <button className={galleryStyles.rejectBtn} onClick={submitReject}>Отклонить</button>
              <button className={galleryStyles.plainBtn} onClick={() => setRejectTarget(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}

      <ConfirmModal
        open={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        variant={confirmModal?.variant || 'danger'}
        confirmLabel={confirmModal?.confirmLabel || 'Удалить'}
        cancelLabel="Отмена"
        onConfirm={confirmModal?.onConfirm}
        onCancel={confirmModal?.onCancel}
      />
    </div>
  )
}
