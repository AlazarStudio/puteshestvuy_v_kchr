'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, MapPin, Star, Eye, EyeOff, Filter } from 'lucide-react';
import { placesAPI, getImageUrl } from '@/lib/api';
import { ConfirmModal, AlertModal, PlaceFiltersModal } from '../components';
import styles from '../admin.module.css';

export default function PlacesPage() {
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });
  const [togglingId, setTogglingId] = useState(null);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const searchDebounceRef = useRef(null);

  const MIN_LOADING_MS = 500;

  const fetchPlaces = async (page = 1) => {
    const start = Date.now();
    setIsLoading(true);
    try {
      const response = await placesAPI.getAll({ page, limit: 10, search: searchQuery });
      setPlaces(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Ошибка загрузки мест:', error);
      setPlaces([]);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    }
  };

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchPlaces(1);
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const handleDeleteClick = (id) => {
    setConfirmModal({
      title: 'Удалить место?',
      message: 'Вы уверены, что хотите удалить это место? Действие нельзя отменить.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await placesAPI.delete(id);
          setConfirmModal(null);
          fetchPlaces(pagination.page);
        } catch (error) {
          console.error('Ошибка удаления:', error);
          setConfirmModal(null);
          setAlertModal({ open: true, title: 'Ошибка', message: 'Ошибка удаления места' });
        }
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const handleTogglePublish = async (place) => {
    const nextActive = !place.isActive;
    setTogglingId(place.id);
    try {
      await placesAPI.update(place.id, { isActive: nextActive });
      setPlaces((prev) =>
        prev.map((p) => (p.id === place.id ? { ...p, isActive: nextActive } : p))
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
        <h1 className={styles.pageTitle}>Места</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setFiltersModalOpen(true)}
            className={styles.filtersBtn}
            title="Управление фильтрами"
          >
            <Filter size={18} /> Фильтры
          </button>
          <Link href="/admin/places/new" className={styles.addBtn}>
            <Plus size={18} /> Добавить место
          </Link>
        </div>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchWrap}>
          <input
            type="text"
            placeholder="Поиск мест..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Поиск мест"
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
        ) : places.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.icon}><MapPin size={48} /></div>
            <h3>Места не найдены</h3>
            <p>Добавьте первое место</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Название</th>
                <th>Локация</th>
                <th>Рейтинг</th>
                <th>Видимость</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {places.map((place) => (
                <tr key={place.id}>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      <img
                        src={getImageUrl(place.image)}
                        alt={place.title}
                        className={styles.tableImage}
                      />
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>{place.title}</div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>{place.location}</div>
                  </td>
                  <td className={`${styles.tableCell} ${styles.ratingCell}`}>
                    <div className={styles.cellInner}>
                      {place.rating != null && place.rating !== '' ? (
                        <>
                          <Star size={14} />
                          <span>{Number(place.rating)}</span>
                          <span className={styles.ratingReviews}>({place.reviewsCount ?? 0})</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      <span className={`${styles.badge} ${styles[place.isActive ? 'active' : 'inactive']}`}>
                        {place.isActive ? 'Включено' : 'Скрыто'}
                      </span>
                    </div>
                  </td>
                  <td className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <div className={styles.cellInner}>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(place)}
                        disabled={togglingId === place.id}
                        className={place.isActive ? styles.deleteBtn : styles.viewBtn}
                        title={place.isActive ? 'Скрыть' : 'Показать'}
                        aria-label={place.isActive ? 'Скрыть' : 'Показать'}
                      >
                        {place.isActive ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                      <Link href={`/admin/places/${place.id}`} className={styles.editBtn} title="Редактировать">
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(place.id)}
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
            onClick={() => fetchPlaces(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={styles.pageBtn}
          >
            Назад
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => fetchPlaces(page)}
              className={`${styles.pageBtn} ${pagination.page === page ? styles.active : ''}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => fetchPlaces(pagination.page + 1)}
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
      <PlaceFiltersModal open={filtersModalOpen} onClose={() => setFiltersModalOpen(false)} />
    </div>
  );
}
