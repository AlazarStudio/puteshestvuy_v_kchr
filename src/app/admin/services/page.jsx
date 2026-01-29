'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Building2, Star, CheckCircle, XCircle } from 'lucide-react';
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

  const fetchServices = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await servicesAPI.getAll({ page, limit: 10, search: searchQuery });
      setServices(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

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

  const handleSearch = (e) => {
    e.preventDefault();
    fetchServices(1);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Услуги и сервисы</h1>
        <Link href="/admin/services/new" className={styles.addBtn}>
          <Plus size={18} /> Добавить услугу
        </Link>
      </div>

      <form onSubmit={handleSearch} className={styles.searchBar}>
        <input
          type="text"
          placeholder="Поиск услуг..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.filterBtn}>
          <Search size={18} /> Найти
        </button>
      </form>

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
                <th>Верификация</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>
                    <img
                      src={getImageUrl(service.image)}
                      alt={service.title}
                      className={styles.tableImage}
                    />
                  </td>
                  <td>{service.title}</td>
                  <td>
                    <span className={`${styles.badge} ${styles.pending}`}>
                      {service.category || '—'}
                    </span>
                  </td>
                  <td><Star size={14} style={{ marginRight: 4 }} /> {service.rating || '—'}</td>
                  <td>
                    {service.isVerified ? (
                      <CheckCircle size={18} color="#10b981" />
                    ) : (
                      <XCircle size={18} color="#ef4444" />
                    )}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[service.isActive ? 'active' : 'inactive']}`}>
                      {service.isActive ? 'Активна' : 'Скрыта'}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <Link href={`/admin/services/${service.id}`} className={styles.editBtn}>
                      <Pencil size={16} />
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(service.id)}
                      className={styles.deleteBtn}
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
