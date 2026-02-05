'use client';

import { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, MapPin, Plus, Search, Map, EyeOff, Eye, Pencil, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { placesAPI, mediaAPI, placeFiltersAPI, getImageUrl } from '@/lib/api';
import YandexMapPicker from '@/components/YandexMapPicker';
import RichTextEditor from '@/components/RichTextEditor';
import ConfirmModal from '../../components/ConfirmModal';
import ImageCropModal from '../../components/ImageCropModal';
import { AdminHeaderRightContext, AdminBreadcrumbContext } from '../../layout';
import styles from '../../admin.module.css';

const LOCATION_DEBOUNCE_MS = 400;
const TOAST_DURATION_MS = 3000;

/** Нормализованный снимок формы для сравнения (dirty check). */
function getFormSnapshot(data) {
  return {
    title: data.title ?? '',
    location: data.location ?? '',
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    description: data.description ?? '',
    shortDescription: data.shortDescription ?? '',
    howToGet: data.howToGet ?? '',
    mapUrl: data.mapUrl ?? '',
    audioGuide: data.audioGuide ?? '',
    video: data.video ?? '',
    rating: Number(data.rating) || 0,
    reviewsCount: Number(data.reviewsCount) || 0,
    isActive: !!data.isActive,
    image: data.image ?? '',
    images: Array.isArray(data.images) ? [...data.images] : [],
    directions: Array.isArray(data.directions) ? [...data.directions].sort() : [],
    seasons: Array.isArray(data.seasons) ? [...data.seasons].sort() : [],
    objectTypes: Array.isArray(data.objectTypes) ? [...data.objectTypes].sort() : [],
    accessibility: Array.isArray(data.accessibility) ? [...data.accessibility].sort() : [],
    nearbyPlaceIds: Array.isArray(data.nearbyPlaceIds) ? [...data.nearbyPlaceIds].sort((a, b) => String(a).localeCompare(String(b))) : [],
  };
}

function formSnapshotsEqual(a, b) {
  return JSON.stringify(getFormSnapshot(a)) === JSON.stringify(getFormSnapshot(b));
}

export default function PlaceEditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const isNew = params.id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    latitude: null,
    longitude: null,
    description: '',
    shortDescription: '',
    howToGet: '',
    mapUrl: '',
    audioGuide: '',
    video: '',
    rating: 0,
    reviewsCount: 0,
    isActive: true,
    image: '',
    images: [],
    directions: [],
    seasons: [],
    objectTypes: [],
    accessibility: [],
    nearbyPlaceIds: [],
  });

  const [allPlaces, setAllPlaces] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    directions: [],
    seasons: [],
    objectTypes: [],
    accessibility: [],
  });
  const [addPlacesModalOpen, setAddPlacesModalOpen] = useState(false);
  const [addPlacesSearch, setAddPlacesSearch] = useState('');
  const [addPlacesSelected, setAddPlacesSelected] = useState(new Set());
  const [mapSearchMode, setMapSearchMode] = useState('byName'); // 'byName' | 'byCoordinates'
  const [mapVisible, setMapVisible] = useState(true);
  const [determineLocationTrigger, setDetermineLocationTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [savedVersion, setSavedVersion] = useState(0);
  const previewUploadRef = useRef(null);
  const savedFormDataRef = useRef(null);
  const setHeaderRight = useContext(AdminHeaderRightContext)?.setHeaderRight;
  const setBreadcrumbLabel = useContext(AdminBreadcrumbContext)?.setBreadcrumbLabel;

  const isDirty = useMemo(() => {
    if (isNew) return false;
    if (!savedFormDataRef.current) return false;
    return !formSnapshotsEqual(formData, savedFormDataRef.current);
  }, [isNew, formData, savedVersion]);

  const goToList = useCallback(() => {
    setLeaveModalOpen(false);
    navigate('/admin/places');
  }, [navigate]);

  const handleCancelClick = useCallback(() => {
    if (isDirty) {
      setLeaveModalOpen(true);
    } else {
      navigate('/admin/places');
    }
  }, [isDirty, navigate]);

  useEffect(() => {
    if (!isNew) {
      fetchPlace();
    }
  }, [params.id]);

  useEffect(() => {
    if (!setBreadcrumbLabel) return;
    const label = formData.title?.trim() || (isNew ? 'Новое место' : '');
    setBreadcrumbLabel(label);
    return () => setBreadcrumbLabel(null);
  }, [setBreadcrumbLabel, formData.title, isNew]);

  useEffect(() => {
    if (!setHeaderRight) return;
    const submitLabel = isSaving
      ? 'Сохранение...'
      : isNew
        ? 'Создать место'
        : isDirty
          ? 'Сохранить изменения'
          : 'Сохранено';
    const submitClassName = [
      styles.headerSubmitBtn,
      !isNew && !isDirty && !isSaving && styles.headerSubmitBtnSaved,
    ].filter(Boolean).join(' ');
    setHeaderRight(
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <label className={styles.visibilityToggle}>
          <input
            type="checkbox"
            checked={!!formData.isActive}
            onChange={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
          />
          <span className={styles.visibilitySwitch} />
          <span className={styles.visibilityLabel}>
            {formData.isActive ? (
              <Eye size={16} style={{ marginRight: 6, flexShrink: 0 }} />
            ) : (
              <EyeOff size={16} style={{ marginRight: 6, flexShrink: 0, opacity: 0.7 }} />
            )}
            Видимость
          </span>
        </label>
        <button
          type="button"
          onClick={handleCancelClick}
          className={styles.headerCancelBtn}
        >
          Назад
        </button>
        <button
          type="submit"
          form="place-form"
          className={submitClassName}
          disabled={isSaving}
        >
          {submitLabel}
        </button>
      </div>
    );
    return () => setHeaderRight(null);
  }, [setHeaderRight, formData.isActive, isSaving, isNew, isDirty, handleCancelClick]);

  const fetchAllPlaces = useCallback(async () => {
    try {
      const res = await placesAPI.getAll({ page: 1, limit: 500 });
      setAllPlaces(res.data.items || []);
    } catch (e) {
      console.error('Ошибка загрузки списка мест:', e);
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await placeFiltersAPI.get();
      const d = res.data || {};
      setFilterOptions({
        directions: Array.isArray(d.directions) ? d.directions : [],
        seasons: Array.isArray(d.seasons) ? d.seasons : [],
        objectTypes: Array.isArray(d.objectTypes) ? d.objectTypes : [],
        accessibility: Array.isArray(d.accessibility) ? d.accessibility : [],
      });
    } catch (e) {
      console.error('Ошибка загрузки опций фильтров:', e);
    }
  }, []);

  useEffect(() => {
    fetchAllPlaces();
    fetchFilterOptions();
  }, [fetchAllPlaces, fetchFilterOptions]);

  const fetchPlace = async () => {
    try {
      const data = await placesAPI.getById(params.id).then((r) => r.data);
      const next = {
        ...data,
        nearbyPlaceIds: Array.isArray(data.nearbyPlaceIds) ? data.nearbyPlaceIds : [],
      };
      setFormData((prev) => ({ ...prev, ...next }));
      savedFormDataRef.current = next;
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

  const handleAudioGuideChange = (e) => {
    let value = e.target.value.trim();
    if (value.includes('<iframe') && value.includes('src=')) {
      const match = value.match(/src=["']([^"']+)["']/);
      if (match) value = match[1];
    }
    setFormData((prev) => ({ ...prev, audioGuide: value }));
  };

  const handleVideoChange = (e) => {
    let value = e.target.value.trim();
    if (value.includes('<iframe') && value.includes('src=')) {
      const match = value.match(/src=["']([^"']+)["']/);
      if (match) value = match[1];
    }
    setFormData((prev) => ({ ...prev, video: value }));
  };

  /** Загрузка превью: один файл → кроп → замена images[0] */
  const handlePreviewFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCropImageSrc(URL.createObjectURL(file));
  };

  const handleCropComplete = useCallback(async (blob) => {
    const urlToRevoke = cropImageSrc;
    const file = new File([blob], 'preview.jpg', { type: 'image/jpeg' });
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const response = await mediaAPI.upload(formDataUpload);
      setFormData((prev) => ({
        ...prev,
        image: response.data.url,
      }));
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
    }
    if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    setCropImageSrc(null);
  }, [cropImageSrc]);

  const handleCropCancel = useCallback(() => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
  }, [cropImageSrc]);

  const removePreview = () => {
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
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

  const setMainImage = (index) => {
    if (index === 0) return;
    setFormData((prev) => {
      const img = prev.images[index];
      const rest = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: [img, ...rest] };
    });
  };

  const moveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formData.images.length) return;
    setFormData((prev) => {
      const arr = [...prev.images];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return { ...prev, images: arr };
    });
  };

  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState(null);

  const moveImageTo = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setFormData((prev) => {
      const arr = [...prev.images];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return { ...prev, images: arr };
    });
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
        const res = await placesAPI.create(formData);
        const created = res.data;
        setShowToast(true);
        setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
        if (created?.id) {
          navigate(`/admin/places/${created.id}`, { replace: true });
        }
      } else {
        await placesAPI.update(params.id, formData);
        savedFormDataRef.current = { ...formData, image: formData.image, images: [...(formData.images || [])], nearbyPlaceIds: [...(formData.nearbyPlaceIds || [])] };
        setSavedVersion((v) => v + 1);
        setShowToast(true);
        setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setError(error.response?.data?.message || 'Ошибка сохранения места');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

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

      <form id="place-form" onSubmit={handleSubmit} className={styles.formContainer}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Город, район (введите вручную или нажмите «Определить локацию»)"
              style={{ flex: 1, minWidth: 200 }}
            />
            <button
              type="button"
              onClick={() => setDetermineLocationTrigger((v) => v + 1)}
              disabled={mapSearchMode === 'byName' ? !formData.title?.trim() : (formData.latitude == null || formData.longitude == null)}
              className={styles.editBtn}
              style={{ padding: 15 }}
              title={mapSearchMode === 'byName' ? 'Определить локацию по названию места' : 'Определить локацию по координатам'}
              aria-label="Определить локацию"
            >
              <MapPin size={18} />
            </button>
            <button
              type="button"
              onClick={() => setMapVisible((v) => !v)}
              className={mapVisible ? styles.viewBtn : styles.editBtn}
              style={{ padding: 15 }}
              title={mapVisible ? 'Скрыть карту' : 'Показать карту'}
              aria-label={mapVisible ? 'Скрыть карту' : 'Показать карту'}
            >
              {mapVisible ? <EyeOff size={18} /> : <Map size={18} />}
            </button>
          </div>
        </div>

        {/* Карта: поиск по названию или по координатам */}
        {mapVisible && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Местоположение на карте</label>
            <div className={styles.mapSearchToggleWrap} style={{ marginBottom: 12 }}>
              <span className={styles.mapSearchToggleLabel}>Поиск на карте</span>
              <div className={styles.typeToggle}>
                <button
                  type="button"
                  className={`${styles.typeToggleBtn} ${mapSearchMode === 'byName' ? styles.typeToggleBtnActive : ''}`}
                  onClick={() => setMapSearchMode('byName')}
                >
                  По названию места
                </button>
                <button
                  type="button"
                  className={`${styles.typeToggleBtn} ${mapSearchMode === 'byCoordinates' ? styles.typeToggleBtnActive : ''}`}
                  onClick={() => setMapSearchMode('byCoordinates')}
                >
                  По координатам
                </button>
              </div>
            </div>
            {mapSearchMode === 'byCoordinates' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>Координаты (широта, долгота)</label>
                <input
                  type="text"
                  value={
                    formData.latitude != null && formData.longitude != null
                      ? `${formData.latitude}, ${formData.longitude}`
                      : formData.latitude != null
                        ? String(formData.latitude)
                        : formData.longitude != null
                          ? `, ${formData.longitude}`
                          : ''
                  }
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (!v) {
                      setFormData((prev) => ({ ...prev, latitude: null, longitude: null }));
                      return;
                    }
                    const parts = v.split(/[,\s]+/).map((s) => s.replace(',', '.').trim()).filter(Boolean);
                    const lat = parts[0] ? parseFloat(parts[0].replace(',', '.')) : null;
                    const lng = parts[1] ? parseFloat(parts[1].replace(',', '.')) : null;
                    setFormData((prev) => ({
                      ...prev,
                      latitude: Number.isFinite(lat) ? lat : prev.latitude,
                      longitude: Number.isFinite(lng) ? lng : prev.longitude,
                    }));
                  }}
                  className={styles.formInput}
                  placeholder="43.526598, 42.067218"
                />
              </div>
            )}
            <YandexMapPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              geocodeQuery={mapSearchMode === 'byName' ? (formData.title?.trim() || '') : ''}
              onCoordinatesChange={(lat, lng) => setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
              onLocationChange={(addr) => setFormData((prev) => ({ ...prev, location: addr || prev.location }))}
              determineLocationTrigger={determineLocationTrigger}
              determineLocationBy={mapSearchMode === 'byName' ? 'name' : 'coordinates'}
              visible={true}
              height={500}
            />
          </div>
        )}
        {!mapVisible && (
          <YandexMapPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            geocodeQuery={mapSearchMode === 'byName' ? (formData.title?.trim() || '') : ''}
            onCoordinatesChange={(lat, lng) => setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
            onLocationChange={(addr) => setFormData((prev) => ({ ...prev, location: addr || prev.location }))}
            determineLocationTrigger={determineLocationTrigger}
            determineLocationBy={mapSearchMode === 'byName' ? 'name' : 'coordinates'}
            visible={false}
            height={500}
          />
        )}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Краткое описание</label>
          <RichTextEditor
            value={formData.shortDescription}
            onChange={(value) => setFormData((prev) => ({ ...prev, shortDescription: value }))}
            placeholder="Краткое описание для карточки"
            minHeight={300}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Полное описание</label>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
            placeholder="Подробное описание места"
            minHeight={300}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Как добраться (текст)</label>
          <RichTextEditor
            value={formData.howToGet}
            onChange={(value) => setFormData((prev) => ({ ...prev, howToGet: value }))}
            placeholder="Инструкции как добраться до места"
            minHeight={300}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Аудиогид (Яндекс.Музыка)</label>
            <div className={styles.formHintBox}>
              <span className={styles.formHintIcon}>💡</span>
              <span className={styles.formHintText}>
                Вставьте ссылку из кода встраивания (атрибут <code>src</code> из iframe) или вставьте весь код iframe — ссылка подставится автоматически.
              </span>
            </div>
            <input
              type="text"
              name="audioGuide"
              value={formData.audioGuide}
              onChange={handleAudioGuideChange}
              className={styles.formInput}
              placeholder="https://music.yandex.ru/iframe/playlist/..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Видео (VK Video)</label>
            <div className={styles.formHintBox}>
              <span className={styles.formHintIcon}>🎬</span>
              <span className={styles.formHintText}>
                Вставьте ссылку из кода встраивания (атрибут <code>src</code> из iframe) или вставьте весь код iframe — ссылка подставится автоматически.
              </span>
            </div>
            <input
              type="text"
              name="video"
              value={formData.video}
              onChange={handleVideoChange}
              className={styles.formInput}
              placeholder="https://vkvideo.ru/video_ext.php?..."
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
            <div className={styles.formCardList}>
              {(formData.nearbyPlaceIds || []).map((placeId) => {
                const place = allPlaces.find((p) => p.id === placeId) || { id: placeId, title: '…', location: '' };
                return (
                  <div key={placeId} className={styles.formCardRow}>
                    {place.image && (
                      <img src={getImageUrl(place.image)} alt="" />
                    )}
                    <div className={styles.formCardRowContent}>
                      <div className={styles.formCardRowTitle}>{place.title}</div>
                      {place.location && (
                        <div className={styles.formCardRowSub}>{place.location}</div>
                      )}
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
          <label className={styles.formLabel}>Превью (обложка места)</label>
          <p className={styles.imageHint} style={{ marginBottom: 12 }}>
            Одна картинка для карточек и слайдера. Можно выбрать нужную область изображения после загрузки.
          </p>
          <input
            ref={previewUploadRef}
            type="file"
            accept="image/*"
            onChange={handlePreviewFileSelect}
            style={{ display: 'none' }}
            id="previewUpload"
          />
          {formData.image ? (
            <div
              className={`${styles.previewItem} ${styles.previewItemMain}`}
              style={{ width: 330, aspectRatio: '330 / 390', position: 'relative', overflow: 'hidden', borderRadius: 8 }}
            >
              <img src={getImageUrl(formData.image)} alt="Превью" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <span className={styles.previewItemBadge}>Превью</span>
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'row', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => previewUploadRef.current?.click()}
                  className={styles.removeImage}
                  style={{ position: 'relative', top: 0, right: 0 }}
                  aria-label="Редактировать превью"
                  title="Редактировать превью"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={removePreview}
                  className={styles.removeImage}
                  style={{ position: 'relative', top: 0, right: 0 }}
                  aria-label="Удалить превью"
                  title="Удалить превью"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.imageUpload}>
              <label htmlFor="previewUpload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <Upload size={20} /> Загрузить превью
              </label>
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
            <>
              <div className={styles.imagePreview}>
                {formData.images.map((img, index) => (
                  <div
                    key={index}
                    className={`${styles.imagePreviewItemWrap} ${draggedImageIndex === index ? styles.dragging : ''} ${dragOverImageIndex === index ? styles.dragOver : ''}`}
                    draggable
                    onDragStart={(e) => {
                      setDraggedImageIndex(index);
                      e.dataTransfer.setData('text/plain', String(index));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDraggedImageIndex(null);
                      setDragOverImageIndex(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverImageIndex(index);
                    }}
                    onDragLeave={() => setDragOverImageIndex((i) => (i === index ? null : i))}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                      setDragOverImageIndex(null);
                      if (!Number.isNaN(from) && from !== index) moveImageTo(from, index);
                    }}
                  >
                    <div
                      className={`${styles.previewItem} ${index === 0 ? styles.previewItemMain : ''}`}
                      onClick={() => setMainImage(index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainImage(index); } }}
                      aria-label={index === 0 ? 'Главное фото (нажмите на другую картинку, чтобы сделать её главной)' : 'Сделать главным фото'}
                      title={index === 0 ? 'Главное фото' : 'Сделать главным'}
                    >
                      <img src={getImageUrl(img)} alt={`Preview ${index}`} />
                      {index === 0 && <span className={styles.previewItemBadge}>Главная</span>}
                    </div>
                    <div className={styles.imagePreviewActions}>
                      <div
                        className={styles.imageDragHandle}
                        onClick={(e) => e.stopPropagation()}
                        title="Перетащите для изменения порядка"
                      >
                        <GripVertical size={18} />
                      </div>
                      <div className={styles.imageMoveButtonsRow}>
                        <button
                          type="button"
                          onClick={() => moveImage(index, -1)}
                          disabled={index === 0}
                          className={styles.formMoveBtn}
                          aria-label="Влево"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, 1)}
                          disabled={index === formData.images.length - 1}
                          className={styles.formMoveBtn}
                          aria-label="Вправо"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className={styles.removeImageBtn}
                        aria-label="Удалить"
                        title="Удалить"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className={styles.imageHint}>
                Первая картинка отображается как главная в галерее. Нажмите на другую картинку, чтобы сделать её главной.
              </p>
            </>
          )}
        </div>

        {/* Фильтры — в самом низу формы, группы друг под другом */}
        <div className={styles.formGroup}>
          <div className={styles.filtersSection}>
            <label className={styles.formLabel}>Фильтры (для поиска на сайте)</label>
            <p className={styles.imageHint} style={{ marginBottom: 20 }}>
              Можно выбрать несколько значений в каждой группе. По ним пользователи будут искать места.
            </p>
            <div className={styles.filterGroups}>
              <div className={styles.filterGroupCard}>
                <div className={styles.filterGroupTitleRow}>
                  <div className={styles.filterGroupTitle}>Направление</div>
                  <button
                    type="button"
                    className={styles.filterGroupSelectAllBtn}
                    onClick={() => {
                      const opts = filterOptions.directions || [];
                      const current = formData.directions || [];
                      const allSelected = opts.length > 0 && opts.every((o) => current.includes(o));
                      setFormData((prev) => ({
                        ...prev,
                        directions: allSelected ? [] : [...opts],
                      }));
                    }}
                  >
                    {(filterOptions.directions || []).length > 0 &&
                    (formData.directions || []).length === (filterOptions.directions || []).length
                      ? 'Снять все'
                      : 'Выбрать все'}
                  </button>
                </div>
                <div className={styles.filterCheckboxList}>
                  {(filterOptions.directions || []).map((v) => (
                    <label key={v} className={styles.filterCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={(formData.directions || []).includes(v)}
                        onChange={() => {
                          const arr = formData.directions || [];
                          setFormData((prev) => ({
                            ...prev,
                            directions: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
                          }));
                        }}
                      />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.filterGroupCard}>
                <div className={styles.filterGroupTitleRow}>
                  <div className={styles.filterGroupTitle}>Сезон</div>
                  <button
                    type="button"
                    className={styles.filterGroupSelectAllBtn}
                    onClick={() => {
                      const opts = filterOptions.seasons || [];
                      const current = formData.seasons || [];
                      const allSelected = opts.length > 0 && opts.every((o) => current.includes(o));
                      setFormData((prev) => ({
                        ...prev,
                        seasons: allSelected ? [] : [...opts],
                      }));
                    }}
                  >
                    {(filterOptions.seasons || []).length > 0 &&
                    (formData.seasons || []).length === (filterOptions.seasons || []).length
                      ? 'Снять все'
                      : 'Выбрать все'}
                  </button>
                </div>
                <div className={styles.filterCheckboxList}>
                  {(filterOptions.seasons || []).map((v) => (
                    <label key={v} className={styles.filterCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={(formData.seasons || []).includes(v)}
                        onChange={() => {
                          const arr = formData.seasons || [];
                          setFormData((prev) => ({
                            ...prev,
                            seasons: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
                          }));
                        }}
                      />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.filterGroupCard}>
                <div className={styles.filterGroupTitleRow}>
                  <div className={styles.filterGroupTitle}>Вид объекта</div>
                  <button
                    type="button"
                    className={styles.filterGroupSelectAllBtn}
                    onClick={() => {
                      const opts = filterOptions.objectTypes || [];
                      const current = formData.objectTypes || [];
                      const allSelected = opts.length > 0 && opts.every((o) => current.includes(o));
                      setFormData((prev) => ({
                        ...prev,
                        objectTypes: allSelected ? [] : [...opts],
                      }));
                    }}
                  >
                    {(filterOptions.objectTypes || []).length > 0 &&
                    (formData.objectTypes || []).length === (filterOptions.objectTypes || []).length
                      ? 'Снять все'
                      : 'Выбрать все'}
                  </button>
                </div>
                <div className={styles.filterCheckboxList}>
                  {(filterOptions.objectTypes || []).map((v) => (
                    <label key={v} className={styles.filterCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={(formData.objectTypes || []).includes(v)}
                        onChange={() => {
                          const arr = formData.objectTypes || [];
                          setFormData((prev) => ({
                            ...prev,
                            objectTypes: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
                          }));
                        }}
                      />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.filterGroupCard}>
                <div className={styles.filterGroupTitleRow}>
                  <div className={styles.filterGroupTitle}>Доступность</div>
                  <button
                    type="button"
                    className={styles.filterGroupSelectAllBtn}
                    onClick={() => {
                      const opts = filterOptions.accessibility || [];
                      const current = formData.accessibility || [];
                      const allSelected = opts.length > 0 && opts.every((o) => current.includes(o));
                      setFormData((prev) => ({
                        ...prev,
                        accessibility: allSelected ? [] : [...opts],
                      }));
                    }}
                  >
                    {(filterOptions.accessibility || []).length > 0 &&
                    (formData.accessibility || []).length === (filterOptions.accessibility || []).length
                      ? 'Снять все'
                      : 'Выбрать все'}
                  </button>
                </div>
                <div className={styles.filterCheckboxList}>
                  {(filterOptions.accessibility || []).map((v) => (
                    <label key={v} className={styles.filterCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={(formData.accessibility || []).includes(v)}
                        onChange={() => {
                          const arr = formData.accessibility || [];
                          setFormData((prev) => ({
                            ...prev,
                            accessibility: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
                          }));
                        }}
                      />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
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

      {/* Модалка: обрезка изображения для превью */}
      <ImageCropModal
        open={!!cropImageSrc}
        imageSrc={cropImageSrc}
        title="Обрезка изображения для превью"
        onComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />

      {/* Модалка: уход с несохранёнными изменениями */}
      <ConfirmModal
        open={leaveModalOpen}
        title="Несохранённые изменения"
        message="Есть несохранённые изменения. Вы уверены, что хотите уйти? Они будут потеряны."
        cancelLabel="Остаться"
        confirmLabel="Уйти без сохранения"
        variant="danger"
        dialogStyle={{ maxWidth: 500 }}
        onCancel={() => setLeaveModalOpen(false)}
        onConfirm={goToList}
      />

      {/* Toast: успешно сохранено */}
      {showToast && (
        <div className={styles.toast} role="status">
          Изменения успешно сохранены
        </div>
      )}
    </div>
  );
}
