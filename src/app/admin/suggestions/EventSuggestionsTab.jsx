import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminEventSuggestionsAPI, getImageUrl } from '@/lib/api'
import ConfirmModal from '../components/ConfirmModal'
import RichTextContent from '@/components/RichTextContent'
import styles from '../admin.module.css'
import suggestionStyles from './suggestions.module.css'

const STATUS_LABELS = { pending: 'Ожидает', in_review: 'На проверке', approved: 'Одобрено', rejected: 'Отклонено' }
const STATUS_COLORS = { pending: '#f59e0b', in_review: '#3b82f6', approved: '#10b981', rejected: '#ef4444' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function EventSuggestionsTab() {
  const navigate = useNavigate()

  const [suggestions, setSuggestions] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1, limit: 20 })
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async (page = 1, status = statusFilter) => {
    setLoading(true)
    try {
      const { data } = await adminEventSuggestionsAPI.getAll({ page, limit: 20, status: status || undefined })
      setSuggestions(data.items || [])
      setPagination(data.pagination || { page: 1, total: 0, pages: 1, limit: 20 })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load(1, statusFilter) }, [statusFilter])

  const openDetail = async (id) => {
    setSelectedId(id)
    setDetailLoading(true)
    try {
      const { data } = await adminEventSuggestionsAPI.getById(id)
      setSelected(data)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => { setSelectedId(null); setSelected(null) }

  const handleApprove = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      const { data } = await adminEventSuggestionsAPI.approve(selected.id)
      showToast('Событие создано как черновик — примите решение в редакторе')
      closeDetail()
      load(pagination.page)
      navigate(`/admin/events/${data.eventId}?suggestionId=${selected.id}`)
    } catch {
      showToast('Ошибка при одобрении')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await adminEventSuggestionsAPI.update(selected.id, { status: 'rejected', adminComment: rejectComment })
      showToast('Заявка отклонена')
      setRejectModalOpen(false)
      setRejectComment('')
      closeDetail()
      load(pagination.page)
    } catch {
      showToast('Ошибка при отклонении')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = (id) => {
    setConfirmModal({
      title: 'Удалить заявку?',
      message: 'Заявка будет удалена без возможности восстановления.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await adminEventSuggestionsAPI.delete(id)
          showToast('Заявка удалена')
          if (selectedId === id) closeDetail()
          load(pagination.page)
        } catch {
          showToast('Ошибка при удалении')
        }
      },
      onCancel: () => setConfirmModal(null),
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Предложения событий</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['pending', 'in_review', 'approved', 'rejected', ''].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`${suggestionStyles.filterBtn} ${statusFilter === s ? suggestionStyles.filterBtnActive : ''}`}
            >
              {s === '' ? 'Все' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* List */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div className={suggestionStyles.emptyState}>Загрузка...</div>
          ) : suggestions.length === 0 ? (
            <div className={suggestionStyles.emptyState}>Заявок нет</div>
          ) : (
            <div className={suggestionStyles.list}>
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className={`${suggestionStyles.card} ${selectedId === s.id ? suggestionStyles.cardSelected : ''}`}
                  onClick={() => openDetail(s.id)}
                >
                  {s.image && (
                    <img src={getImageUrl(s.image)} alt="" className={suggestionStyles.cardThumb} />
                  )}
                  <div className={suggestionStyles.cardBody}>
                    <div className={suggestionStyles.cardTitle}>{s.title}</div>
                    {s.location && <div className={suggestionStyles.cardMeta}>{s.location}</div>}
                    <div className={suggestionStyles.cardFooter}>
                      <span className={suggestionStyles.cardDate}>{formatDate(s.createdAt)}</span>
                      <span className={suggestionStyles.cardAuthor}>{s.submitterName || s.submitterEmail || '—'}</span>
                      <span className={suggestionStyles.statusBadge} style={{ background: STATUS_COLORS[s.status] + '20', color: STATUS_COLORS[s.status] }}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </div>
                  </div>
                  <button
                    className={suggestionStyles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id) }}
                    title="Удалить"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className={suggestionStyles.pagination}>
              <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>
                <ChevronLeft size={16} />
              </button>
              <span>{pagination.page} / {pagination.pages}</span>
              <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedId && (
          <div className={suggestionStyles.detail}>
            {detailLoading || !selected ? (
              <div className={suggestionStyles.emptyState}>Загрузка...</div>
            ) : (
              <>
                <div className={suggestionStyles.detailHeader}>
                  <h2 className={suggestionStyles.detailTitle}>{selected.title}</h2>
                  <span className={suggestionStyles.statusBadge} style={{ background: STATUS_COLORS[selected.status] + '20', color: STATUS_COLORS[selected.status] }}>
                    {STATUS_LABELS[selected.status] || selected.status}
                  </span>
                </div>

                {selected.image && (
                  <img src={getImageUrl(selected.image)} alt="" className={suggestionStyles.detailImage} />
                )}

                <div className={suggestionStyles.detailMeta}>
                  <div><strong>Автор:</strong> {selected.submitterName || '—'}</div>
                  <div><strong>Email:</strong> {selected.submitterEmail || '—'}</div>
                  <div><strong>Дата заявки:</strong> {formatDate(selected.createdAt)}</div>
                  <div><strong>Начало:</strong> {formatDateTime(selected.startAt)}</div>
                  {selected.endAt && <div><strong>Окончание:</strong> {formatDateTime(selected.endAt)}</div>}
                  {selected.location && <div><strong>Локация:</strong> {selected.location}</div>}
                  {selected.organizer && <div><strong>Организатор:</strong> {selected.organizer}</div>}
                  {selected.price && <div><strong>Стоимость:</strong> {selected.price}</div>}
                  {selected.registrationUrl && (
                    <div>
                      <strong>Регистрация:</strong>{' '}
                      <a href={selected.registrationUrl} target="_blank" rel="noopener noreferrer">
                        {selected.registrationUrl}
                      </a>
                    </div>
                  )}
                </div>

                {selected.shortDescription && (
                  <div className={suggestionStyles.detailSection}>
                    <div className={suggestionStyles.detailSectionLabel}>Краткое описание</div>
                    <RichTextContent className={suggestionStyles.detailText} html={selected.shortDescription} />
                  </div>
                )}

                {selected.description && (
                  <div className={suggestionStyles.detailSection}>
                    <div className={suggestionStyles.detailSectionLabel}>Описание</div>
                    <RichTextContent className={suggestionStyles.detailText} html={selected.description} />
                  </div>
                )}

                {selected.adminComment && (
                  <div className={suggestionStyles.adminComment}>
                    <strong>Комментарий администратора:</strong> {selected.adminComment}
                  </div>
                )}

                {selected.status === 'pending' && (
                  <div className={suggestionStyles.detailActions}>
                    <button
                      className={suggestionStyles.approveBtn}
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      <CheckCircle size={16} />
                      Открыть в редакторе
                    </button>
                    <button
                      className={suggestionStyles.rejectBtn}
                      onClick={() => setRejectModalOpen(true)}
                      disabled={actionLoading}
                    >
                      <XCircle size={16} />
                      Отклонить
                    </button>
                  </div>
                )}

                {selected.status === 'in_review' && selected.approvedEventId && (
                  <div className={suggestionStyles.detailActions}>
                    <button
                      className={suggestionStyles.approveBtn}
                      onClick={() => navigate(`/admin/events/${selected.approvedEventId}?suggestionId=${selected.id}`)}
                    >
                      <Eye size={16} />
                      Открыть в редакторе
                    </button>
                  </div>
                )}

                {selected.status === 'approved' && selected.approvedEventId && (
                  <div className={suggestionStyles.detailActions}>
                    <button
                      className={suggestionStyles.approveBtn}
                      onClick={() => navigate(`/admin/events/${selected.approvedEventId}`)}
                    >
                      <Eye size={16} />
                      Открыть событие
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModalOpen && (
        <div className={suggestionStyles.modalOverlay} onClick={() => setRejectModalOpen(false)}>
          <div className={suggestionStyles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={suggestionStyles.modalTitle}>Отклонить заявку</h3>
            <p className={suggestionStyles.modalDesc}>Укажите причину отклонения (необязательно):</p>
            <textarea
              className={suggestionStyles.modalTextarea}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Причина отклонения..."
              rows={4}
            />
            <div className={suggestionStyles.modalActions}>
              <button className={suggestionStyles.rejectBtn} onClick={handleReject} disabled={actionLoading}>
                Отклонить
              </button>
              <button className={suggestionStyles.cancelBtn} onClick={() => setRejectModalOpen(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}

      <ConfirmModal
        open={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        variant={confirmModal?.variant}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={confirmModal?.onConfirm}
        onCancel={confirmModal?.onCancel}
      />
    </div>
  )
}
