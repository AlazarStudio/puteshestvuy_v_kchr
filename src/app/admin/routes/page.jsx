'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Map } from 'lucide-react';
import { routesAPI, getImageUrl } from '@/lib/api';
import styles from '../admin.module.css';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRoutes = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await routesAPI.getAll({ page, limit: 10, search: searchQuery });
      setRoutes(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Ошибка загрузки маршрутов:', error);
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот маршрут?')) return;
    
    try {
      await routesAPI.delete(id);
      fetchRoutes(pagination.page);
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления маршрута');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRoutes(1);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Маршруты</h1>
        <Link href="/admin/routes/new" className={styles.addBtn}>
          <Plus size={18} /> Добавить маршрут
        </Link>
      </div>

      <form onSubmit={handleSearch} className={styles.searchBar}>
        <input
          type="text"
          placeholder="Поиск маршрутов..."
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
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id}>
                  <td>
                    <img
                      src={getImageUrl(route.images?.[0])}
                      alt={route.title}
                      className={styles.tableImage}
                    />
                  </td>
                  <td>{route.title}</td>
                  <td>{route.season}</td>
                  <td>{route.difficulty}/5</td>
                  <td>{route.distance} км</td>
                  <td>
                    <span className={`${styles.badge} ${styles[route.isActive ? 'active' : 'inactive']}`}>
                      {route.isActive ? 'Активен' : 'Скрыт'}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <Link href={`/admin/routes/${route.id}`} className={styles.editBtn}>
                      <Pencil size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(route.id)}
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
    </div>
  );
}
