'use client';

import { useState, useEffect, useCallback, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, X, MapPin, Plus, Search } from 'lucide-react';
import { placesAPI, mediaAPI, getImageUrl } from '@/lib/api';
import { AdminHeaderRightContext } from '../../layout';
import styles from '../../admin.module.css';

const LOCATION_DEBOUNCE_MS = 400;

export default function PlaceEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    shortDescription: '',
    howToGet: '',
    mapUrl: '',
    audioGuide: '',
    video: '',
    rating: 0,
    reviewsCount: 0,
    isActive: true,
    images: [],
    nearbyPlaceIds: [],
  });

  const [allPlaces, setAllPlaces] = useState([]);
  const [addPlacesModalOpen, setAddPlacesModalOpen] = useState(false);
  const [addPlacesSearch, setAddPlacesSearch] = useState('');
  const [addPlacesSelected, setAddPlacesSelected] = useState(new Set());
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const setHeaderRight = useContext(AdminHeaderRightContext)?.setHeaderRight;

  useEffect(() => {
    if (!isNew) {
      fetchPlace();
    }
  }, [params.id]);

  useEffect(() => {
    fetchAllPlaces();
  }, []);

  useEffect(() => {
    if (!setHeaderRight) return;
    setHeaderRight(
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>
        <input
          type="checkbox"
          checked={!!formData.isActive}
          onChange={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
          style={{ width: 18, height: 18 }}
        />
        Опубликовать
      </label>
    );
    return () => setHeaderRight(null);
  }, [setHeaderRight, formData.isActive]);

  const fetchAllPlaces = useCallback(async () => {
    try {
      const res = await placesAPI.getAll({ page: 1, limit: 500 });
      setAllPlaces(res.data.items || []);
    } catch (e) {
      console.error('Ошибка загрузки списка мест:', e);
    }
  }, []);

  const fetchPlace = async () => {
    try {
      const data = await placesAPI.getById(params.id).then((r) => r.data);
      setFormData((prev) => ({
        ...prev,
        ...data,
        nearbyPlaceIds: Array.isArray(data.nearbyPlaceIds) ? data.nearbyPlaceIds : [],
      }));
    } catch (error) {
      console.error('Ошибка загрузки места:', error);
      setError('Место не найдено');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlacesByLocation = useCallback(async (location, excludePlaceId) => {
    if (!location || !location.trim()) {
      setFormData((prev) => ({ ...prev, nearbyPlaceIds: [] }));
      return;
    }
    try {
      const res = await placesAPI.getAll({
        page: 1,
        limit: 200,
        byLocation: location.trim(),
      });
      const items = res.data.items || [];
      const ids = items
        .map((p) => p.id)
        .filter((id) => id !== excludePlaceId);
      setFormData((prev) => ({ ...prev, nearbyPlaceIds: ids }));
    } catch (e) {
      console.error('Ошибка подгрузки мест по локации:', e);
    }
  }, []);

  useEffect(() => {
    if (!formData.location?.trim()) return;
    const t = setTimeout(() => {
      loadPlacesByLocation(formData.location, isNew ? null : params.id);
    }, LOCATION_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [formData.location, isNew, params.id, loadPlacesByLocation]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      try {
        const response = await mediaAPI.upload(formDataUpload);
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, response.data.url],
        }));
      } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
      }
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeNearbyPlace = (placeId) => {
    setFormData((prev) => ({
      ...prev,
      nearbyPlaceIds: (prev.nearbyPlaceIds || []).filter((id) => id !== placeId),
    }));
  };

  const openAddPlacesModal = () => {
    setAddPlacesSearch('');
    setAddPlacesSelected(new Set());
    setAddPlacesModalOpen(true);
  };

  const toggleAddPlaceSelection = (placeId) => {
    setAddPlacesSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  };

  const addSelectedPlaces = () => {
    const ids = Array.from(addPlacesSelected);
    setFormData((prev) => ({
      ...prev,
      nearbyPlaceIds: [...new Set([...(prev.nearbyPlaceIds || []), ...ids])],
    }));
    setAddPlacesModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      if (isNew) {
        await placesAPI.create(formData);
      } else {
        await placesAPI.update(params.id, formData);
      }
      
      router.push('/admin/places');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setError(error.response?.data?.message || 'Ошибка сохранения места');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.spinner}></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          {isNew ? 'Новое место' : 'Редактирование места'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.formContainer}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Название места *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={styles.formInput}
            required
            placeholder="Введите название места"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Локация</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="Город, район"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Краткое описание</label>
          <textarea
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            className={styles.formTextarea}
            placeholder="Краткое описание для карточки"
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Полное описание</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={styles.formTextarea}
            placeholder="Подробное описание места"
            rows={6}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Как добраться (текст)</label>
          <textarea
            name="howToGet"
            value={formData.howToGet}
            onChange={handleChange}
            className={styles.formTextarea}
            placeholder="Инструкции как добраться до места"
            rows={4}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Карта (ссылка на изображение карты)</label>
          <input
            type="url"
            name="mapUrl"
            value={formData.mapUrl}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="https://... или загрузите карту в Изображения и вставьте URL"
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Ссылка на аудиогид</label>
            <input
              type="url"
              name="audioGuide"
              value={formData.audioGuide}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="https://..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Ссылка на видео</label>
            <input
              type="url"
              name="video"
              value={formData.video}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>

        {/* Места рядом — необязательное поле, массив id в БД */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} />
            <span>Места рядом</span>
          </label>
          <button type="button" onClick={openAddPlacesModal} className={styles.addBtn} style={{ marginBottom: 12 }}>
            <Plus size={18} /> Добавить места
          </button>
          {(formData.nearbyPlaceIds || []).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(formData.nearbyPlaceIds || []).map((placeId) => {
                const place = allPlaces.find((p) => p.id === placeId) || { id: placeId, title: '…', location: '' };
                return (
                  <div
                    key={placeId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {place.image && (
                        <img
                          src={getImageUrl(place.image)}
                          alt=""
                          style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 6 }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 500 }}>{place.title}</div>
                        {place.location && (
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{place.location}</div>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeNearbyPlace(placeId)} className={styles.deleteBtn} title="Удалить" aria-label="Удалить">
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Фотогалерея места</label>
          <div className={styles.imageUpload}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="imageUpload"
            />
            <label htmlFor="imageUpload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Upload size={20} /> Нажмите для загрузки изображений
            </label>
          </div>
          
          {formData.images.length > 0 && (
            <div className={styles.imagePreview}>
              {formData.images.map((img, index) => (
                <div key={index} className={styles.previewItem}>
                  <img src={getImageUrl(img)} alt={`Preview ${index}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className={styles.removeImage}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSaving}
          >
            {isSaving ? 'Сохранение...' : (isNew ? 'Создать место' : 'Сохранить изменения')}
          </button>
          <Link href="/admin/places" className={styles.cancelBtn}>
            Отмена
          </Link>
        </div>
      </form>

      {/* Модалка: выбор мест для «Места рядом» */}
      {addPlacesModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => e.target === e.currentTarget && setAddPlacesModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-places-title"
        >
          <div
            className={styles.modalDialog}
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id="add-places-title" className={styles.modalTitle}>Добавить места</h2>
              <button
                type="button"
                onClick={() => setAddPlacesModalOpen(false)}
                className={styles.modalClose}
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  value={addPlacesSearch}
                  onChange={(e) => setAddPlacesSearch(e.target.value)}
                  className={styles.formInput}
                  placeholder="Поиск по названию или локации..."
                  style={{ paddingLeft: 40 }}
                />
              </div>
              {(() => {
                const currentId = isNew ? null : params.id;
                const alreadyIds = new Set(formData.nearbyPlaceIds || []);
                const searchLower = (addPlacesSearch || '').trim().toLowerCase();
                const list = allPlaces.filter(
                  (p) => p.id !== currentId && !alreadyIds.has(p.id)
                ).filter(
                  (p) =>
                    !searchLower ||
                    (p.title || '').toLowerCase().includes(searchLower) ||
                    (p.location || '').toLowerCase().includes(searchLower)
                );
                return (
                  <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    {list.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
                        {addPlacesSearch ? 'Ничего не найдено' : 'Нет мест для добавления'}
                      </div>
                    ) : (
                      list.map((p) => (
                        <label
                          key={p.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            background: addPlacesSelected.has(p.id) ? '#eff6ff' : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={addPlacesSelected.has(p.id)}
                            onChange={() => toggleAddPlaceSelection(p.id)}
                          />
                          {p.image && (
                            <img
                              src={getImageUrl(p.image)}
                              alt=""
                              style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 6 }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{p.title}</div>
                            {p.location && (
                              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{p.location}</div>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                );
              })()}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" onClick={() => setAddPlacesModalOpen(false)} className={styles.cancelBtn}>
                Отмена
              </button>
              <button
                type="button"
                onClick={addSelectedPlaces}
                disabled={addPlacesSelected.size === 0}
                className={styles.submitBtn}
              >
                Добавить выбранные ({addPlacesSelected.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
