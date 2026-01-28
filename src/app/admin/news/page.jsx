'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Newspaper } from 'lucide-react';
import { newsAPI, getImageUrl } from '@/lib/api';
import styles from '../admin.module.css';

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNews = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await newsAPI.getAll({ page, limit: 10, search: searchQuery });
      setNews(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Ошибка загрузки новостей:', error);
      setNews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить эту новость?')) return;
    
    try {
      await newsAPI.delete(id);
      fetchNews(pagination.page);
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления новости');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNews(1);
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
        <h1 className={styles.pageTitle}>Новости</h1>
        <Link href="/admin/news/new" className={styles.addBtn}>
          <Plus size={18} /> Добавить новость
        </Link>
      </div>

      <form onSubmit={handleSearch} className={styles.searchBar}>
        <input
          type="text"
          placeholder="Поиск новостей..."
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
        ) : news.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.icon}><Newspaper size={48} /></div>
            <h3>Новости не найдены</h3>
            <p>Добавьте первую новость</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Заголовок</th>
                <th>Категория</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {news.map((item) => (
                <tr key={item.id}>
                  <td>
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className={styles.tableImage}
                    />
                  </td>
                  <td>{item.title}</td>
                  <td>
                    <span className={`${styles.badge} ${styles.pending}`}>
                      {item.category || 'Новости'}
                    </span>
                  </td>
                  <td>{formatDate(item.publishedAt)}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[item.isActive ? 'active' : 'inactive']}`}>
                      {item.isActive ? 'Опубликовано' : 'Черновик'}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <Link href={`/admin/news/${item.id}`} className={styles.editBtn}>
                      <Pencil size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
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
    </div>
  );
}
