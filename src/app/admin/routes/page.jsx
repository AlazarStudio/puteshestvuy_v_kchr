'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Map, Eye, EyeOff, Filter } from 'lucide-react';
import { routesAPI, getImageUrl } from '@/lib/api';
import { ConfirmModal, AlertModal, RouteFiltersModal } from '../components';
import styles from '../admin.module.css';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });
  const [togglingId, setTogglingId] = useState(null);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const searchDebounceRef = useRef(null);

  const MIN_LOADING_MS = 500;

  const fetchRoutes = async (page = 1) => {
    const start = Date.now();
    setIsLoading(true);
    try {
      const response = await routesAPI.getAll({ page, limit: 10, search: searchQuery });
      setRoutes(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Ошибка загрузки маршрутов:', error);
      setRoutes([]);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    }
  };

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchRoutes(1);
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const handleDeleteClick = (id) => {
    setConfirmModal({
      title: 'Удалить маршрут?',
      message: 'Вы уверены, что хотите удалить этот маршрут? Действие нельзя отменить.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await routesAPI.delete(id);
          setConfirmModal(null);
          fetchRoutes(pagination.page);
        } catch (error) {
          console.error('Ошибка удаления:', error);
          setConfirmModal(null);
          setAlertModal({ open: true, title: 'Ошибка', message: 'Ошибка удаления маршрута' });
        }
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const handleTogglePublish = async (route) => {
    const nextActive = !route.isActive;
    setTogglingId(route.id);
    try {
      await routesAPI.update(route.id, { isActive: nextActive });
      setRoutes((prev) =>
        prev.map((r) => (r.id === route.id ? { ...r, isActive: nextActive } : r))
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
        <h1 className={styles.pageTitle}>Маршруты</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setFiltersModalOpen(true)}
            className={styles.filtersBtn}
            title="Управление фильтрами"
          >
            <Filter size={18} /> Фильтры
          </button>
          <Link to="/admin/routes/new" className={styles.addBtn}>
            <Plus size={18} /> Добавить маршрут
          </Link>
        </div>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchWrap}>
          <input
            type="text"
            placeholder="Поиск маршрутов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Поиск маршрутов"
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
        ) : routes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.icon}><Map size={48} /></div>
            <h3>Маршруты не найдены</h3>
            <p>Создайте первый маршрут</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Название</th>
                <th>Сезон</th>
                <th>Сложность</th>
                <th>Расстояние</th>
                <th>Видимость</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id}>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      <img
                        src={getImageUrl(route.images?.[0])}
                        alt={route.title}
                        className={styles.tableImage}
                      />
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>{route.title}</div>
                  </td>
                  {/* Сезон, сложность, расстояние — из полей маршрута; сезон: все из customFilters.seasons, иначе route.season */}
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      {Array.isArray(route.customFilters?.seasons) && route.customFilters.seasons.length > 0
                        ? route.customFilters.seasons.join(', ')
                        : (route.season ?? '—')}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      {route.difficulty != null ? `${route.difficulty}` : '—'}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      {route.distance != null && route.distance !== '' ? `${route.distance} км` : '—'}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      <span className={`${styles.badge} ${styles[route.isActive ? 'active' : 'inactive']}`}>
                        {route.isActive ? 'Включено' : 'Скрыто'}
                      </span>
                    </div>
                  </td>
                  <td className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <div className={styles.cellInner}>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(route)}
                          disabled={togglingId === route.id}
                          className={route.isActive ? styles.deleteBtn : styles.viewBtn}
                          title={route.isActive ? 'Скрыть' : 'Показать'}
                          aria-label={route.isActive ? 'Скрыть' : 'Показать'}
                        >
                          {route.isActive ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <Link to={`/admin/routes/${route.id}`} className={styles.editBtn} title="Редактировать">
                          <Pencil size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(route.id)}
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
            onClick={() => fetchRoutes(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={styles.pageBtn}
          >
            Назад
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => fetchRoutes(page)}
              className={`${styles.pageBtn} ${pagination.page === page ? styles.active : ''}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => fetchRoutes(pagination.page + 1)}
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
      <RouteFiltersModal open={filtersModalOpen} onClose={() => setFiltersModalOpen(false)} />
    </div>
  );
}
