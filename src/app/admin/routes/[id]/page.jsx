'use client';

import { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Upload, X, MapPin, ChevronUp, ChevronDown, Eye, EyeOff, Plus } from 'lucide-react';
import { routesAPI, placesAPI, mediaAPI, routeFiltersAPI, getImageUrl } from '@/lib/api';
import RichTextEditor from '@/components/RichTextEditor';
import ConfirmModal from '../../components/ConfirmModal';
import { AdminHeaderRightContext, AdminBreadcrumbContext } from '../../layout';
import styles from '../../admin.module.css';

const TOAST_DURATION_MS = 3000;

const FIXED_GROUPS_CONFIG = [
  { key: 'seasons', label: 'Сезон', optionsKey: 'seasons' },
  { key: 'transport', label: 'Способ передвижения', optionsKey: 'transport' },
  { key: 'durationOptions', label: 'Время прохождения', optionsKey: 'durationOptions' },
  { key: 'difficultyLevels', label: 'Сложность', optionsKey: 'difficultyLevels' },
  { key: 'distanceOptions', label: 'Расстояние', optionsKey: 'distanceOptions' },
  { key: 'elevationOptions', label: 'Перепад высот', optionsKey: 'elevationOptions' },
  { key: 'isFamilyOptions', label: 'Семейный маршрут', optionsKey: 'isFamilyOptions' },
  { key: 'hasOvernightOptions', label: 'С ночевкой', optionsKey: 'hasOvernightOptions' },
];

function getAvailableGroups(filterOptions) {
  const list = [];
  FIXED_GROUPS_CONFIG.forEach(({ key, label, optionsKey }) => {
    const values = Array.isArray(filterOptions[optionsKey]) ? filterOptions[optionsKey] : [];
    if (values.length > 0) {
      list.push({ key, label, values, type: 'single' });
    } else {
      list.push({ key, label, values: [], type: 'input' });
    }
  });
  (filterOptions.extraGroups || []).forEach((g) => {
    if (!g?.key) return;
    const values = g.values || [];
    if (values.length > 0) {
      list.push({ key: g.key, label: g.label || g.key, values, type: 'multi' });
    } else {
      list.push({ key: g.key, label: g.label || g.key, values: [], type: 'input' });
    }
  });
  return list;
}

function getGroupByKey(filterOptions, groupKey) {
  return getAvailableGroups(filterOptions).find((g) => g.key === groupKey) || null;
}

function deriveAddedFilterGroups(formData, filterOptions) {
  const keys = [];
  const has = (key) => {
    const arr = formData.customFilters?.[key];
    return Array.isArray(arr) ? arr.length > 0 : (arr != null && arr !== '');
  };
  if (has('seasons') || formData.season) keys.push('seasons');
  if (has('transport') || formData.transport) keys.push('transport');
  if (has('durationOptions') || formData.duration) keys.push('durationOptions');
  if (has('difficultyLevels') || (formData.difficulty != null && formData.difficulty !== '')) keys.push('difficultyLevels');
  if (has('distanceOptions') || formData.customFilters?.distance) keys.push('distanceOptions');
  if (has('elevationOptions') || formData.customFilters?.elevationGain) keys.push('elevationOptions');
  if (has('isFamilyOptions') || formData.isFamily) keys.push('isFamilyOptions');
  if (has('hasOvernightOptions') || formData.hasOvernight) keys.push('hasOvernightOptions');
  (filterOptions.extraGroups || []).forEach((g) => {
    if (has(g.key)) keys.push(g.key);
  });
  return keys;
}

function clearFilter(formData, groupKey) {
  const cf = { ...formData.customFilters };
  delete cf[groupKey];
  if (groupKey === 'distanceOptions') delete cf.distance;
  if (groupKey === 'elevationOptions') delete cf.elevationGain;
  return { ...formData, customFilters: cf };
}

