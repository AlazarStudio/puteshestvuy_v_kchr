import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { newsAPI, mediaAPI, getImageUrl } from '@/lib/api';
import { AdminBreadcrumbContext } from '../../layout';
import styles from '../../admin.module.css';

const categories = ['Новости', 'Маршруты', 'Гайды', 'События', 'Анонсы'];

const initialFormData = () => ({
  title: '',
  category: 'Новости',
  shortDescription: '',
  content: '',
  author: '',
  publishedAt: new Date().toISOString().split('T')[0],
  isActive: false,
  images: [],
});

export default function NewsEditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const { setBreadcrumbLabel } = useContext(AdminBreadcrumbContext) || {};
  const isNew = params.id === 'new';

  const [formData, setFormData] = useState(initialFormData());
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchNews = useCallback(async () => {
    if (isNew) return;
    try {
      setError('');
      const response = await newsAPI.getById(params.id);
      const data = response.data;
      setFormData({
        title: data.title ?? '',
        category: data.category ?? 'Новости',
        shortDescription: data.shortDescription ?? '',
        content: data.content ?? '',
        author: data.author ?? '',
        publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString().split('T')[0] : '',
        isActive: Boolean(data.isActive),
        images: Array.isArray(data.images) ? data.images : [],
      });
      setBreadcrumbLabel?.(data.title || 'Новость');
    } catch (err) {
      console.error('Ошибка загрузки новости:', err);
      setError('Новость не найдена');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, isNew, setBreadcrumbLabel]);

  useEffect(() => {
    if (isNew) {
      setBreadcrumbLabel?.('Новая новость');
      setIsLoading(false);
    } else {
      fetchNews();
    }
    return () => setBreadcrumbLabel?.('');
  }, [isNew, fetchNews, setBreadcrumbLabel]);

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
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const response = await mediaAPI.upload(formDataUpload);
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

  const setCoverImage = (index) => {
    if (index === 0) return;
    setFormData((prev) => {
      const images = [...prev.images];
      const [img] = images.splice(index, 1);
      images.unshift(img);
      return { ...prev, images };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const dataToSend = {
      title: formData.title.trim(),
      category: formData.category || null,
      shortDescription: formData.shortDescription || null,
      content: formData.content || null,
      author: formData.author?.trim() || null,
      publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : null,
      isActive: Boolean(formData.isActive),
      images: Array.isArray(formData.images) ? formData.images : [],
    };

    try {
      if (isNew) {
        await newsAPI.create(dataToSend);
      } else {
        await newsAPI.update(params.id, dataToSend);
      }
      navigate('/admin/news');
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError(err.response?.data?.message || 'Ошибка сохранения новости');
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
          {isNew ? 'Новая новость' : 'Редактирование новости'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.formContainer}>
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
            placeholder="Введите заголовок новости"
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Категория</label>
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
            <label className={styles.formLabel}>Дата публикации</label>
            <input
              type="date"
              name="publishedAt"
              value={formData.publishedAt}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Автор</label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Имя автора"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Краткое описание</label>
          <RichTextEditor
            value={formData.shortDescription}
            onChange={(value) => setFormData((prev) => ({ ...prev, shortDescription: value }))}
            placeholder="Краткое описание для превью"
            minHeight={300}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Содержание</label>
          <RichTextEditor
            value={formData.content}
            onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
            placeholder="Полное содержание новости"
            minHeight={300}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            {' '}Опубликовать (отображается на сайте)
          </label>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Изображения</label>
          <p className={styles.formHint} style={{ marginBottom: 8 }}>
            Первое изображение используется как обложка в списке новостей.
          </p>
          <div className={styles.imageUpload}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploadingImage}
              style={{ display: 'none' }}
              id="newsImageUpload"
            />
            <label
              htmlFor="newsImageUpload"
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
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => setCoverImage(index)}
                        className={styles.filterBtn}
                        style={{ fontSize: 12 }}
                      >
                        Сделать обложкой
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={styles.removeImage}
                      title="Удалить"
                    >
                      <X size={14} />
                    </button>
                  </div>
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
            {isSaving ? 'Сохранение...' : (isNew ? 'Создать новость' : 'Сохранить изменения')}
          </button>
          <Link to="/admin/news" className={styles.cancelBtn}>
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
