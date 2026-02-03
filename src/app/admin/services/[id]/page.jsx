import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { servicesAPI, mediaAPI, getImageUrl } from '@/lib/api';
import styles from '../../admin.module.css';

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

export default function ServiceEditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const isNew = params.id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    category: 'Гид',
    images: [],
    isActive: true,
  });

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetchService();
    }
  }, [params.id, isNew]);

  const fetchService = async () => {
    try {
      setError('');
      const response = await servicesAPI.getById(params.id);
      const data = response.data;
      setFormData({
        title: data.title ?? '',
        category: data.category ?? 'Гид',
        images: Array.isArray(data.images) ? data.images : [],
        isActive: data.isActive !== false,
      });
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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingImage(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const response = await mediaAPI.upload(fd);
        const url = response.data?.url;
        if (url) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, url],
          }));
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки изображения:', err);
      setError('Не удалось загрузить изображение');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const payload = {
      title: formData.title.trim(),
      category: formData.category || null,
      images: formData.images,
      isActive: formData.isActive,
    };

    try {
      if (isNew) {
        await servicesAPI.create(payload);
      } else {
        await servicesAPI.update(params.id, payload);
      }
      navigate('/admin/services');
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError(err.response?.data?.message || 'Ошибка сохранения услуги');
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
          {isNew ? 'Новая услуга' : 'Редактирование услуги'}
        </h1>
        <p className={styles.formHint} style={{ marginTop: 8, color: '#64748b', fontSize: 14 }}>
          Пока только название, картинка и тип. Остальные поля появятся после выбора шаблона под каждый тип услуги.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.formContainer}>
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
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Картинка</label>
          <p className={styles.formHint} style={{ marginBottom: 8, fontSize: 13, color: '#64748b' }}>
            Первое изображение используется как обложка в списке услуг.
          </p>
          <div className={styles.imageUpload}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploadingImage}
              style={{ display: 'none' }}
              id="serviceImageUpload"
            />
            <label
              htmlFor="serviceImageUpload"
              style={{
                cursor: uploadingImage ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center',
                opacity: uploadingImage ? 0.7 : 1,
              }}
            >
              <Upload size={20} />
              {uploadingImage ? 'Загрузка...' : 'Загрузить изображения'}
            </label>
          </div>

          {formData.images.length > 0 && (
            <div className={styles.imagePreview}>
              {formData.images.map((img, index) => (
                <div key={index} className={styles.previewItem}>
                  {index === 0 && (
                    <span className={styles.badge} style={{ position: 'absolute', top: 6, left: 6, zIndex: 1, fontSize: 11 }}>
                      Обложка
                    </span>
                  )}
                  <img src={getImageUrl(img)} alt={`Превью ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className={styles.removeImage}
                    title="Удалить"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            {' '}Показывать на сайте
          </label>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSaving}
          >
            {isSaving ? 'Сохранение...' : (isNew ? 'Создать услугу' : 'Сохранить')}
          </button>
          <Link to="/admin/services" className={styles.cancelBtn}>
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
