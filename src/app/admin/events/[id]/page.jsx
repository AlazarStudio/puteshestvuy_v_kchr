

import { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Upload, X, Eye, EyeOff, Pencil, MapPin, Map, CheckCircle, XCircle } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import YandexMapPicker from '@/components/YandexMapPicker';
import { eventsAPI, placesAPI, mediaAPI, adminEventSuggestionsAPI, getImageUrl } from '@/lib/api';
import { EVENT_CATEGORIES } from '@/lib/eventCategories';
import ConfirmModal from '../../components/ConfirmModal';
import SaveProgressModal from '../../components/SaveProgressModal';
import ImageCropModal from '../../components/ImageCropModal';
import NewsBlockEditor from '../../components/NewsBlockEditor';
import { AdminHeaderRightContext, AdminBreadcrumbContext } from '../../layout';
import styles from '../../admin.module.css';

const TOAST_DURATION_MS = 3000;

// Набор типов блоков события: вместо «Видео VK» — eventVideo, умеющий и ссылку, и файл
const EVENT_BLOCK_TYPES = ['heading', 'text', 'image', 'gallery', 'quote', 'button', 'eventVideo'];

/** ISO из API → строка для <input type="datetime-local"> в местном времени */
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Строка из <input type="datetime-local"> → ISO для API */
function toIso(localValue) {
  if (!localValue) return null;
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function getFormSnapshot(data) {
  return {
    title: data.title ?? '',
    category: data.category ?? '',
    startAt: data.startAt ?? '',
    endAt: data.endAt ?? '',
    location: data.location ?? '',
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    placeId: data.placeId ?? '',
    price: data.price ?? '',
    organizer: data.organizer ?? '',
    registrationUrl: data.registrationUrl ?? '',
    shortDescription: data.shortDescription ?? '',
    image: data.image ?? '',
    cardImage: data.cardImage ?? '',
    isActive: !!data.isActive,
    blocks: JSON.stringify(data.blocks || []),
  };
}

function formSnapshotsEqual(a, b) {
  return JSON.stringify(getFormSnapshot(a)) === JSON.stringify(getFormSnapshot(b));
}

const initialFormData = () => ({
  title: '',
  category: '',
  startAt: '',
  endAt: '',
  location: '',
  latitude: null,
  longitude: null,
  placeId: '',
  price: '',
  organizer: '',
  registrationUrl: '',
  shortDescription: '',
  image: '',
  cardImage: '',
  isActive: false,
  blocks: [],
});

export default function EventEditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const setHeaderRight = useContext(AdminHeaderRightContext)?.setHeaderRight;
  const setBreadcrumbLabel = useContext(AdminBreadcrumbContext)?.setBreadcrumbLabel;
  const isNew = params.id === 'new';
  const suggestionId = searchParams.get('suggestionId');

  const [formData, setFormData] = useState(initialFormData());
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ open: false, steps: [], totalProgress: 0 });
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [pendingCardImageFile, setPendingCardImageFile] = useState(null);
  const [pendingBlockFiles, setPendingBlockFiles] = useState({});
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropModalSrc, setCropModalSrc] = useState(null);
  const [cropTarget, setCropTarget] = useState('cover');
  const [mapVisible, setMapVisible] = useState(true);
  const [determineLocationTrigger, setDetermineLocationTrigger] = useState(0);
  const [suggestion, setSuggestion] = useState(null);
  const [suggestionActionLoading, setSuggestionActionLoading] = useState(false);
  const [suggestionRejectOpen, setSuggestionRejectOpen] = useState(false);
  const [suggestionRejectComment, setSuggestionRejectComment] = useState('');
  const cropUrlRef = useRef(null);
  const savedFormDataRef = useRef(null);
  const imageUploadRef = useRef(null);
  const cardImageUploadRef = useRef(null);

  const isDirty = useMemo(() => {
    if (isNew) return false;
    if (!savedFormDataRef.current) return false;
    const hasPendingFiles = !!(
      pendingImageFile ||
      pendingCardImageFile ||
      Object.keys(pendingBlockFiles).some((k) => pendingBlockFiles[k])
    );
    return !formSnapshotsEqual(formData, savedFormDataRef.current) || hasPendingFiles;
  }, [isNew, formData, pendingImageFile, pendingCardImageFile, pendingBlockFiles]);

  const [imageDisplayUrl, setImageDisplayUrl] = useState('');
  useEffect(() => {
    if (pendingImageFile) {
      const u = URL.createObjectURL(pendingImageFile);
      setImageDisplayUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setImageDisplayUrl(formData.image ? getImageUrl(formData.image) : '');
  }, [pendingImageFile, formData.image]);

  const [cardImageDisplayUrl, setCardImageDisplayUrl] = useState('');
  useEffect(() => {
    if (pendingCardImageFile) {
      const u = URL.createObjectURL(pendingCardImageFile);
      setCardImageDisplayUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setCardImageDisplayUrl(formData.cardImage ? getImageUrl(formData.cardImage) : '');
  }, [pendingCardImageFile, formData.cardImage]);

  const navigateToList = useCallback(() => {
    // Проверяем, есть ли сохраненная страница для возврата
    const savedReturnPage = localStorage.getItem('admin_events_return_page');
    if (savedReturnPage) {
      const savedPage = parseInt(savedReturnPage, 10);
      if (savedPage > 0) {
        navigate(`/admin/events?page=${savedPage}`);
        localStorage.removeItem('admin_events_return_page');
        return;
      }
    }
    navigate('/admin/events');
  }, [navigate]);

  const goToList = useCallback(() => {
    setLeaveModalOpen(false);
    navigateToList();
  }, [navigateToList]);

  const handleCancelClick = useCallback(() => {
    if (isDirty) {
      setLeaveModalOpen(true);
    } else {
      navigateToList();
    }
  }, [isDirty, navigateToList]);

  const fetchEvent = useCallback(async () => {
    if (isNew) return;
    try {
      setError('');
      const response = await eventsAPI.getById(params.id);
      const data = response.data;
      const next = {
        title: data.title ?? '',
        category: data.category ?? '',
        startAt: toLocalInput(data.startAt),
        endAt: toLocalInput(data.endAt),
        location: data.location ?? '',
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        placeId: data.placeId ?? '',
        price: data.price ?? '',
        organizer: data.organizer ?? '',
        registrationUrl: data.registrationUrl ?? '',
        shortDescription: data.shortDescription ?? '',
        image: data.image ?? data.images?.[0] ?? '',
        cardImage: data.cardImage ?? '',
        isActive: Boolean(data.isActive),
        blocks: Array.isArray(data.blocks) ? data.blocks : [],
      };
      setFormData(next);
      savedFormDataRef.current = next;
      setBreadcrumbLabel?.(data.title || 'Событие');
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError('Событие не найдено');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, isNew, setBreadcrumbLabel]);

  useEffect(() => {
    if (isNew) {
      setBreadcrumbLabel?.('Новое событие');
      setIsLoading(false);
    } else {
      fetchEvent();
    }
    return () => setBreadcrumbLabel?.(null);
  }, [isNew, fetchEvent, setBreadcrumbLabel]);

  // Список мест каталога для необязательной привязки события
  useEffect(() => {
    let cancelled = false;
    placesAPI
      .getAll({ page: 1, limit: 500 })
      .then((res) => {
        if (!cancelled) setPlaces(res.data?.items || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!suggestionId) return;
    adminEventSuggestionsAPI.getById(suggestionId)
      .then(({ data }) => setSuggestion(data))
      .catch(() => {});
  }, [suggestionId]);

  const handleSuggestionApprove = async () => {
    setSuggestionActionLoading(true);
    try {
      await adminEventSuggestionsAPI.confirmApprove(suggestionId);
      setSuggestion((prev) => ({ ...prev, status: 'approved' }));
    } catch {
      // ignore
    } finally {
      setSuggestionActionLoading(false);
    }
  };

  const handleSuggestionReject = async () => {
    setSuggestionActionLoading(true);
    try {
      await adminEventSuggestionsAPI.update(suggestionId, { status: 'rejected', adminComment: suggestionRejectComment });
      setSuggestion((prev) => ({ ...prev, status: 'rejected' }));
      setSuggestionRejectOpen(false);
      setSuggestionRejectComment('');
    } catch {
      // ignore
    } finally {
      setSuggestionActionLoading(false);
    }
  };

  useEffect(() => {
    if (!setHeaderRight) return;
    const submitLabel = isSaving
      ? 'Сохранение...'
      : isNew
        ? 'Создать событие'
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
          form="event-form"
          className={submitClassName}
          disabled={isSaving}
        >
          {submitLabel}
        </button>
      </div>
    );
    return () => setHeaderRight(null);
  }, [setHeaderRight, formData.isActive, isSaving, isNew, isDirty, handleCancelClick]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLocationFromMap = (addr) => {
    if (!addr || addr === formData.location) return;
    setFormData((prev) => ({ ...prev, location: addr }));
  };

  const openCropForFile = (e, target) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
    const url = URL.createObjectURL(file);
    cropUrlRef.current = url;
    setCropTarget(target);
    setCropModalSrc(url);
    setCropModalOpen(true);
  };

  const handleMainImageFileSelect = (e) => openCropForFile(e, 'cover');

  const handleCardImageFileSelect = (e) => openCropForFile(e, 'card');

  const handleCropComplete = (blob) => {
    const isCard = cropTarget === 'card';
    const file = new File([blob], isCard ? 'card.jpg' : 'cover.jpg', { type: 'image/jpeg' });
    if (isCard) {
      setPendingCardImageFile(file);
    } else {
      setPendingImageFile(file);
    }
    setCropModalOpen(false);
    setCropModalSrc(null);
    if (cropUrlRef.current) { URL.revokeObjectURL(cropUrlRef.current); cropUrlRef.current = null; }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setCropModalSrc(null);
    if (cropUrlRef.current) { URL.revokeObjectURL(cropUrlRef.current); cropUrlRef.current = null; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.startAt && formData.endAt && new Date(formData.endAt) < new Date(formData.startAt)) {
      setError('Окончание события не может быть раньше начала');
      return;
    }

    setIsSaving(true);
    setError('');

    let imageUrl = formData.image;
    let cardImageUrl = formData.cardImage;
    const blocksToSend = (formData.blocks || []).map((b) => ({ ...b, data: { ...b.data } }));

    const hasPreview = !!pendingImageFile;
    const hasCardImage = !!pendingCardImageFile;
    const hasBlocks = Object.values(pendingBlockFiles).some((p) => p && (p.url || p.video || (p.images?.length ?? 0) > 0));
    const totalWeight = (hasPreview ? 1 : 0) + (hasCardImage ? 1 : 0) + (hasBlocks ? 1 : 0) + 1;
    const initialSteps = [
      { label: 'Загрузка обложки', status: hasPreview ? 'pending' : 'done' },
      { label: 'Загрузка фото карточки', status: hasCardImage ? 'pending' : 'done' },
      { label: 'Загрузка блоков контента', status: hasBlocks ? 'pending' : 'done' },
      { label: 'Сохранение данных', status: 'pending' },
    ];
    if (hasPreview || hasCardImage || hasBlocks) {
      const stepsWithActive = initialSteps.map((s, i) => {
        if (i === 0 && hasPreview) return { ...s, status: 'active' };
        if (i === 1 && hasCardImage && !hasPreview) return { ...s, status: 'active' };
        if (i === 2 && hasBlocks && !hasPreview && !hasCardImage) return { ...s, status: 'active' };
        return s;
      });
      setSaveProgress({ open: true, steps: stepsWithActive, totalProgress: 0 });
    }

    const updateBlockUploadProgress = (percent, subLabel) => {
      setSaveProgress((prev) => {
        const steps = prev.steps.map((s, i) => (i === 2 && s.status === 'active' ? { ...s, progress: percent, subLabel } : s));
        const completedWeight = steps.filter((s) => s.status === 'done').length;
        const activeStep = steps.find((s) => s.status === 'active');
        const activeProgress = activeStep?.progress ?? 0;
        const totalProgress = Math.round(((completedWeight + activeProgress / 100) / totalWeight) * 100);
        return { ...prev, steps, totalProgress };
      });
    };

    try {
      if (pendingImageFile) {
        const fd = new FormData();
        fd.append('file', pendingImageFile);
        const res = await mediaAPI.upload(fd, {
          onUploadProgress: (e) => {
            const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            setSaveProgress((prev) => {
              const steps = prev.steps.map((s, i) => (i === 0 && s.status === 'active' ? { ...s, progress: percent } : s));
              const completedWeight = steps.filter((s) => s.status === 'done').length;
              const activeStep = steps.find((s) => s.status === 'active');
              const activeProgress = activeStep?.progress ?? 0;
              const totalProgress = Math.round(((completedWeight + activeProgress / 100) / totalWeight) * 100);
              return { ...prev, steps, totalProgress };
            });
          },
        });
        imageUrl = res.data?.url || imageUrl;
        setPendingImageFile(null);
        setSaveProgress((prev) => ({ ...prev, steps: prev.steps.map((s, i) => (i === 0 ? { ...s, status: 'done' } : i === 1 && hasCardImage ? { ...s, status: 'active' } : i === 2 && hasBlocks && !hasCardImage ? { ...s, status: 'active' } : s)), totalProgress: Math.round((1 / totalWeight) * 100) }));
      }

      if (pendingCardImageFile) {
        const fd = new FormData();
        fd.append('file', pendingCardImageFile);
        const res = await mediaAPI.upload(fd, {
          onUploadProgress: (e) => {
            const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            setSaveProgress((prev) => {
              const steps = prev.steps.map((s, i) => (i === 1 && s.status === 'active' ? { ...s, progress: percent } : s));
              const completedWeight = steps.filter((s) => s.status === 'done').length;
              const activeStep = steps.find((s) => s.status === 'active');
              const activeProgress = activeStep?.progress ?? 0;
              const totalProgress = Math.round(((completedWeight + activeProgress / 100) / totalWeight) * 100);
              return { ...prev, steps, totalProgress };
            });
          },
        });
        cardImageUrl = res.data?.url || cardImageUrl;
        setPendingCardImageFile(null);
        setSaveProgress((prev) => ({ ...prev, steps: prev.steps.map((s, i) => (i === 1 ? { ...s, status: 'done' } : i === 2 && hasBlocks ? { ...s, status: 'active' } : s)), totalProgress: Math.round((((hasPreview ? 1 : 0) + 1) / totalWeight) * 100) }));
      }

      const blockEntries = Object.entries(pendingBlockFiles).filter(([, p]) => p && (p.url || p.video || (p.images?.length ?? 0) > 0));
      const totalBlockFiles = blockEntries.reduce((acc, [, p]) => acc + (p.url ? 1 : 0) + (p.video ? 1 : 0) + (p.images?.length ?? 0), 0);
      let blockUploadIdx = 0;

      for (const [blockId, pending] of blockEntries) {
        const block = blocksToSend.find((b) => b.id === blockId);
        if (!block) continue;
        if (pending.url) {
          const fd = new FormData();
          fd.append('file', pending.url);
          const res = await mediaAPI.upload(fd, {
            onUploadProgress: (e) => {
              const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
              const overall = totalBlockFiles ? Math.round(((blockUploadIdx * 100 + pct) / totalBlockFiles)) : 0;
              updateBlockUploadProgress(overall, `Файл ${blockUploadIdx + 1} из ${totalBlockFiles}`);
            },
          });
          if (res.data?.url) block.data = { ...block.data, url: res.data.url };
          blockUploadIdx++;
        }
        if (pending.video) {
          const fd = new FormData();
          fd.append('file', pending.video);
          const res = await mediaAPI.uploadVideo(fd, {
            onUploadProgress: (e) => {
              const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
              const overall = totalBlockFiles ? Math.round(((blockUploadIdx * 100 + pct) / totalBlockFiles)) : 0;
              updateBlockUploadProgress(overall, `Файл ${blockUploadIdx + 1} из ${totalBlockFiles}`);
            },
          });
          if (res.data?.url) block.data = { ...block.data, url: res.data.url };
          blockUploadIdx++;
        }
        if (pending.images?.length) {
          const urls = [];
          const uploadedAuthors = {};
          let pendingIdx = 0;
          for (const file of pending.images) {
            const fd = new FormData();
            fd.append('file', file);
            const res = await mediaAPI.upload(fd, {
              onUploadProgress: (e) => {
                const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
                const overall = totalBlockFiles ? Math.round(((blockUploadIdx * 100 + pct) / totalBlockFiles)) : 0;
                updateBlockUploadProgress(overall, `Файл ${blockUploadIdx + 1} из ${totalBlockFiles}`);
              },
            });
            if (res.data?.url) {
              urls.push(res.data.url);
              const author = pending.imageAuthors?.[pendingIdx];
              if (author && author.trim()) uploadedAuthors[res.data.url] = author.trim();
            }
            pendingIdx++;
            blockUploadIdx++;
          }
          block.data = {
            ...block.data,
            images: [...(block.data?.images || []), ...urls],
            imageAuthors: { ...(block.data?.imageAuthors || {}), ...uploadedAuthors },
          };
        }
      }
      setPendingBlockFiles({});
      if (hasBlocks) setSaveProgress((prev) => ({ ...prev, steps: prev.steps.map((s, i) => (i === 2 ? { ...s, status: 'done' } : s)), totalProgress: Math.round(((hasPreview ? 1 : 0) + (hasCardImage ? 1 : 0) + 1) / totalWeight * 100) }));

      if (hasPreview || hasCardImage || hasBlocks) {
        setSaveProgress((prev) => ({ ...prev, steps: prev.steps.map((s, i) => (i === 3 ? { ...s, status: 'active' } : s)) }));
      }

      const dataToSend = {
        title: formData.title.trim(),
        category: formData.category || null,
        startAt: toIso(formData.startAt),
        endAt: toIso(formData.endAt),
        location: formData.location || null,
        latitude: formData.latitude != null ? Number(formData.latitude) : null,
        longitude: formData.longitude != null ? Number(formData.longitude) : null,
        placeId: formData.placeId || null,
        shortDescription: formData.shortDescription || null,
        price: formData.price || null,
        organizer: formData.organizer || null,
        registrationUrl: formData.registrationUrl || null,
        image: imageUrl || null,
        cardImage: cardImageUrl || null,
        isActive: Boolean(formData.isActive),
        blocks: blocksToSend,
      };

      if (isNew) {
        const res = await eventsAPI.create(dataToSend);
        const created = res.data;
        if (hasPreview || hasCardImage || hasBlocks) {
          setSaveProgress((prev) => ({ ...prev, steps: prev.steps.map((s, i) => (i === 3 ? { ...s, status: 'done' } : s)), totalProgress: 100 }));
          setTimeout(() => {
            setSaveProgress({ open: false, steps: [], totalProgress: 0 });
            if (created?.id) {
              navigate(`/admin/events/${created.id}`, { replace: true });
            } else {
              navigateToList();
            }
          }, 500);
        } else {
          if (created?.id) {
            navigate(`/admin/events/${created.id}`, { replace: true });
          } else {
            navigateToList();
          }
        }
        setShowToast(true);
        setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
      } else {
        await eventsAPI.update(params.id, dataToSend);
        const updated = { ...formData, image: imageUrl, cardImage: cardImageUrl, blocks: blocksToSend };
        savedFormDataRef.current = updated;
        setFormData(updated);
        if (hasPreview || hasCardImage || hasBlocks) {
          setSaveProgress((prev) => ({ ...prev, steps: prev.steps.map((s, i) => (i === 3 ? { ...s, status: 'done' } : s)), totalProgress: 100 }));
          setTimeout(() => setSaveProgress({ open: false, steps: [], totalProgress: 0 }), 500);
        }
        setShowToast(true);
        setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
      }
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError(err.response?.data?.message || 'Ошибка сохранения');
      if (hasPreview || hasCardImage || hasBlocks) {
        setSaveProgress((prev) => {
          const idx = prev.steps.findIndex((s) => s.status === 'active');
          const newSteps = prev.steps.map((s, i) => (i === idx ? { ...s, status: 'error' } : s));
          return { ...prev, steps: newSteps };
        });
        setTimeout(() => setSaveProgress({ open: false, steps: [], totalProgress: 0 }), 2000);
      }
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
          {isNew ? 'Новое событие' : 'Редактирование события'}
        </h1>
      </div>

      {suggestion && (
        <div style={{
          marginBottom: 20,
          padding: '16px 20px',
          borderRadius: 12,
          background: suggestion.status === 'approved' ? '#f0fdf4' : suggestion.status === 'rejected' ? '#fef2f2' : '#eff6ff',
          border: `1px solid ${suggestion.status === 'approved' ? '#bbf7d0' : suggestion.status === 'rejected' ? '#fecaca' : '#bfdbfe'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', marginBottom: 2 }}>
              Событие создано из предложения пользователя
              {suggestion.submitterName && ` — ${suggestion.submitterName}`}
              {suggestion.submitterEmail && ` (${suggestion.submitterEmail})`}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {suggestion.status === 'in_review' && 'Примите решение: одобрить или отклонить заявку'}
              {suggestion.status === 'approved' && '✓ Заявка одобрена'}
              {suggestion.status === 'rejected' && '✗ Заявка отклонена'}
            </div>
          </div>
          {suggestion.status === 'in_review' && (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                disabled={suggestionActionLoading}
                onClick={handleSuggestionApprove}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: '#0d9488', color: '#fff',
                  border: 'none', borderRadius: 8, fontFamily: 'inherit',
                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  opacity: suggestionActionLoading ? 0.6 : 1,
                }}
              >
                <CheckCircle size={15} /> Одобрить
              </button>
              <button
                type="button"
                disabled={suggestionActionLoading}
                onClick={() => setSuggestionRejectOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: '#fef2f2', color: '#dc2626',
                  border: '1px solid #fecaca', borderRadius: 8, fontFamily: 'inherit',
                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  opacity: suggestionActionLoading ? 0.6 : 1,
                }}
              >
                <XCircle size={15} /> Отклонить
              </button>
            </div>
          )}
        </div>
      )}

      <form id="event-form" onSubmit={handleSubmit} className={styles.formContainer}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Заголовок *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={styles.formInput}
            required
            placeholder="Введите название события"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Категория</label>
          <select
            name="category"
            value={formData.category || ''}
            onChange={handleChange}
            className={styles.formSelect}
            style={{ maxWidth: 300 }}
          >
            <option value="">Без категории</option>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Начало события *</label>
            <input
              type="datetime-local"
              name="startAt"
              value={formData.startAt || ''}
              onChange={handleChange}
              className={styles.formInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Окончание события</label>
            <input
              type="datetime-local"
              name="endAt"
              value={formData.endAt || ''}
              onChange={handleChange}
              className={styles.formInput}
            />
            <p className={styles.imageHint}>Оставьте пустым, если событие однодневное</p>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Площадка</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Город, адрес площадки (введите вручную или нажмите «Определить локацию»)"
              style={{ flex: 1, minWidth: 200 }}
            />
            <button
              type="button"
              onClick={() => setDetermineLocationTrigger((v) => v + 1)}
              disabled={formData.latitude == null || formData.longitude == null}
              className={styles.editBtn}
              style={{ padding: 15 }}
              title="Определить локацию по координатам"
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

        {mapVisible && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Точка на карте</label>
            <p className={styles.imageHint} style={{ marginBottom: 12 }}>
              Карта ищет по тексту площадки. Точку можно поставить вручную, а затем определить адрес кнопкой рядом с полем.
            </p>
            <YandexMapPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              geocodeQuery={formData.location?.trim() || ''}
              onCoordinatesChange={(lat, lng) => setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
              onLocationChange={handleLocationFromMap}
              determineLocationTrigger={determineLocationTrigger}
              determineLocationBy="coordinates"
              visible={true}
              height={500}
            />
          </div>
        )}
        {!mapVisible && (
          <YandexMapPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            geocodeQuery={formData.location?.trim() || ''}
            onCoordinatesChange={(lat, lng) => setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
            onLocationChange={handleLocationFromMap}
            determineLocationTrigger={determineLocationTrigger}
            determineLocationBy="coordinates"
            visible={false}
            height={500}
          />
        )}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Проходит в месте из каталога</label>
          <select
            name="placeId"
            value={formData.placeId || ''}
            onChange={handleChange}
            className={styles.formSelect}
          >
            <option value="">Не выбрано</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Цена</label>
            <input
              type="text"
              name="price"
              value={formData.price || ''}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Бесплатно, от 500 ₽, по регистрации"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Организатор</label>
            <input
              type="text"
              name="organizer"
              value={formData.organizer || ''}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Ссылка на регистрацию или билеты</label>
          <input
            type="text"
            name="registrationUrl"
            value={formData.registrationUrl || ''}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="https://..."
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Описание</label>
          <p className={styles.imageHint} style={{ marginBottom: 12 }}>
            Показывается на странице события под датой и местом. Первые 160 символов уходят в SEO-описание.
          </p>
          <RichTextEditor
            value={formData.shortDescription}
            onChange={(v) => setFormData((prev) => ({ ...prev, shortDescription: v }))}
            placeholder="Краткое описание для превью в списке"
            minHeight={150}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Обложка</label>
          <p className={styles.imageHint} style={{ marginBottom: 12 }}>
            Отображается в шапке страницы события. На карточке используется, если не загружено фото для карточки.
          </p>
          <input
            ref={imageUploadRef}
            type="file"
            accept="image/*"
            onChange={handleMainImageFileSelect}
            style={{ display: 'none' }}
            id="mainImageUpload"
          />
          {(imageDisplayUrl || formData.image) ? (
            <div className={styles.previewItem} style={{ maxWidth: 500, aspectRatio: '16/9', position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
              <img src={imageDisplayUrl || getImageUrl(formData.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => imageUploadRef.current?.click()} className={styles.removeImage} title="Заменить">
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => { setFormData((prev) => ({ ...prev, image: '' })); setPendingImageFile(null); }} className={styles.removeImage} title="Удалить">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.imageUpload}>
              <label htmlFor="mainImageUpload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <Upload size={20} /> Загрузить обложку
              </label>
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Фото для карточки</label>
          <p className={styles.imageHint} style={{ marginBottom: 12 }}>
            Квадрат 1:1. Показывается на карточке в афише и на главной. Если не загружено, используется обложка.
          </p>
          <input
            ref={cardImageUploadRef}
            type="file"
            accept="image/*"
            onChange={handleCardImageFileSelect}
            style={{ display: 'none' }}
            id="cardImageUpload"
          />
          {(cardImageDisplayUrl || formData.cardImage) ? (
            <div className={styles.previewItem} style={{ maxWidth: 260, aspectRatio: '1/1', position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
              <img src={cardImageDisplayUrl || getImageUrl(formData.cardImage)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => cardImageUploadRef.current?.click()} className={styles.removeImage} title="Заменить">
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => { setFormData((prev) => ({ ...prev, cardImage: '' })); setPendingCardImageFile(null); }} className={styles.removeImage} title="Удалить">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.imageUpload}>
              <label htmlFor="cardImageUpload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <Upload size={20} /> Загрузить фото для карточки
              </label>
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Блоки контента</label>
          <p className={styles.imageHint} style={{ marginBottom: 12 }}>
            Добавляйте блоки через выпадающий список. Заголовки станут якорями. Перетаскивайте блоки или используйте стрелки для изменения порядка.
          </p>
          <NewsBlockEditor
            blocks={formData.blocks}
            onChange={(blocks) => setFormData((prev) => ({ ...prev, blocks }))}
            pendingBlockFiles={pendingBlockFiles}
            onPendingBlockFilesChange={(blockId, data) => {
              setPendingBlockFiles((prev) => {
                const next = { ...prev };
                if (data === null) {
                  delete next[blockId];
                } else {
                  next[blockId] = { ...prev[blockId], ...data };
                }
                return next;
              });
            }}
            availableTypes={EVENT_BLOCK_TYPES}
          />
        </div>
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

      <SaveProgressModal
        open={saveProgress.open}
        steps={saveProgress.steps}
        totalProgress={saveProgress.totalProgress}
      />

      <ImageCropModal
        open={cropModalOpen}
        imageSrc={cropModalSrc}
        title={cropTarget === 'card' ? 'Обрезка фото для карточки' : 'Обрезка обложки'}
        aspect={cropTarget === 'card' ? 1 : 16 / 9}
        onComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />

      {showToast && (
        <div className={styles.toast} role="status">
          Изменения успешно сохранены
        </div>
      )}

      {/* Модалка: отклонение заявки */}
      {suggestionRejectOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10020, padding: 20,
        }} onClick={() => setSuggestionRejectOpen(false)}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28, width: 440, maxWidth: '100%',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
              Отклонить заявку
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '0.875rem', color: '#64748b' }}>
              Укажите причину отклонения (необязательно):
            </p>
            <textarea
              value={suggestionRejectComment}
              onChange={(e) => setSuggestionRejectComment(e.target.value)}
              placeholder="Причина отклонения..."
              rows={4}
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
                borderRadius: 10, fontSize: '0.875rem', resize: 'vertical',
                background: '#f8fafc', boxSizing: 'border-box', marginBottom: 16,
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSuggestionRejectOpen(false)}
                style={{
                  padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: 10,
                  background: '#f8fafc', fontSize: '0.875rem', cursor: 'pointer',
                  color: '#64748b', fontFamily: 'inherit',
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={suggestionActionLoading}
                onClick={handleSuggestionReject}
                style={{
                  padding: '10px 20px', background: '#fef2f2', color: '#dc2626',
                  border: '1px solid #fecaca', borderRadius: 10, fontSize: '0.875rem',
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: suggestionActionLoading ? 0.6 : 1,
                }}
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
