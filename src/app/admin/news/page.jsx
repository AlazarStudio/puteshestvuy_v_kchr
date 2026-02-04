'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Newspaper, Eye, EyeOff } from 'lucide-react';
import { newsAPI, getImageUrl } from '@/lib/api';
import { ConfirmModal, AlertModal } from '../components';
import styles from '../admin.module.css';

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });
  const [togglingId, setTogglingId] = useState(null);
  const searchDebounceRef = useRef(null);

  const MIN_LOADING_MS = 500;

  const fetchNews = async (page = 1) => {
    const start = Date.now();
    setIsLoading(true);
    try {
      const response = await newsAPI.getAll({ page, limit: 10, search: searchQuery });
      setNews(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Ошибка загрузки новостей:', error);
      setNews([]);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    }
  };

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchNews(1);
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const handleTogglePublish = async (item) => {
    const nextActive = !item.isActive;
    setTogglingId(item.id);
    try {
      await newsAPI.update(item.id, { isActive: nextActive });
      setNews((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isActive: nextActive } : n))
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

  const handleDeleteClick = (id) => {
    setConfirmModal({
      title: 'Удалить запись?',
      message: 'Вы уверены, что хотите удалить эту новость или статью? Действие нельзя отменить.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await newsAPI.delete(id);
          setConfirmModal(null);
          fetchNews(pagination.page);
        } catch (error) {
          console.error('Ошибка удаления:', error);
          setConfirmModal(null);
          setAlertModal({ open: true, title: 'Ошибка', message: 'Ошибка удаления записи' });
        }
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className={styles.pageHeader}>
<h1 className={styles.pageTitle}>Новости и статьи</h1>
        <Link to="/admin/news/new" className={styles.addBtn}>
            <Plus size={18} /> Добавить новость или статью
        </Link>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchWrap}>
          <input
            type="text"
            placeholder="Поиск новостей и статей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Поиск новостей и статей"
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
        ) : news.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.icon}><Newspaper size={48} /></div>
            <h3>Новости и статьи не найдены</h3>
            <p>Добавьте первую запись</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Заголовок</th>
                <th>Категория</th>
                <th>Дата</th>
                <th>Видимость</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {news.map((item) => (
                <tr key={item.id}>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.title}
                        className={styles.tableImage}
                      />
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>{item.title}</div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      <span className={`${styles.badge} ${styles.pending}`}>
                        {item.type === 'article' ? 'Статья' : 'Новость'}
                      </span>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>{formatDate(item.publishedAt)}</div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellInner}>
                      <span className={`${styles.badge} ${styles[item.isActive ? 'active' : 'inactive']}`}>
                        {item.isActive ? 'Включено' : 'Скрыто'}
                      </span>
                    </div>
                  </td>
                  <td className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <div className={styles.cellInner}>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(item)}
                          disabled={togglingId === item.id}
                          className={item.isActive ? styles.deleteBtn : styles.viewBtn}
                          title={item.isActive ? 'Скрыть' : 'Показать'}
                          aria-label={item.isActive ? 'Скрыть' : 'Показать'}
                        >
                          {item.isActive ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <Link to={`/admin/news/${item.id}`} className={styles.editBtn} title="Редактировать">
                          <Pencil size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(item.id)}
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
            onClick={() => fetchNews(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={styles.pageBtn}
          >
            Назад
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => fetchNews(page)}
              className={`${styles.pageBtn} ${pagination.page === page ? styles.active : ''}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => fetchNews(pagination.page + 1)}
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
