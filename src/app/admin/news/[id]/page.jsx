'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { newsAPI, mediaAPI, getImageUrl } from '@/lib/api';
import styles from '../../admin.module.css';

const categories = ['Новости', 'Маршруты', 'Гайды', 'События', 'Анонсы'];

export default function NewsEditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const isNew = params.id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    category: 'Новости',
    shortDescription: '',
    content: '',
    author: '',
    publishedAt: new Date().toISOString().split('T')[0],
    isActive: false,
    images: [],
  });

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew) {
      fetchNews();
    }
  }, [params.id]);

  const fetchNews = async () => {
    try {
      const response = await newsAPI.getById(params.id);
      const data = response.data;
      setFormData({
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString().split('T')[0] : '',
      });
    } catch (error) {
      console.error('Ошибка загрузки новости:', error);
      setError('Новость не найдена');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const dataToSend = {
        ...formData,
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : null,
      };

      if (isNew) {
        await newsAPI.create(dataToSend);
      } else {
        await newsAPI.update(params.id, dataToSend);
      }
      
      navigate('/admin/news');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setError(error.response?.data?.message || 'Ошибка сохранения новости');
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
