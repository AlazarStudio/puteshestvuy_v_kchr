'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, MapPin, Star } from 'lucide-react';
import { placesAPI, getImageUrl } from '@/lib/api';
import styles from '../admin.module.css';

export default function PlacesPage() {
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPlaces = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await placesAPI.getAll({ page, limit: 10, search: searchQuery });
      setPlaces(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Ошибка загрузки мест:', error);
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить это место?')) return;
    
    try {
      await placesAPI.delete(id);
      fetchPlaces(pagination.page);
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления места');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPlaces(1);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Места</h1>
        <Link href="/admin/places/new" className={styles.addBtn}>
          <Plus size={18} /> Добавить место
        </Link>
      </div>

      <form onSubmit={handleSearch} className={styles.searchBar}>
        <input
          type="text"
          placeholder="Поиск мест..."
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
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {places.map((place) => (
                <tr key={place.id}>
                  <td>
                    <img
                      src={getImageUrl(place.image)}
                      alt={place.title}
                      className={styles.tableImage}
                    />
                  </td>
                  <td>{place.title}</td>
                  <td>{place.location}</td>
                  <td><Star size={14} style={{ marginRight: 4 }} /> {place.rating || '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[place.isActive ? 'active' : 'inactive']}`}>
                      {place.isActive ? 'Активно' : 'Скрыто'}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <Link href={`/admin/places/${place.id}`} className={styles.editBtn}>
                      <Pencil size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(place.id)}
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
    </div>
  );
}
