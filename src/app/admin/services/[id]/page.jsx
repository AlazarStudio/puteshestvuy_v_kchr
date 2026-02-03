'use client';

import { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { servicesAPI, mediaAPI, getImageUrl } from '@/lib/api';
import RichTextEditor from '@/components/RichTextEditor';
import { CATEGORY_TO_TEMPLATE_KEY } from '@/sections/Services/ServiceDetail/serviceTypeTemplates';
import { SERVICE_TYPE_FIELDS } from '@/sections/Services/ServiceDetail/serviceTypeFields';
import { AdminHeaderRightContext, AdminBreadcrumbContext } from '../../layout';
import ConfirmModal from '../../components/ConfirmModal';
import { MUI_ICON_NAMES, MUI_ICONS, getMuiIconComponent, getIconGroups } from '../../components/WhatToBringIcons';
import styles from '../../admin.module.css';

const TOAST_DURATION_MS = 3000;

/** Определяет тип контакта по значению и возвращает подходящий href (tel:/mailto:/https:). В tel: только цифры, без скобок и пробелов. */
function deriveContactHref(value) {
  const v = (value || '').trim();
  if (!v) return '';
  const digits = v.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15) {
    const prefix = v.startsWith('+') ? '+' : '';
    return `tel:${prefix}${digits}`;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^www\./i.test(v)) return `https://${v}`;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(v)) return `https://${v}`;
  return '';
}

const categories = [
  'Гид',
  'Активности',
  'Прокат оборудования',
  'Пункты придорожного сервиса',
  'Торговые точки',
  'Сувениры',
  'Гостиница',
  'Кафе и ресторан',
  'Трансфер',
  'АЗС',
  'Санитарные узлы',
  'Пункт медпомощи',
  'МВД',
  'Пожарная охрана',
  'Туроператор',
  'Торговая точка',
  'Придорожный пункт',
];

function getTemplateKey(category) {
  return CATEGORY_TO_TEMPLATE_KEY[category] || 'guide';
}

/** Снимок формы для проверки несохранённых изменений */
function getFormSnapshot(data) {
  const imageKeys = (data.images || []).map((item) =>
    item.type === 'url' ? item.value : `file:${item.value?.name ?? ''}`
  );
  const rawData = data.data || {};
  const dataForSnapshot = { ...rawData };
  if (rawData.avatar != null) {
    dataForSnapshot.avatar = rawData.avatar.type === 'url' ? rawData.avatar.value : `file:${rawData.avatar.value?.name ?? ''}`;
  }
  if (Array.isArray(rawData.galleryImages)) {
    dataForSnapshot.galleryImages = rawData.galleryImages.map((item) =>
      item.type === 'url' ? item.value : `file:${item.value?.name ?? ''}`
    );
  }
  return {
    title: (data.title ?? '').trim(),
    category: data.category ?? 'Гид',
    isActive: !!data.isActive,
    isVerified: !!data.isVerified,
    data: JSON.stringify(dataForSnapshot),
    images: imageKeys.join(','),
  };
}