function applyFilter(formData, groupKey, valueOrValues, groupType) {
  if (groupType === 'multi') {
    return { ...formData, customFilters: { ...formData.customFilters, [groupKey]: valueOrValues } };
  }
  if (groupType === 'input') {
    const cf = { ...formData.customFilters };
    if (groupKey === 'distanceOptions') cf.distance = valueOrValues;
    else if (groupKey === 'elevationOptions') cf.elevationGain = valueOrValues;
    else cf[groupKey] = valueOrValues;
    return { ...formData, customFilters: cf };
  }
  if (groupKey === 'seasons') return { ...formData, customFilters: { ...formData.customFilters, seasons: valueOrValues } };
  if (groupKey === 'transport') return { ...formData, customFilters: { ...formData.customFilters, transport: valueOrValues } };
  if (groupKey === 'durationOptions') return { ...formData, customFilters: { ...formData.customFilters, durationOptions: valueOrValues } };
  if (groupKey === 'difficultyLevels') return { ...formData, customFilters: { ...formData.customFilters, difficultyLevels: valueOrValues } };
  if (groupKey === 'distanceOptions') return { ...formData, customFilters: { ...formData.customFilters, distanceOptions: valueOrValues } };
  if (groupKey === 'elevationOptions') return { ...formData, customFilters: { ...formData.customFilters, elevationOptions: valueOrValues } };
  if (groupKey === 'isFamilyOptions') return { ...formData, customFilters: { ...formData.customFilters, isFamilyOptions: valueOrValues } };
  if (groupKey === 'hasOvernightOptions') return { ...formData, customFilters: { ...formData.customFilters, hasOvernightOptions: valueOrValues } };
  return { ...formData, customFilters: { ...formData.customFilters, [groupKey]: valueOrValues } };
}

function getCurrentValueForGroup(formData, groupKey, groupType) {
  if (groupType === 'input') {
    if (groupKey === 'distanceOptions') return formData.customFilters?.distance ?? '';
    if (groupKey === 'elevationOptions') return formData.customFilters?.elevationGain ?? '';
    const v = formData.customFilters?.[groupKey];
    return Array.isArray(v) ? (v[0] ?? '') : (typeof v === 'string' ? v : '');
  }
  if (groupType === 'multi' || groupKey === 'seasons' || groupKey === 'transport' || groupKey === 'durationOptions' || groupKey === 'difficultyLevels' || groupKey === 'distanceOptions' || groupKey === 'elevationOptions' || groupKey === 'isFamilyOptions' || groupKey === 'hasOvernightOptions') {
    const arr = formData.customFilters?.[groupKey];
    if (Array.isArray(arr)) return arr;
    if (groupKey === 'seasons' && formData.season) return [formData.season];
    if (groupKey === 'transport' && formData.transport) return [formData.transport];
    if (groupKey === 'durationOptions' && formData.duration) return [formData.duration];
    if (groupKey === 'difficultyLevels' && formData.difficulty != null) return [String(formData.difficulty)];
    if (groupKey === 'distanceOptions' && formData.customFilters?.distance) return [formData.customFilters.distance];
    if (groupKey === 'elevationOptions' && formData.customFilters?.elevationGain) return [formData.customFilters.elevationGain];
    if (groupKey === 'isFamilyOptions' && formData.isFamily) return ['Да'];
    if (groupKey === 'hasOvernightOptions' && formData.hasOvernight) return ['Да'];
    return [];
  }
  return formData.customFilters?.[groupKey] || [];
}

function getFormSnapshot(data) {
  const cf = data.customFilters && typeof data.customFilters === 'object' ? data.customFilters : {};
  const first = (key) => (Array.isArray(cf[key]) ? cf[key][0] : null);
  return {
    title: data.title ?? '',
    description: data.description ?? '',
    shortDescription: data.shortDescription ?? '',
    season: first('seasons') ?? data.season ?? '',
    duration: first('durationOptions') ?? data.duration ?? '',
    difficulty: Number(first('difficultyLevels') || data.difficulty) || 3,
    transport: first('transport') ?? data.transport ?? '',
    customFilters: cf,
    isFamily: (Array.isArray(cf.isFamilyOptions) ? cf.isFamilyOptions : []).includes('Да') || !!data.isFamily,
    hasOvernight: (Array.isArray(cf.hasOvernightOptions) ? cf.hasOvernightOptions : []).includes('Да') || !!data.hasOvernight,
    whatToBring: data.whatToBring ?? '',
    importantInfo: data.importantInfo ?? '',
    isActive: !!data.isActive,
    images: Array.isArray(data.images) ? [...data.images] : [],
    placeIds: Array.isArray(data.placeIds) ? [...data.placeIds] : [],
  };
}

