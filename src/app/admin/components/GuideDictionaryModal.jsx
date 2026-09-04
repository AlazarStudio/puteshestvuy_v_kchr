

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { guideDictionaryAPI } from '@/lib/api';
import styles from '../admin.module.css';

function DictionaryList({ title, values, onChange }) {
  const [newValue, setNewValue] = useState('');

  const addValue = () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    const exists = values.some((v) => v.toLowerCase() === trimmed.toLowerCase());
    if (!exists) onChange([...values, trimmed]);
    setNewValue('');
  };

  const removeValue = (value) => {
    onChange(values.filter((v) => v !== value));
  };

  return (
    <div className={styles.filterModalTabPanel}>
      <div className={styles.filterModalGroupTitle}>
        <span>{title}</span>
      </div>
      <div className={styles.filterModalValues}>
        {values.map((v) => (
          <div key={v} className={styles.filterModalValueRow}>
            <span>{v}</span>
            <button
              type="button"
              onClick={() => removeValue(v)}
              className={styles.deleteBtn}
              title="Удалить"
              aria-label={`Удалить ${v}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className={styles.filterModalAddRow}>
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder={`Добавить в «${title.toLowerCase()}»...`}
          className={styles.formInput}
          aria-label={`Добавить значение в ${title}`}
        />
        <button type="button" onClick={addValue} className={styles.addBtn} style={{ flexShrink: 0 }}>
          <Plus size={16} /> Добавить
        </button>
      </div>
    </div>
  );
}

export default function GuideDictionaryModal({ open, onClose }) {
  const [dictionary, setDictionary] = useState({ qualifications: [], languages: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadDictionary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await guideDictionaryAPI.get();
      const data = res.data || {};
      setDictionary({
        qualifications: Array.isArray(data.qualifications) ? [...data.qualifications] : [],
        languages: Array.isArray(data.languages) ? [...data.languages] : [],
      });
    } catch (err) {
      console.error('Ошибка загрузки справочников гида:', err);
      setError(err.response?.data?.message || err.message);
      setDictionary({ qualifications: [], languages: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadDictionary();
  }, [open, loadDictionary]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await guideDictionaryAPI.update(dictionary);
      onClose?.();
    } catch (err) {
      console.error('Ошибка сохранения справочников гида:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return createPortal(
    <div
      className={styles.modalOverlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-dictionary-title"
    >
      <div className={styles.modalDialog} style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 id="guide-dictionary-title" className={styles.modalTitle}>Справочники гида</h2>
          <button type="button" onClick={onClose} className={styles.modalClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner} />
              <p>Загрузка...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <DictionaryList
                title="Квалификации"
                values={dictionary.qualifications}
                onChange={(values) => setDictionary((prev) => ({ ...prev, qualifications: values }))}
              />
              <DictionaryList
                title="Языки"
                values={dictionary.languages}
                onChange={(values) => setDictionary((prev) => ({ ...prev, languages: values }))}
              />
            </div>
          )}
          {error && (
            <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>
            Отмена
          </button>
          <button type="button" onClick={handleSave} disabled={loading || saving} className={styles.submitBtn}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
