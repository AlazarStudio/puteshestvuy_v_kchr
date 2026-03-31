'use client';

import { X, Calendar, User, Phone, Mail, MapPin, Tag, Clock } from 'lucide-react';
import styles from './Modal.module.css';

function formatSurnameInitials(fullName) {
  const raw = (fullName || '').trim();
  if (!raw) return '—';
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];

  const looksLikeSurname = (s) => /(?:ов|ев|ёв|ин|ына|ина|ский|цкий|ская|цкая|ова|ева|ёва|ая|яя)$/i.test(String(s || '').trim());

  let surname = '';
  let name = '';
  let patronymic = '';

  if (parts.length >= 3) {
    if (looksLikeSurname(parts[0]) && !looksLikeSurname(parts[parts.length - 1])) {
      surname = parts[0];
      name = parts[1] || '';
      patronymic = parts[2] || '';
    } else {
      surname = parts[parts.length - 1];
      name = parts[0] || '';
      patronymic = parts[1] || '';
    }
  } else {
    surname = parts[1];
    name = parts[0];
  }

  const n = name ? `${name[0].toUpperCase()}.` : '';
  const p = patronymic ? `${patronymic[0].toUpperCase()}.` : '';
  return `${surname} ${n}${p}`.trim();
}

export default function BookingDetailModal({ open, booking, onClose, onConfirm, onCancel }) {
  if (!open || !booking) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'processed':
        return <span className={`${styles.badge} ${styles.badgeActive}`}>Обработано</span>;
      case 'cancelled':
        return <span className={`${styles.badge} ${styles.badgeRejected}`}>Отменено</span>;
      default:
        return <span className={`${styles.badge} ${styles.badgePending}`}>Новое</span>;
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={styles.dialog} style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <h2 className={styles.title} style={{ margin: 0 }}>Детали бронирования</h2>
            <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Закрыть">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.reviewDetail}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className={styles.reviewDetailSection}>
                <div className={styles.reviewDetailLabel}>
                  <Clock size={16} style={{ marginRight: '8px' }} />
                  Создано
                </div>
                <div className={styles.reviewDetailValue}>{formatDateTime(booking.createdAt)}</div>
              </div>
              <div className={styles.reviewDetailSection}>
                <div className={styles.reviewDetailLabel}>Статус</div>
                <div className={styles.reviewDetailValue}>{getStatusBadge(booking.status)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className={styles.reviewDetailSection}>
                <div className={styles.reviewDetailLabel}>
                  <Calendar size={16} style={{ marginRight: '8px' }} />
                  Дата бронирования
                </div>
                <div className={styles.reviewDetailValue}>{formatDate(booking.bookingDate)}</div>
              </div>
              <div className={styles.reviewDetailSection}>
                <div className={styles.reviewDetailLabel}>
                  <MapPin size={16} style={{ marginRight: '8px' }} />
                  Направление
                </div>
                <div className={styles.reviewDetailValue}>{booking.direction || '—'}</div>
              </div>
            </div>

            <div className={styles.reviewDetailSection}>
              <div className={styles.reviewDetailLabel}>
                <User size={16} style={{ marginRight: '8px' }} />
                Контакты
              </div>
              <div className={styles.reviewDetailValue}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>Имя</div>
                    <div>{(booking.contactName || '').trim() || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={14} />
                      Телефон
                    </div>
                    <div>{booking.contactPhone || '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={14} />
                      Email
                    </div>
                    <div>{booking.contactEmail || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.reviewDetailSection}>
              <div className={styles.reviewDetailLabel}>
                <Tag size={16} style={{ marginRight: '8px' }} />
                Объект
              </div>
              <div className={styles.reviewDetailValue}>
                <div style={{ marginBottom: 4 }}>{booking.entityTitle || '—'}</div>
                <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {booking.category || booking.entityType || '—'}
                  {booking.entitySlug || booking.entityId ? (
                    <a
                      href={`/services/${booking.entitySlug || booking.entityId}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.btn}
                      style={{ padding: '6px 10px', borderRadius: 8, fontSize: '0.85rem', background: '#f1f5f9', color: '#0f172a', textDecoration: 'none' }}
                      title="Открыть страницу гида"
                    >
                      Открыть
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            {booking.comment ? (
              <div className={styles.reviewDetailSection}>
                <div className={styles.reviewDetailLabel}>Комментарий</div>
                <div className={styles.reviewDetailValue}>
                  <div className={styles.reviewText}>{booking.comment}</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.actions} style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
            {booking.status === 'new' ? (
              <>
                <button type="button" className={`${styles.btn} ${styles.btnCancel}`} onClick={() => onCancel?.()}>
                  Отменить
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => onConfirm?.()}
                >
                  Подтвердить
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

