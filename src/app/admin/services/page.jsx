'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Building2, Star, Eye, EyeOff } from 'lucide-react';
import { servicesAPI, getImageUrl } from '@/lib/api';
import { ConfirmModal, AlertModal } from '../components';
import styles from '../admin.module.css';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });
  const [togglingId, setTogglingId] = useState(null);
  const searchDebounceRef = useRef(null);

  const MIN_LOADING_MS = 500;

  const fetchServices = async (page = 1) => {
    const start = Date.now();
    setIsLoading(true);
    try {
      const response = await servicesAPI.getAll({ page, limit: 10, search: searchQuery });
      setServices(response.data.items ?? []);
      setPagination(response.data.pagination ?? { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
      setServices([]);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    }
  };

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchServices(1);
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const handleDeleteClick = (id) => {
    setConfirmModal({
      title: 'Удалить услугу?',
      message: 'Вы уверены, что хотите удалить эту услугу? Действие нельзя отменить.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await servicesAPI.delete(id);
          setConfirmModal(null);
          fetchServices(pagination.page);
        } catch (error) {
          console.error('Ошибка удаления:', error);
          setConfirmModal(null);
          setAlertModal({ open: true, title: 'Ошибка', message: 'Ошибка удаления услуги' });
        }
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const handleTogglePublish = async (service) => {
    const nextActive = !service.isActive;
    setTogglingId(service.id);
    try {
      await servicesAPI.update(service.id, { isActive: nextActive });
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: nextActive } : s))
      );
    } catch (error) {
      console.error('Ошибка изменения видимости:', error);
      setAlertModal({
        open: true,
        title: 'Ошибка',
        message: 'Не удалось изменить видимость',
      });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Услуги</h1>
        <Link to="/admin/services/new" className={styles.addBtn}>
          <Plus size={18} /> Добавить услугу
        </Link>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchWrap}>
          <input
            type="text"
            placeholder="Поиск услуг..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Поиск услуг"
          />
          <Search size={18} className={styles.searchIcon} aria-hidden />
        </div>
      </div>

      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>Загрузка...</p>
          </div>
        ) : services.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.icon}><Building2 size={48} /></div>
            <h3>Услуги не найдены</h3>
            <p>Добавьте первую услугу</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Рейтинг</th>
                <th>Видимость</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      <img
                        src={getImageUrl(service.images?.[0])}
                        alt={service.title}
                        className={styles.tableImage}
                      />
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>{service.title}</div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      <span className={`${styles.badge} ${styles.pending}`}>
                        {service.category || '—'}
                      </span>
                    </div>
                  </td>
                  <td className={`${styles.tableCell} ${styles.ratingCell}`}>
                    <div className={styles.cellInner}>
                      {service.rating != null && service.rating !== '' ? (
                        <>
                          <Star size={14} />
                          <span>{Number(service.rating)}</span>
                          <span className={styles.ratingReviews}>({service.reviewsCount ?? 0})</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      <span className={`${styles.badge} ${styles[service.isActive ? 'active' : 'inactive']}`}>
                        {service.isActive ? 'Включено' : 'Скрыто'}
                      </span>
                    </div>
                  </td>
                  <td className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <div className={styles.cellInner}>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(service)}
                          disabled={togglingId === service.id}
                          className={service.isActive ? styles.deleteBtn : styles.viewBtn}
                          title={service.isActive ? 'Скрыть' : 'Показать'}
                          aria-label={service.isActive ? 'Скрыть' : 'Показать'}
                        >
                          {service.isActive ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <Link to={`/admin/services/${service.id}`} className={styles.editBtn} title="Редактировать">
                          <Pencil size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(service.id)}
                          className={styles.deleteBtn}
                          title="Удалить"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
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
            onClick={() => fetchServices(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={styles.pageBtn}
          >
            Назад
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => fetchServices(page)}
              className={`${styles.pageBtn} ${pagination.page === page ? styles.active : ''}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => fetchServices(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className={styles.pageBtn}
          >
            Вперёд
          </button>
        </div>
      )}

      <ConfirmModal
        open={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmLabel={confirmModal?.confirmLabel}
        cancelLabel={confirmModal?.cancelLabel}
        variant={confirmModal?.variant}
        onConfirm={confirmModal?.onConfirm}
        onCancel={confirmModal?.onCancel}
      />
      <AlertModal
        open={alertModal.open}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ open: false, title: '', message: '' })}
      />
    </div>
  );
}