function formSnapshotsEqual(a, b) {
  return JSON.stringify(getFormSnapshot(a)) === JSON.stringify(getFormSnapshot(b));
}

export default function RouteEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const setHeaderRight = useContext(AdminHeaderRightContext)?.setHeaderRight;
  const setBreadcrumbLabel = useContext(AdminBreadcrumbContext)?.setBreadcrumbLabel;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    season: '',
    duration: '',
    difficulty: 3,
    transport: '',
    customFilters: {},
    isFamily: false,
    hasOvernight: false,
    whatToBring: '',
    importantInfo: '',
    isActive: true,
    images: [],
    placeIds: [],
  });

  const [allPlaces, setAllPlaces] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    seasons: [],
    transport: [],
    durationOptions: [],
    difficultyLevels: [],
    distanceOptions: [],
    elevationOptions: [],
    isFamilyOptions: [],
    hasOvernightOptions: [],
    extraGroups: [],
  });
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [placesSearch, setPlacesSearch] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [addFilterModalOpen, setAddFilterModalOpen] = useState(false);
  const [addFilterSelectedGroups, setAddFilterSelectedGroups] = useState([]);
  const [addedFilterGroups, setAddedFilterGroups] = useState([]);
  const savedFormDataRef = useRef(null);

  const isDirty = useMemo(() => {
    if (isNew) return false;
    if (!savedFormDataRef.current) return false;
    return !formSnapshotsEqual(formData, savedFormDataRef.current);
  }, [isNew, formData]);

  const goToList = useCallback(() => {
    setLeaveModalOpen(false);
    router.push('/admin/routes');
  }, [router]);

  const handleCancelClick = useCallback(() => {
    if (isDirty) {
      setLeaveModalOpen(true);
    } else {
      router.push('/admin/routes');
    }
  }, [isDirty, router]);

  useEffect(() => {
    if (!isNew) {
      fetchRoute();
    }
  }, [params.id]);

  const fetchPlaces = useCallback(async () => {
    try {
      const response = await placesAPI.getAll({ limit: 500 });
      setAllPlaces(response.data.items || []);
    } catch (error) {
      console.error('Ошибка загрузки мест:', error);
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await routeFiltersAPI.get();
      const d = res.data || {};
      const extra = Array.isArray(d.extraGroups) ? d.extraGroups : [];
      setFilterOptions({
        seasons: Array.isArray(d.seasons) ? d.seasons : [],
        transport: Array.isArray(d.transport) ? d.transport : [],
        durationOptions: Array.isArray(d.durationOptions) ? d.durationOptions : [],
        difficultyLevels: Array.isArray(d.difficultyLevels) ? d.difficultyLevels : [],
        distanceOptions: Array.isArray(d.distanceOptions) ? d.distanceOptions : [],
        elevationOptions: Array.isArray(d.elevationOptions) ? d.elevationOptions : [],
        isFamilyOptions: Array.isArray(d.isFamilyOptions) ? d.isFamilyOptions : [],
        hasOvernightOptions: Array.isArray(d.hasOvernightOptions) ? d.hasOvernightOptions : [],
        extraGroups: extra.filter((g) => g && typeof g.key === 'string' && g.key.trim()),
      });
    } catch (e) {
      console.error('Ошибка загрузки опций фильтров маршрутов:', e);
    }
  }, []);

  useEffect(() => {
    fetchPlaces();
    fetchFilterOptions();
  }, [fetchPlaces, fetchFilterOptions]);

  useEffect(() => {
    if (isNew) return;
    if (!savedFormDataRef.current) return;
    setAddedFilterGroups((prev) => [...new Set([...deriveAddedFilterGroups(savedFormDataRef.current, filterOptions), ...prev])]);
  }, [isNew, filterOptions]);

  const fetchRoute = async () => {
    try {
      const response = await routesAPI.getById(params.id);
      const raw = response.data.customFilters && typeof response.data.customFilters === 'object' ? response.data.customFilters : {};
      const customFilters = {
        ...raw,
        seasons: Array.isArray(raw.seasons) ? raw.seasons : (response.data.season ? [response.data.season] : []),
        transport: Array.isArray(raw.transport) ? raw.transport : (response.data.transport ? [response.data.transport] : []),
        durationOptions: Array.isArray(raw.durationOptions) ? raw.durationOptions : (response.data.duration ? [response.data.duration] : []),
        difficultyLevels: Array.isArray(raw.difficultyLevels) ? raw.difficultyLevels : (response.data.difficulty != null ? [String(response.data.difficulty)] : []),
        distanceOptions: Array.isArray(raw.distanceOptions) ? raw.distanceOptions : (raw.distance ? [raw.distance] : []),
        elevationOptions: Array.isArray(raw.elevationOptions) ? raw.elevationOptions : (raw.elevationGain ? [raw.elevationGain] : []),
        isFamilyOptions: Array.isArray(raw.isFamilyOptions) ? raw.isFamilyOptions : (response.data.isFamily ? ['Да'] : []),
        hasOvernightOptions: Array.isArray(raw.hasOvernightOptions) ? raw.hasOvernightOptions : (response.data.hasOvernight ? ['Да'] : []),
      };
      const next = {
        ...response.data,
        placeIds: response.data.placeIds || [],
        customFilters,
      };
      setFormData(next);
      savedFormDataRef.current = next;
    } catch (error) {
      console.error('Ошибка загрузки маршрута:', error);
      setError('Маршрут не найден');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!setBreadcrumbLabel) return;
    const label = formData.title?.trim() || (isNew ? 'Новый маршрут' : '');
    setBreadcrumbLabel(label);
    return () => setBreadcrumbLabel(null);
  }, [setBreadcrumbLabel, formData.title, isNew]);

  useEffect(() => {
    if (!setHeaderRight) return;
    const submitLabel = isSaving
      ? 'Сохранение...'
      : isNew
        ? 'Создать маршрут'
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
          form="route-form"
          className={submitClassName}
          disabled={isSaving}
        >
          {submitLabel}
        </button>
      </div>
    );
    return () => setHeaderRight(null);
  }, [setHeaderRight, formData.isActive, isSaving, isNew, isDirty, handleCancelClick]);

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
      const cf = formData.customFilters && typeof formData.customFilters === 'object' ? formData.customFilters : {};
      const first = (key) => (Array.isArray(cf[key]) ? cf[key][0] : null);
      const dataToSend = {
        ...formData,
        season: first('seasons') ?? formData.season ?? '',
        transport: first('transport') ?? formData.transport ?? '',
        duration: first('durationOptions') ?? formData.duration ?? '',
        difficulty: parseInt(first('difficultyLevels') || formData.difficulty, 10) || 3,
        isFamily: (Array.isArray(cf.isFamilyOptions) ? cf.isFamilyOptions : []).includes('Да') || formData.isFamily,
        hasOvernight: (Array.isArray(cf.hasOvernightOptions) ? cf.hasOvernightOptions : []).includes('Да') || formData.hasOvernight,
        distance: null,
        elevationGain: null,
        customFilters: {
          distance: first('distanceOptions') ?? cf.distance ?? null,
          elevationGain: first('elevationOptions') ?? cf.elevationGain ?? null,
          ...Object.fromEntries(
            Object.entries(cf).filter(
              ([k]) => !['seasons', 'transport', 'durationOptions', 'difficultyLevels', 'distanceOptions', 'elevationOptions', 'isFamilyOptions', 'hasOvernightOptions'].includes(k)
            )
          ),
        },
      };

      if (isNew) {
        const res = await routesAPI.create(dataToSend);
        const created = res.data;
        setShowToast(true);
        setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
        if (created?.id) {
          router.replace(`/admin/routes/${created.id}`);
        } else {
          router.push('/admin/routes');
        }
      } else {
        await routesAPI.update(params.id, dataToSend);
        savedFormDataRef.current = {
          ...formData,
          ...dataToSend,
          images: [...(formData.images || [])],
          placeIds: [...(formData.placeIds || [])],
          customFilters: formData.customFilters && typeof formData.customFilters === 'object' ? { ...formData.customFilters } : {},
        };
        setShowToast(true);
        setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setError(error.response?.data?.message || 'Ошибка сохранения маршрута');
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
          {isNew ? 'Новый маршрут' : 'Редактирование маршрута'}
        </h1>
      </div>

      <form id="route-form" onSubmit={handleSubmit} className={styles.formContainer}>
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

        {/* Параметры маршрута: в модалке только выбор группы, значения выбираются здесь (можно несколько) */}
        <div className={styles.formGroup}>
          <div className={styles.filtersSection}>
            <label className={styles.formLabel}>Параметры маршрута</label>
            <p className={styles.imageHint} style={{ marginBottom: 16 }}>
              Группы задаются в «Фильтры маршрутов» (список маршрутов). Нажмите «Добавить параметр», выберите группу — значения выбираются ниже на экране (можно несколько).
            </p>
            {addedFilterGroups.length > 0 && (
              <div className={styles.filterGroups} style={{ marginBottom: 16 }}>
                {addedFilterGroups.map((groupKey) => {
                  const g = getGroupByKey(filterOptions, groupKey);
                  if (!g) return null;
                  return (
                    <div key={groupKey} className={styles.filterGroupCard}>
                      <div className={styles.filterGroupTitle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <span>{g.label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAddedFilterGroups((prev) => prev.filter((k) => k !== groupKey));
                            setFormData((prev) => clearFilter(prev, groupKey));
                          }}
                          className={styles.deleteBtn}
                          title="Удалить параметр"
                          aria-label={`Удалить ${g.label}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {g.type === 'input' ? (
                        <input
                          type="text"
                          value={getCurrentValueForGroup(formData, groupKey, 'input')}
                          onChange={(e) => setFormData((prev) => applyFilter(prev, groupKey, e.target.value.trim(), 'input'))}
                          className={styles.formInput}
                          placeholder="Введите значение"
                          aria-label={g.label}
                        />
                      ) : (
                        <div className={styles.filterCheckboxList}>
                          {(g.values || []).map((v) => {
                            const selected = getCurrentValueForGroup(formData, groupKey, g.type === 'multi' ? 'multi' : 'single');
                            const arr = Array.isArray(selected) ? selected : [];
                            const checked = arr.includes(v);
                            return (
                              <label key={v} className={styles.filterCheckboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const next = checked ? arr.filter((x) => x !== v) : [...arr, v];
                                    setFormData((prev) => applyFilter(prev, groupKey, next, 'multi'));
                                  }}
                                />
                                <span>{v}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setAddFilterSelectedGroups([]);
                setAddFilterModalOpen(true);
              }}
              className={styles.addBtn}
            >
              <Plus size={18} /> Добавить параметр
            </button>
          </div>
        </div>

        {/* Модалка: только выбор группы, значения выбираются на экране маршрута */}
        {addFilterModalOpen && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => e.target === e.currentTarget && setAddFilterModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-filter-title"
          >
            <div className={styles.modalDialog} style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 id="add-filter-title" className={styles.modalTitle}>Добавить параметр</h2>
                <button type="button" onClick={() => setAddFilterModalOpen(false)} className={styles.modalClose} aria-label="Закрыть">
                  <X size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.imageHint} style={{ marginBottom: 16 }}>
                  Отметьте группы, которые хотите добавить. Значения для них вы выберете на экране создания маршрута (можно несколько).
                </p>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Параметры</label>
                  <div className={`${styles.filterCheckboxList} ${styles.addParamCheckboxGrid}`}>
                    {getAvailableGroups(filterOptions)
                      .filter((gr) => !addedFilterGroups.includes(gr.key))
                      .map((gr) => (
                        <label key={gr.key} className={styles.filterCheckboxLabel}>
                          <input
                            type="checkbox"
                            checked={addFilterSelectedGroups.includes(gr.key)}
                            onChange={() => {
                              setAddFilterSelectedGroups((prev) =>
                                prev.includes(gr.key) ? prev.filter((k) => k !== gr.key) : [...prev, gr.key]
                              );
                            }}
                          />
                          <span>{gr.label}</span>
                        </label>
                      ))}
                  </div>
                  {getAvailableGroups(filterOptions).filter((gr) => !addedFilterGroups.includes(gr.key)).length === 0 && (
                    <p className={styles.imageHint} style={{ marginTop: 8 }}>
                      Все доступные параметры уже добавлены к маршруту.
                    </p>
                  )}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setAddFilterModalOpen(false)} className={styles.cancelBtn}>
                  Отмена
                </button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={() => {
                    setAddedFilterGroups((prev) => [...new Set([...prev, ...addFilterSelectedGroups])]);
                    setAddFilterModalOpen(false);
                  }}
                  disabled={addFilterSelectedGroups.length === 0}
                >
                  Добавить выбранные
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Секция выбора мест маршрута — тот же стиль, что и «Места рядом» в форме места */}
        <div className={styles.formGroup} style={{ marginTop: 30 }}>
          <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} />
            <span>Места на маршруте ({formData.placeIds.length})</span>
          </label>

          {formData.placeIds.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p className={styles.formListHint}>
                Порядок мест на маршруте (можно изменить):
              </p>
              <div className={styles.formCardList}>
                {formData.placeIds.map((placeId, index) => {
                  const place = getPlaceById(placeId);
                  if (!place) return null;
                  return (
                    <div key={placeId} className={styles.formCardRow}>
                      <div className={styles.formMoveButtons}>
                        <button
                          type="button"
                          onClick={() => movePlace(index, -1)}
                          disabled={index === 0}
                          className={styles.formMoveBtn}
                          aria-label="Поднять"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePlace(index, 1)}
                          disabled={index === formData.placeIds.length - 1}
                          className={styles.formMoveBtn}
                          aria-label="Опустить"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      <span className={styles.formOrderBadge}>{index + 1}</span>
                      {place.image && (
                        <img src={getImageUrl(place.image)} alt="" />
                      )}
                      <div className={styles.formCardRowContent}>
                        <div className={styles.formCardRowTitle}>{place.title}</div>
                        {place.location && (
                          <div className={styles.formCardRowSub}>{place.location}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePlace(placeId)}
                        className={styles.deleteBtn}
                        title="Удалить"
                        aria-label="Удалить"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.formAddPlaceWrap}>
            <div className={styles.formAddPlaceSearch}>
              <input
                type="text"
                placeholder="Поиск мест для добавления..."
                value={placesSearch}
                onChange={(e) => setPlacesSearch(e.target.value)}
                className={styles.formInput}
                aria-label="Поиск мест"
              />
            </div>
            {filteredPlaces.length > 0 ? (
              <div className={styles.formAddPlaceList}>
                {filteredPlaces.map((place) => (
                  <div
                    key={place.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => addPlace(place.id)}
                    onKeyDown={(e) => e.key === 'Enter' && addPlace(place.id)}
                    className={styles.formAddPlaceItem}
                  >
                    {place.image && (
                      <img src={getImageUrl(place.image)} alt="" />
                    )}
                    <div className={styles.formAddPlaceItemTitle}>
                      <div>{place.title}</div>
                      {place.location && (
                        <div className={styles.formAddPlaceItemSub}>{place.location}</div>
                      )}
                    </div>
                    <span className={styles.formAddPlaceLabel}>+ Добавить</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.formEmptyHint}>
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

      </form>

      <ConfirmModal
        open={leaveModalOpen}
        title="Несохранённые изменения"
        message="Есть несохранённые изменения. Вы уверены, что хотите уйти? Они будут потеряны."
        confirmLabel="Уйти без сохранения"
        cancelLabel="Остаться"
        variant="danger"
        dialogStyle={{ maxWidth: 500 }}
        onCancel={() => setLeaveModalOpen(false)}
        onConfirm={goToList}
      />

      {showToast && (
        <div className={styles.toast} role="status">
          Изменения успешно сохранены
        </div>
      )}
    </div>
  );
}
