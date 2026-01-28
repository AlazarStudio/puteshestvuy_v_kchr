'use client';

import { useState, useEffect } from 'react';
import { Star, Check, X, Trash2, Map, MapPin, Building2 } from 'lucide-react';
import { reviewsAPI } from '@/lib/api';
import styles from '../admin.module.css';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filter, setFilter] = useState('all');

  const fetchReviews = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await reviewsAPI.getAll({ page, limit: 10, status: filter !== 'all' ? filter : undefined });
      setReviews(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Ошибка загрузки отзывов:', error);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const handleApprove = async (id) => {
    try {
      await reviewsAPI.update(id, { status: 'approved' });
      fetchReviews(pagination.page);
    } catch (error) {
      console.error('Ошибка одобрения:', error);
      alert('Ошибка одобрения отзыва');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Вы уверены, что хотите отклонить этот отзыв?')) return;
    
    try {
      await reviewsAPI.update(id, { status: 'rejected' });
      fetchReviews(pagination.page);
    } catch (error) {
      console.error('Ошибка отклонения:', error);
      alert('Ошибка отклонения отзыва');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;
    
    try {
      await reviewsAPI.delete(id);
      fetchReviews(pagination.page);
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления отзыва');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        size={14} 
        fill={i < rating ? '#f59e0b' : 'none'} 
        color={i < rating ? '#f59e0b' : '#d1d5db'} 
      />
    ));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className={`${styles.badge} ${styles.active}`}>Одобрен</span>;
      case 'rejected':
        return <span className={`${styles.badge} ${styles.inactive}`}>Отклонён</span>;
      default:
        return <span className={`${styles.badge} ${styles.pending}`}>На модерации</span>;
    }
  };

  const getEntityIcon = (type) => {
    switch (type) {
      case 'route': return <Map size={16} />;
      case 'place': return <MapPin size={16} />;
      case 'service': return <Building2 size={16} />;
      default: return null;
    }
  };

  const getEntityLabel = (type) => {
    switch (type) {
      case 'route': return 'Маршрут';
      case 'place': return 'Место';
      case 'service': return 'Услуга';
      default: return type;
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Модерация отзывов</h1>
      </div>

      <div className={styles.searchBar}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.formSelect}
          style={{ maxWidth: '200px' }}
        >
          <option value="all">Все отзывы</option>
          <option value="pending">На модерации</option>
          <option value="approved">Одобренные</option>
          <option value="rejected">Отклонённые</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>Загрузка...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.icon}><Star size={48} /></div>
            <h3>Отзывы не найдены</h3>
            <p>Пока нет отзывов для модерации</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Автор</th>
                <th>Тип</th>
                <th>Объект</th>
                <th>Рейтинг</th>
                <th>Текст</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={review.authorAvatar || '/no-avatar.png'}
                        alt={review.authorName}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span>{review.authorName}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getEntityIcon(review.entityType)}
                      {getEntityLabel(review.entityType)}
                    </div>
                  </td>
                  <td>{review.entityTitle || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {renderStars(review.rating)}
                    </div>
                  </td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {review.text}
                  </td>
                  <td>{formatDate(review.createdAt)}</td>
                  <td>{getStatusBadge(review.status)}</td>
                  <td className={styles.actions}>
                    {review.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(review.id)}
                          className={styles.viewBtn}
                          title="Одобрить"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleReject(review.id)}
                          className={styles.editBtn}
                          title="Отклонить"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      className={styles.deleteBtn}
                      title="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => fetchReviews(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={styles.pageBtn}
          >
            Назад
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => fetchReviews(page)}
              className={`${styles.pageBtn} ${pagination.page === page ? styles.active : ''}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => fetchReviews(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className={styles.pageBtn}
          >
            Вперёд
          </button>
        </div>
      )}
    </div>
  );
}
