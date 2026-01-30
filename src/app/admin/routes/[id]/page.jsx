'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, X, MapPin, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { routesAPI, placesAPI, mediaAPI, getImageUrl } from '@/lib/api';
import RichTextEditor from '@/components/RichTextEditor';
import styles from '../../admin.module.css';

const seasons = ['Зима', 'Весна', 'Лето', 'Осень'];
const transportTypes = ['Пешком', 'Верхом', 'Автомобиль', 'Квадроцикл'];

export default function RouteEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    season: 'Лето',
    distance: '',
    duration: '',
    difficulty: 3,
    transport: 'Пешком',
    isFamily: false,
    hasOvernight: false,
    elevationGain: '',
    whatToBring: '',
    importantInfo: '',
    isActive: true,
    images: [],
    placeIds: [],
  });

  const [allPlaces, setAllPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [placesSearch, setPlacesSearch] = useState('');

  useEffect(() => {
    fetchPlaces();
    if (!isNew) {
      fetchRoute();
    }
  }, [params.id]);

  const fetchPlaces = async () => {
    try {
      const response = await placesAPI.getAll({ limit: 100 });
      setAllPlaces(response.data.items || []);
    } catch (error) {
      console.error('Ошибка загрузки мест:', error);
    }
  };

  const fetchRoute = async () => {
    try {
      const response = await routesAPI.getById(params.id);
      setFormData({
        ...response.data,
        placeIds: response.data.placeIds || [],
      });
    } catch (error) {
      console.error('Ошибка загрузки маршрута:', error);
      setError('Маршрут не найден');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Функции для работы с местами маршрута
  const addPlace = (placeId) => {
    if (!formData.placeIds.includes(placeId)) {
      setFormData((prev) => ({
        ...prev,
        placeIds: [...prev.placeIds, placeId],
      }));
    }
  };

  const removePlace = (placeId) => {
    setFormData((prev) => ({
      ...prev,
      placeIds: prev.placeIds.filter((id) => id !== placeId),
    }));
  };

  const movePlace = (index, direction) => {
    const newPlaceIds = [...formData.placeIds];
    const newIndex = index + direction;
    
    if (newIndex < 0 || newIndex >= newPlaceIds.length) return;
    
    [newPlaceIds[index], newPlaceIds[newIndex]] = [newPlaceIds[newIndex], newPlaceIds[index]];
    
    setFormData((prev) => ({
      ...prev,
      placeIds: newPlaceIds,
    }));
  };

  const getPlaceById = (id) => allPlaces.find((p) => p.id === id);

  const filteredPlaces = allPlaces.filter(
    (place) =>
      !formData.placeIds.includes(place.id) &&
      place.title.toLowerCase().includes(placesSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const dataToSend = {
        ...formData,
        distance: parseFloat(formData.distance) || 0,
        difficulty: parseInt(formData.difficulty) || 3,
        elevationGain: parseFloat(formData.elevationGain) || 0,
      };

      if (isNew) {
        await routesAPI.create(dataToSend);
      } else {
        await routesAPI.update(params.id, dataToSend);
      }
      
      router.push('/admin/routes');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setError(error.response?.data?.message || 'Ошибка сохранения маршрута');
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
          {isNew ? 'Новый маршрут' : 'Редактирование маршрута'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.formContainer}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Название маршрута *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={styles.formInput}
            required
            placeholder="Введите название маршрута"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Краткое описание</label>
          <RichTextEditor
            value={formData.shortDescription}
            onChange={(value) => setFormData((prev) => ({ ...prev, shortDescription: value }))}
            placeholder="Краткое описание для карточки маршрута"
            minHeight={300}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Полное описание</label>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
            placeholder="Подробное описание маршрута"
            minHeight={300}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Сезон</label>
            <select
              name="season"
              value={formData.season}
              onChange={handleChange}
              className={styles.formSelect}
            >
              {seasons.map((season) => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Способ передвижения</label>
            <select
              name="transport"
              value={formData.transport}
              onChange={handleChange}
              className={styles.formSelect}
            >
              {transportTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Расстояние (км)</label>
            <input
              type="number"
              name="distance"
              value={formData.distance}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="100"
              step="0.1"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Продолжительность</label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="3ч 30м"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Сложность (1-5)</label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className={styles.formSelect}
            >
              {[1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Перепад высот (м)</label>
            <input
              type="number"
              name="elevationGain"
              value={formData.elevationGain}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="500"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <input
                type="checkbox"
                name="isFamily"
                checked={formData.isFamily}
                onChange={handleChange}
              />
              {' '}Семейный маршрут
            </label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <input
                type="checkbox"
                name="hasOvernight"
                checked={formData.hasOvernight}
                onChange={handleChange}
              />
              {' '}С ночевкой
            </label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              {' '}Активен (отображается на сайте)
            </label>
          </div>
        </div>

        {/* Секция выбора мест маршрута */}
        <div className={styles.formGroup} style={{ marginTop: '30px' }}>
          <label className={styles.formLabel}>
            <MapPin size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Места на маршруте ({formData.placeIds.length})
          </label>
          
          {/* Выбранные места с возможностью сортировки */}
          {formData.placeIds.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '8px' }}>
                Порядок мест на маршруте (можно изменить):
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.placeIds.map((placeId, index) => {
                  const place = getPlaceById(placeId);
                  if (!place) return null;
                  return (
                    <div
                      key={placeId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          type="button"
                          onClick={() => movePlace(index, -1)}
                          disabled={index === 0}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            opacity: index === 0 ? 0.3 : 1,
                            padding: '2px',
                          }}
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePlace(index, 1)}
                          disabled={index === formData.placeIds.length - 1}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: index === formData.placeIds.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: index === formData.placeIds.length - 1 ? 0.3 : 1,
                            padding: '2px',
                          }}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      <span style={{
                        width: '28px',
                        height: '28px',
                        background: '#2563eb',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                      }}>
                        {index + 1}
                      </span>
                      {place.image && (
                        <img
                          src={getImageUrl(place.image)}
                          alt={place.title}
                          style={{
                            width: '48px',
                            height: '36px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500' }}>{place.title}</div>
                        {place.location && (
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{place.location}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePlace(placeId)}
                        className={styles.deleteBtn}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Поиск и добавление мест */}
          <div style={{ marginTop: '12px' }}>
            <input
              type="text"
              placeholder="Поиск мест для добавления..."
              value={placesSearch}
              onChange={(e) => setPlacesSearch(e.target.value)}
              className={styles.formInput}
              style={{ marginBottom: '12px' }}
            />
            
            {filteredPlaces.length > 0 ? (
              <div style={{
                maxHeight: '250px',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}>
                {filteredPlaces.map((place) => (
                  <div
                    key={place.id}
                    onClick={() => addPlace(place.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {place.image && (
                      <img
                        src={getImageUrl(place.image)}
                        alt={place.title}
                        style={{
                          width: '40px',
                          height: '30px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{place.title}</div>
                      {place.location && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{place.location}</div>
                      )}
                    </div>
                    <span style={{ color: '#2563eb', fontSize: '0.85rem' }}>+ Добавить</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                {allPlaces.length === 0 
                  ? 'Нет доступных мест. Сначала создайте места.' 
                  : 'Все места уже добавлены в маршрут'}
              </div>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Что взять с собой</label>
          <RichTextEditor
            value={formData.whatToBring}
            onChange={(value) => setFormData((prev) => ({ ...prev, whatToBring: value }))}
            placeholder="Список необходимых вещей"
            minHeight={300}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Важная информация</label>
          <RichTextEditor
            value={formData.importantInfo}
            onChange={(value) => setFormData((prev) => ({ ...prev, importantInfo: value }))}
            placeholder="Важные предупреждения и рекомендации"
            minHeight={300}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Изображения</label>
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
            {isSaving ? 'Сохранение...' : (isNew ? 'Создать маршрут' : 'Сохранить изменения')}
          </button>
          <Link href="/admin/routes" className={styles.cancelBtn}>
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
