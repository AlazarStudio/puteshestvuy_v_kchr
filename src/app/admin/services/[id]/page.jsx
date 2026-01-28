'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, X, Plus } from 'lucide-react';
import { servicesAPI, mediaAPI, getImageUrl } from '@/lib/api';
import styles from '../../admin.module.css';

const categories = [
  'Гид',
  'Прокат оборудования',
  'Гостиница',
  'Кафе и ресторан',
  'Трансфер',
  'Активности',
  'Туроператор',
  'Торговая точка',
  'Сувениры',
  'АЗС',
  'Придорожный пункт',
  'Пункт медпомощи',
];

export default function ServiceEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    category: 'Гид',
    description: '',
    shortDescription: '',
    phone: '',
    email: '',
    telegram: '',
    address: '',
    rating: 0,
    reviewsCount: 0,
    isVerified: false,
    isActive: true,
    prices: [],
    images: [],
    certificates: [],
  });

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [newPrice, setNewPrice] = useState({ name: '', price: '' });

  useEffect(() => {
    if (!isNew) {
      fetchService();
    }
  }, [params.id]);

  const fetchService = async () => {
    try {
      const response = await servicesAPI.getById(params.id);
      setFormData(response.data);
    } catch (error) {
      console.error('Ошибка загрузки услуги:', error);
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

  const handleCertificateUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      try {
        const response = await mediaAPI.upload(formDataUpload);
        setFormData((prev) => ({
          ...prev,
          certificates: [...prev.certificates, response.data.url],
        }));
      } catch (error) {
        console.error('Ошибка загрузки сертификата:', error);
      }
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeCertificate = (index) => {
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index),
    }));
  };

  const addPrice = () => {
    if (newPrice.name && newPrice.price) {
      setFormData((prev) => ({
        ...prev,
        prices: [...prev.prices, { ...newPrice, price: parseFloat(newPrice.price) }],
      }));
      setNewPrice({ name: '', price: '' });
    }
  };

  const removePrice = (index) => {
    setFormData((prev) => ({
      ...prev,
      prices: prev.prices.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      if (isNew) {
        await servicesAPI.create(formData);
      } else {
        await servicesAPI.update(params.id, formData);
      }
      
      router.push('/admin/services');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setError(error.response?.data?.message || 'Ошибка сохранения услуги');
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
      </div>

      <form onSubmit={handleSubmit} className={styles.formContainer}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Название / Имя *</label>
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
            <label className={styles.formLabel}>
              <input
                type="checkbox"
                name="isVerified"
                checked={formData.isVerified}
                onChange={handleChange}
              />
              {' '}Верифицирован
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
            placeholder="Подробное описание услуги"
            rows={6}
          />
        </div>

        <h3 style={{ marginTop: '30px', marginBottom: '20px' }}>Контакты</h3>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Телефон</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="email@example.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Telegram</label>
            <input
              type="text"
              name="telegram"
              value={formData.telegram}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="@username"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Адрес</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="Полный адрес"
          />
        </div>

        <h3 style={{ marginTop: '30px', marginBottom: '20px' }}>Услуги и цены</h3>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <input
              type="text"
              value={newPrice.name}
              onChange={(e) => setNewPrice({ ...newPrice, name: e.target.value })}
              className={styles.formInput}
              placeholder="Название услуги"
            />
          </div>
          <div className={styles.formGroup}>
            <input
              type="number"
              value={newPrice.price}
              onChange={(e) => setNewPrice({ ...newPrice, price: e.target.value })}
              className={styles.formInput}
              placeholder="Цена (руб)"
            />
          </div>
          <button type="button" onClick={addPrice} className={styles.addBtn} style={{ height: 'fit-content' }}>
            <Plus size={16} /> Добавить
          </button>
        </div>

        {formData.prices.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            {formData.prices.map((price, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ flex: 1 }}>{price.name}</span>
                <span style={{ fontWeight: 'bold' }}>{price.price} руб</span>
                <button type="button" onClick={() => removePrice(index)} className={styles.deleteBtn}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

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

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Сертификаты и документы</label>
          <div className={styles.imageUpload}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleCertificateUpload}
              style={{ display: 'none' }}
              id="certificateUpload"
            />
            <label htmlFor="certificateUpload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Upload size={20} /> Нажмите для загрузки сертификатов
            </label>
          </div>
          
          {formData.certificates.length > 0 && (
            <div className={styles.imagePreview}>
              {formData.certificates.map((cert, index) => (
                <div key={index} className={styles.previewItem}>
                  <img src={getImageUrl(cert)} alt={`Certificate ${index}`} />
                  <button
                    type="button"
                    onClick={() => removeCertificate(index)}
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
            {isSaving ? 'Сохранение...' : (isNew ? 'Создать услугу' : 'Сохранить изменения')}
          </button>
          <Link href="/admin/services" className={styles.cancelBtn}>
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