export default function ServiceEditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const isNew = params.id === 'new';
  const setHeaderRight = useContext(AdminHeaderRightContext)?.setHeaderRight;
  const setBreadcrumbLabel = useContext(AdminBreadcrumbContext)?.setBreadcrumbLabel;

  const [formData, setFormData] = useState({
    title: '',
    category: 'Гид',
    images: [],
    isActive: true,
    isVerified: false,
    data: {},
  });

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  /** Снимок последнего сохранённого состояния (строка) — для надёжного сравнения и обновления UI */
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(null);
  const certificateFileInputRef = useRef(null);
  const certificateFieldKeyRef = useRef(null);
  /** Выбор иконки контакта: ключ поля (например contacts), индекс элемента в списке */
  const [contactIconPickerKey, setContactIconPickerKey] = useState(null);
  const [contactIconPickerIndex, setContactIconPickerIndex] = useState(null);
  const [contactIconSearch, setContactIconSearch] = useState('');
  const [contactIconGroup, setContactIconGroup] = useState('all');

  const currentSnapshot = useMemo(() => JSON.stringify(getFormSnapshot(formData)), [formData]);
  const isDirty = useMemo(() => {
    if (isNew) return false;
    if (lastSavedSnapshot === null) return false;
    return currentSnapshot !== lastSavedSnapshot;
  }, [isNew, currentSnapshot, lastSavedSnapshot]);

  const goToList = useCallback(() => {
    setLeaveModalOpen(false);
    navigate('/admin/services');
  }, [navigate]);

  const handleCancelClick = useCallback(() => {
    if (isDirty) {
      setLeaveModalOpen(true);
    } else {
      navigate('/admin/services');
    }
  }, [isDirty, navigate]);

  useEffect(() => {
    if (!isNew) fetchService();
  }, [params.id, isNew]);

  useEffect(() => {
    if (!setBreadcrumbLabel) return;
    const label = formData.title?.trim() || (isNew ? 'Новая услуга' : '');
    setBreadcrumbLabel(label);
    return () => setBreadcrumbLabel(null);
  }, [setBreadcrumbLabel, formData.title, isNew]);

  useEffect(() => {
    if (!setHeaderRight) return;
    const submitLabel = isSaving
      ? 'Сохранение...'
      : isNew
        ? 'Создать услугу'
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
        <button type="button" onClick={handleCancelClick} className={styles.headerCancelBtn}>
          Назад
        </button>
        <button type="submit" form="service-form" className={submitClassName} disabled={isSaving}>
          {submitLabel}
        </button>
      </div>
    );
    return () => setHeaderRight(null);
  }, [setHeaderRight, formData.isActive, isSaving, isNew, isDirty, handleCancelClick]);

  const fetchService = async () => {
    try {
      setError('');
      const response = await servicesAPI.getById(params.id);
      const data = response.data;
      const rawData = data.data != null && typeof data.data === 'object' ? data.data : {};
      const certs = rawData.certificatesInData;
      const certificatesInData = Array.isArray(certs)
        ? certs.map((c) =>
            typeof c === 'string' ? { url: c, caption: '' } : { url: c?.url ?? '', caption: c?.caption ?? '' }
          )
        : [];
      const isGuide = data.category === 'Гид';
      const mainImages = Array.isArray(data.images) ? data.images : [];
      let guideAvatar = rawData.avatar;
      let guideGalleryImages = rawData.galleryImages;
      if (isGuide) {
        if (guideAvatar == null && mainImages[0]) guideAvatar = mainImages[0];
        if (!Array.isArray(guideGalleryImages) && mainImages.length > 1) guideGalleryImages = mainImages.slice(1);
        if (!Array.isArray(guideGalleryImages)) guideGalleryImages = [];
      }
      const next = {
        title: data.title ?? '',
        category: data.category ?? 'Гид',
        images: isGuide ? [] : mainImages.map((url) => ({ type: 'url', value: url })),
        isActive: data.isActive !== false,
        isVerified: data.isVerified === true,
        data: {
          ...rawData,
          certificatesInData,
          ...(isGuide && {
            avatar: guideAvatar ? { type: 'url', value: guideAvatar } : null,
            galleryImages: guideGalleryImages.map((url) => ({ type: 'url', value: url })),
            galleryEnabled: rawData.galleryEnabled !== false,
          }),
        },
      };
      setFormData(next);
      setLastSavedSnapshot(JSON.stringify(getFormSnapshot(next)));
    } catch (err) {
      console.error('Ошибка загрузки услуги:', err);
      setError('Услуга не найдена');
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

  const setData = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newItems = files.map((file) => ({
      type: 'file',
      value: file,
      preview: URL.createObjectURL(file),
    }));
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newItems],
    }));
    e.target.value = '';
  };

  const removeImage = (index) => {
    setFormData((prev) => {
      const item = prev.images[index];
      if (item?.type === 'file' && item.preview) URL.revokeObjectURL(item.preview);
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      };
    });
  };

  const setMainImage = (index) => {
    if (index === 0) return;
    setFormData((prev) => {
      const item = prev.images[index];
      const rest = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: [item, ...rest] };
    });
  };

  const setGuideAvatar = (item) => {
    setFormData((prev) => ({
      ...prev,
      data: { ...prev.data, avatar: item },
    }));
  };

  const removeGuideAvatar = () => {
    setFormData((prev) => {
      const prevAvatar = prev.data?.avatar;
      if (prevAvatar?.type === 'file' && prevAvatar.preview) URL.revokeObjectURL(prevAvatar.preview);
      return { ...prev, data: { ...prev.data, avatar: null } };
    });
  };

  const handleGuideAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setGuideAvatar({ type: 'file', value: file, preview: URL.createObjectURL(file) });
  };

  const setGuideGalleryImages = (list) => {
    setFormData((prev) => ({ ...prev, data: { ...prev.data, galleryImages: list } }));
  };

  const handleGuideGalleryUpload = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    const newItems = files.map((file) => ({
      type: 'file',
      value: file,
      preview: URL.createObjectURL(file),
    }));
    setFormData((prev) => ({
      ...prev,
      data: { ...prev.data, galleryImages: [...(prev.data?.galleryImages ?? []), ...newItems] },
    }));
  };

  const removeGuideGalleryImage = (index) => {
    setFormData((prev) => {
      const list = prev.data?.galleryImages ?? [];
      const item = list[index];
      if (item?.type === 'file' && item.preview) URL.revokeObjectURL(item.preview);
      return {
        ...prev,
        data: { ...prev.data, galleryImages: list.filter((_, i) => i !== index) },
      };
    });
  };

  const handleCertificateFileAdd = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const key = certificateFieldKeyRef.current;
    if (!key) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await mediaAPI.upload(fd);
      if (res.data?.url) {
        setFormData((prev) => {
          const list = prev.data?.[key] ?? [];
          return { ...prev, data: { ...prev.data, [key]: [...list, { url: res.data.url, caption: '' }] } };
        });
      }
    } catch (err) {
      console.error('Ошибка загрузки сертификата:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const imageUrls = [];
      const isGuide = formData.category === 'Гид';
      let resolvedGuideAvatar = '';
      let resolvedGuideGallery = [];

      if (isGuide) {
        const avatarItem = formData.data?.avatar;
        if (avatarItem?.type === 'url') resolvedGuideAvatar = avatarItem.value;
        else if (avatarItem?.type === 'file') {
          const fd = new FormData();
          fd.append('file', avatarItem.value);
          const res = await mediaAPI.upload(fd);
          if (res.data?.url) resolvedGuideAvatar = res.data.url;
        }
        const galleryItems = formData.data?.galleryImages ?? [];
        for (const item of galleryItems) {
          if (item.type === 'url') resolvedGuideGallery.push(item.value);
          else {
            const fd = new FormData();
            fd.append('file', item.value);
            const res = await mediaAPI.upload(fd);
            if (res.data?.url) resolvedGuideGallery.push(res.data.url);
          }
        }
        if (resolvedGuideAvatar) imageUrls.push(resolvedGuideAvatar);
        imageUrls.push(...resolvedGuideGallery);
      } else {
        for (const item of formData.images) {
          if (item.type === 'url') imageUrls.push(item.value);
          else {
            const fd = new FormData();
            fd.append('file', item.value);
            const res = await mediaAPI.upload(fd);
            if (res.data?.url) imageUrls.push(res.data.url);
          }
        }
      }

      const dataToSave = { ...formData.data };
      if (isGuide) {
        dataToSave.avatar = resolvedGuideAvatar;
        dataToSave.galleryImages = resolvedGuideGallery;
        dataToSave.galleryEnabled = formData.data?.galleryEnabled !== false;
      }
      if (Array.isArray(dataToSave.contacts)) {
        dataToSave.contacts = dataToSave.contacts.map((c) => {
          const href = c?.href ?? '';
          if (typeof href === 'string' && href.startsWith('tel:')) {
            const rest = href.slice(4);
            const digits = rest.replace(/\D/g, '');
            const prefix = rest.startsWith('+') ? '+' : '';
            return { ...c, href: `tel:${prefix}${digits}` };
          }
          return c;
        });
      }
      const payload = {
        title: formData.title.trim(),
        category: formData.category || null,
        images: imageUrls,
        isActive: formData.isActive,
        isVerified: formData.category === 'Гид' ? formData.isVerified : false,
        data: dataToSave,
      };

      if (isNew) {
        const res = await servicesAPI.create(payload);
        const created = res.data;
        if (isGuide) {
          if (formData.data?.avatar?.type === 'file' && formData.data.avatar.preview) URL.revokeObjectURL(formData.data.avatar.preview);
          (formData.data?.galleryImages ?? []).forEach((item) => {
            if (item?.type === 'file' && item.preview) URL.revokeObjectURL(item.preview);
          });
        }
        setShowToast(true);
        setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
        if (created?.id) {
          navigate(`/admin/services/${created.id}`, { replace: true });
        }
      } else {
        await servicesAPI.update(params.id, payload);
        if (isGuide) {
          if (formData.data?.avatar?.type === 'file' && formData.data.avatar.preview) URL.revokeObjectURL(formData.data.avatar.preview);
          (formData.data?.galleryImages ?? []).forEach((item) => {
            if (item?.type === 'file' && item.preview) URL.revokeObjectURL(item.preview);
          });
        } else {
          formData.images.forEach((item) => {
            if (item?.type === 'file' && item.preview) URL.revokeObjectURL(item.preview);
          });
        }
        const nextFormData = {
          ...formData,
          title: formData.title.trim(),
          images: isGuide ? [] : imageUrls.map((url) => ({ type: 'url', value: url })),
          isVerified: formData.isVerified,
          data: {
            ...dataToSave,
            ...(isGuide && {
              avatar: resolvedGuideAvatar ? { type: 'url', value: resolvedGuideAvatar } : null,
              galleryImages: resolvedGuideGallery.map((url) => ({ type: 'url', value: url })),
            }),
          },
        };
        const snapshotAfterSave = JSON.stringify(getFormSnapshot(nextFormData));
        setFormData(nextFormData);
        setLastSavedSnapshot(snapshotAfterSave);
        setShowToast(true);
        setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
      }
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError(err.response?.data?.message || 'Ошибка сохранения услуги');
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

  const templateKey = getTemplateKey(formData.category);
  const typeFields = SERVICE_TYPE_FIELDS[templateKey] || [];

  const renderField = (field) => {
    const value = formData.data[field.key];
    const key = field.key;

    switch (field.type) {
      case 'richtext':
        return (
          <RichTextEditor
            value={value ?? ''}
            onChange={(v) => setData(key, v)}
            placeholder={field.label}
            minHeight={300}
          />
        );
      case 'textarea':
        return (
          <textarea
            className={styles.formInput}
            value={value ?? ''}
            onChange={(e) => setData(key, e.target.value)}
            rows={4}
            placeholder={field.label}
          />
        );
      case 'certificateList': {
        const list = Array.isArray(value) ? value : [];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className={styles.imageHint} style={{ marginBottom: 0 }}>
              Загрузите изображения сертификатов и при необходимости укажите подпись к каждому.
            </p>
            {list.map((item, i) => (
              <div key={i} className={styles.formCardRow} style={{ alignItems: 'flex-start' }}>
                <div style={{ width: 100, height: 100, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9' }}>
                  {item.url ? (
                    <img src={getImageUrl(item.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Фото</div>
                  )}
                </div>
                <div className={styles.formCardRowContent} style={{ flex: 1, minWidth: 0 }}>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Подпись к сертификату"
                    value={item.caption ?? ''}
                    onChange={(e) => {
                      const next = [...list];
                      next[i] = { ...next[i], caption: e.target.value };
                      setData(key, next);
                    }}
                  />
                </div>
                <button type="button" onClick={() => setData(key, list.filter((_, j) => j !== i))} className={styles.deleteBtn} title="Удалить">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div>
              <input
                ref={certificateFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCertificateFileAdd}
              />
              <button
                type="button"
                onClick={() => {
                  certificateFieldKeyRef.current = key;
                  certificateFileInputRef.current?.click();
                }}
                className={styles.addBtn}
              >
                <Plus size={14} /> Добавить сертификат
              </button>
            </div>
          </div>
        );
      }
      case 'tags': {
        const arr = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',').map((s) => s.trim()).filter(Boolean) : []);
        const str = arr.join(', ');
        return (
          <input
            type="text"
            className={styles.formInput}
            value={str}
            onChange={(e) => setData(key, e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            placeholder="тег1, тег2, тег3"
          />
        );
      }
      case 'contactList': {
        const list = Array.isArray(value) ? value : [];
        const normalizeItem = (c) => ({
          label: c?.label ?? '',
          value: c?.value ?? '',
          href: c?.href ?? '',
          iconType: c?.iconType ?? 'mui',
          icon: c?.icon ?? '',
        });
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p className={styles.imageHint} style={{ marginBottom: 0 }}>
              Подпись и значение. Тип (телефон, почта, ссылка) определяется по значению автоматически; ссылка подставляется без редактирования. Иконка — загрузка или из библиотеки.
            </p>
            {list.map((item, i) => {
              const it = normalizeItem(item);
              const effectiveHref = deriveContactHref(it.value) || it.href;
              return (
                <div key={i} className={styles.whatToBringBlock}>
                  <div className={styles.whatToBringIconCell}>
                    <div className={styles.whatToBringTypeSwitcher} role="group" aria-label="Источник иконки">
                      <button
                        type="button"
                        className={`${styles.whatToBringTypeSegment} ${it.iconType === 'upload' ? styles.whatToBringTypeSegmentActive : ''}`}
                        onClick={() => {
                          const next = list.map((c, j) => (j === i ? { ...normalizeItem(c), iconType: 'upload', icon: '' } : normalizeItem(c)));
                          setData(key, next);
                        }}
                      >
                        Загрузить
                      </button>
                      <button
                        type="button"
                        className={`${styles.whatToBringTypeSegment} ${it.iconType === 'mui' ? styles.whatToBringTypeSegmentActive : ''}`}
                        onClick={() => {
                          const next = list.map((c, j) => (j === i ? { ...normalizeItem(c), iconType: 'mui', icon: it.iconType === 'mui' ? it.icon : '' } : normalizeItem(c)));
                          setData(key, next);
                        }}
                      >
                        Библиотека
                      </button>
                    </div>
                    <div className={styles.whatToBringIconPreview}>
                      {it.iconType === 'upload' ? (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            id={`contact-upload-${key}-${i}`}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const fd = new FormData();
                                fd.append('file', file);
                                const res = await mediaAPI.upload(fd);
                                if (res.data?.url) {
                                  const next = list.map((c, j) => (j === i ? { ...normalizeItem(c), icon: res.data.url } : normalizeItem(c)));
                                  setData(key, next);
                                }
                              } catch (err) {
                                console.error(err);
                              }
                              e.target.value = '';
                            }}
                          />
                          <label htmlFor={`contact-upload-${key}-${i}`} className={styles.whatToBringUploadBtn}>
                            {it.icon ? (
                              <img src={getImageUrl(it.icon)} alt="" className={styles.whatToBringUploadImg} />
                            ) : (
                              <Upload size={24} />
                            )}
                          </label>
                        </>
                      ) : (
                        <button
                          type="button"
                          className={styles.whatToBringMuiBtn}
                          onClick={() => {
                            setContactIconGroup('all');
                            setContactIconSearch('');
                            setContactIconPickerKey(key);
                            setContactIconPickerIndex(i);
                          }}
                          title="Выбрать иконку"
                        >
                          {it.icon && getMuiIconComponent(it.icon) ? (() => {
                            const Icon = getMuiIconComponent(it.icon);
                            return <Icon size={28} />;
                          })() : (
                            <span className={styles.whatToBringMuiPlaceholder}>Иконка</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Подпись"
                      value={it.label}
                      onChange={(e) => {
                        const next = list.map((c, j) => (j === i ? { ...normalizeItem(c), label: e.target.value } : normalizeItem(c)));
                        setData(key, next);
                      }}
                    />
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Значение (номер, почта или ссылка)"
                      value={it.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        const next = list.map((c, j) =>
                          j === i ? { ...normalizeItem(c), value: val, href: deriveContactHref(val) } : normalizeItem(c)
                        );
                        setData(key, next);
                      }}
                    />
                    <input
                      type="text"
                      className={styles.formInput}
                      readOnly
                      placeholder="Ссылка"
                      value={effectiveHref}
                      title={effectiveHref || 'Подставляется по значению'}
                      style={{ backgroundColor: '#f1f5f9', cursor: 'default' }}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => setData(key, list.filter((_, j) => j !== i).map(normalizeItem))}
                    title="Удалить"
                    aria-label="Удалить"
                  >
                    <X size={18} />
                  </button>
                </div>
              );
            })}
            <div className={styles.whatToBringAddWrap}>
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => setData(key, [...list.map(normalizeItem), { label: '', value: '', href: '', iconType: 'mui', icon: '' }])}
              >
                <Plus size={18} /> Добавить контакт
              </button>
            </div>
            {contactIconPickerKey === key && contactIconPickerIndex !== null && (
              <div
                className={styles.modalOverlay}
                onClick={(e) => e.target === e.currentTarget && (setContactIconPickerKey(null), setContactIconPickerIndex(null))}
                role="dialog"
                aria-modal="true"
                aria-label="Выбор иконки"
              >
                <div className={styles.modalDialog} style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Выберите иконку</h2>
                    <button
                      type="button"
                      onClick={() => { setContactIconPickerKey(null); setContactIconPickerIndex(null); }}
                      className={styles.modalClose}
                      aria-label="Закрыть"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className={styles.modalBody} style={{ maxHeight: 440, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.whatToBringIconFilters}>
                      <input
                        type="search"
                        className={styles.whatToBringIconSearch}
                        placeholder="Поиск иконки..."
                        value={contactIconSearch}
                        onChange={(e) => setContactIconSearch(e.target.value)}
                        aria-label="Поиск иконки"
                        autoComplete="off"
                      />
                      <select
                        className={styles.whatToBringIconGroupSelect}
                        value={contactIconGroup}
                        onChange={(e) => setContactIconGroup(e.target.value)}
                        aria-label="Группа иконок"
                      >
                        <option value="all">Все иконки</option>
                        {getIconGroups().map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label} ({g.iconNames.length})
                          </option>
                        ))}
                      </select>
                    </div>
                    {(() => {
                      const groups = getIconGroups();
                      const baseNames = contactIconGroup === 'all' ? MUI_ICON_NAMES : (groups.find((g) => g.id === contactIconGroup)?.iconNames ?? []);
                      const searchLower = (contactIconSearch || '').trim().toLowerCase();
                      const namesToShow = searchLower ? baseNames.filter((name) => name.toLowerCase().includes(searchLower)) : baseNames;
                      const currentList = Array.isArray(formData.data?.[key]) ? formData.data[key] : [];
                      return (
                        <>
                          <div className={styles.whatToBringIconGridWrap}>
                            {namesToShow.map((name) => {
                              const IconComponent = MUI_ICONS[name];
                              if (!IconComponent) return null;
                              return (
                                <button
                                  key={name}
                                  type="button"
                                  className={styles.whatToBringIconGridItem}
                                  onClick={() => {
                                    const next = currentList.map((c, j) =>
                                      j === contactIconPickerIndex ? { ...(typeof c === 'object' && c ? c : { label: '', value: '', href: '', iconType: 'mui', icon: '' }), iconType: 'mui', icon: name } : c
                                    );
                                    setData(key, next);
                                    setContactIconPickerKey(null);
                                    setContactIconPickerIndex(null);
                                    setContactIconSearch('');
                                    setContactIconGroup('all');
                                  }}
                                  title={name}
                                >
                                  <IconComponent size={28} />
                                </button>
                              );
                            })}
                          </div>
                          {namesToShow.length === 0 && (
                            <p className={styles.whatToBringIconEmpty}>В этой группе нет иконок.</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'stringList': {
        const list = Array.isArray(value) ? value : [];
        const text = list.join('\n');
        return (
          <textarea
            className={styles.formInput}
            value={text}
            onChange={(e) => setData(key, e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
            rows={5}
            placeholder="Один пункт на строку"
          />
        );
      }
      case 'equipmentList': {
        const list = Array.isArray(value) ? value : [];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  className={styles.formInput}
                  style={{ flex: 1, minWidth: 150 }}
                  placeholder="Название"
                  value={item.name ?? ''}
                  onChange={(e) => {
                    const next = [...list];
                    next[i] = { ...next[i], name: e.target.value };
                    setData(key, next);
                  }}
                />
                <input
                  type="text"
                  className={styles.formInput}
                  style={{ width: 180 }}
                  placeholder="Примечание"
                  value={item.note ?? ''}
                  onChange={(e) => {
                    const next = [...list];
                    next[i] = { ...next[i], note: e.target.value };
                    setData(key, next);
                  }}
                />
                <input
                  type="text"
                  className={styles.formInput}
                  style={{ width: 120 }}
                  placeholder="Цена"
                  value={item.price ?? ''}
                  onChange={(e) => {
                    const next = [...list];
                    next[i] = { ...next[i], price: e.target.value };
                    setData(key, next);
                  }}
                />
                <button type="button" onClick={() => setData(key, list.filter((_, j) => j !== i))} className={styles.deleteBtn} title="Удалить">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setData(key, [...list, { name: '', note: '', price: '' }])}
              className={styles.addBtn}
              style={{ alignSelf: 'flex-start' }}
            >
              <Plus size={14} /> Добавить позицию
            </button>
          </div>
        );
      }
      case 'priceList': {
        const list = Array.isArray(value) ? value : [];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  className={styles.formInput}
                  style={{ flex: 1, minWidth: 0 }}
                  placeholder="Название"
                  value={item.name ?? ''}
                  onChange={(e) => {
                    const next = [...list];
                    next[i] = { ...next[i], name: e.target.value };
                    setData(key, next);
                  }}
                />
                <input
                  type="text"
                  className={styles.formInput}
                  style={{ flex: 1, minWidth: 0 }}
                  placeholder="Цена"
                  value={item.price ?? ''}
                  onChange={(e) => {
                    const next = [...list];
                    next[i] = { ...next[i], price: e.target.value };
                    setData(key, next);
                  }}
                />
                <button type="button" onClick={() => setData(key, list.filter((_, j) => j !== i))} className={styles.deleteBtn} title="Удалить">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setData(key, [...list, { name: '', price: '' }])}
              className={styles.addBtn}
              style={{ alignSelf: 'flex-start' }}
            >
              <Plus size={14} /> Добавить
            </button>
          </div>
        );
      }
      default:
        return (
          <input
            type="text"
            className={styles.formInput}
            value={value ?? ''}
            onChange={(e) => setData(key, e.target.value)}
            placeholder={field.label}
          />
        );
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
          {isNew ? 'Новая услуга' : 'Редактирование услуги'}
        </h1>
      </div>

      <form id="service-form" onSubmit={handleSubmit} className={styles.formContainer}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Название *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={styles.formInput}
            required
            placeholder="Название услуги или имя специалиста"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Тип услуги</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={styles.formSelect}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className={styles.formHintBox} style={{ marginTop: 12 }}>
            <span className={styles.formHintIcon}>💡</span>
            <span className={styles.formHintText}>
              Выберите тип услуги — ниже появятся поля шаблона для заполнения.
            </span>
          </div>
          {formData.category === 'Гид' && (
            <label className={styles.visibilityToggle} style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={!!formData.isVerified}
                onChange={() => setFormData((prev) => ({ ...prev, isVerified: !prev.isVerified }))}
              />
              <span className={styles.visibilitySwitch} />
              <span className={styles.visibilityLabel}>Верифицирован</span>
            </label>
          )}
        </div>

        {formData.category === 'Гид' ? (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Аватар гида</label>
              <p className={styles.imageHint} style={{ marginBottom: 12 }}>
                Одно фото для карточки и блока о специалисте. Загружается при нажатии «Сохранить».
              </p>
              <div className={styles.imageUpload}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="guideAvatarUpload"
                  onChange={handleGuideAvatarUpload}
                />
                <label htmlFor="guideAvatarUpload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <Upload size={20} /> Загрузить аватар
                </label>
              </div>
              {formData.data?.avatar && (
                <div className={styles.imagePreview} style={{ marginTop: 12 }}>
                  <div className={styles.previewItem}>
                    <img src={formData.data.avatar.type === 'url' ? getImageUrl(formData.data.avatar.value) : formData.data.avatar.preview} alt="Аватар" />
                    <button type="button" onClick={removeGuideAvatar} className={styles.removeImage} title="Удалить" aria-label="Удалить">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Галерея</label>
              <p className={styles.imageHint} style={{ marginBottom: 12 }}>
                Фотографии для блока галереи на странице. Загружаются при нажатии «Сохранить».
              </p>
              <label className={styles.visibilityToggle} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={formData.data?.galleryEnabled !== false}
                  onChange={() => setData('galleryEnabled', !(formData.data?.galleryEnabled !== false))}
                />
                <span className={styles.visibilitySwitch} />
                <span className={styles.visibilityLabel}>Показывать галерею на странице</span>
              </label>
              <div className={styles.imageUpload}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  id="guideGalleryUpload"
                  onChange={handleGuideGalleryUpload}
                />
                <label htmlFor="guideGalleryUpload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <Upload size={20} /> Добавить фото в галерею
                </label>
              </div>
              {(formData.data?.galleryImages ?? []).length > 0 && (
                <div className={styles.imagePreview} style={{ marginTop: 12 }}>
                  {(formData.data?.galleryImages ?? []).map((img, index) => (
                    <div key={img.type === 'url' ? img.value : img.preview} className={styles.previewItem}>
                      <img src={img.type === 'url' ? getImageUrl(img.value) : img.preview} alt={`Галерея ${index + 1}`} />
                      <button type="button" onClick={() => removeGuideGalleryImage(index)} className={styles.removeImage} title="Удалить" aria-label="Удалить">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Изображения</label>
            <p className={styles.imageHint} style={{ marginBottom: 12 }}>
              Первое изображение используется как обложка в списке услуг. Файлы загружаются на сервер при нажатии «Сохранить».
            </p>
            <div className={styles.imageUpload}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="serviceImageUpload"
              />
              <label htmlFor="serviceImageUpload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <Upload size={20} /> Нажмите для добавления изображений
              </label>
            </div>
            {formData.images.length > 0 && (
              <>
                <div className={styles.imagePreview}>
                  {formData.images.map((img, index) => (
                    <div
                      key={img.type === 'url' ? img.value : img.preview}
                      className={`${styles.previewItem} ${index === 0 ? styles.previewItemMain : ''}`}
                      onClick={() => setMainImage(index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainImage(index); } }}
                      aria-label={index === 0 ? 'Главное фото (нажмите на другую картинку, чтобы сделать её главной)' : 'Сделать главным фото'}
                      title={index === 0 ? 'Главное фото' : 'Сделать главным'}
                    >
                      <img src={img.type === 'url' ? getImageUrl(img.value) : img.preview} alt={`Превью ${index + 1}`} />
                      {index === 0 && <span className={styles.previewItemBadge}>Обложка</span>}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                        className={styles.removeImage}
                        title="Удалить"
                        aria-label="Удалить"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className={styles.imageHint}>
                  Первая картинка отображается как обложка в списке услуг. Нажмите на другую картинку, чтобы сделать её главной.
                </p>
              </>
            )}
          </div>
        )}

        {typeFields.length > 0 && (
          <div className={styles.formGroup} style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
            <label className={styles.formLabel}>Данные шаблона</label>
            <p className={styles.imageHint} style={{ marginBottom: 20 }}>
              Заполните поля в соответствии с выбранным типом услуги.
            </p>
            {typeFields.map((field) => (
              <div key={field.key} className={styles.formGroup} style={{ marginBottom: 16 }}>
                <label className={styles.formLabel}>{field.label}</label>
                {renderField(field)}
              </div>
            ))}
          </div>
        )}
      </form>

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

      {showToast && (
        <div className={styles.toast} role="status">
          Изменения успешно сохранены
        </div>
      )}
    </div>
  );
}
