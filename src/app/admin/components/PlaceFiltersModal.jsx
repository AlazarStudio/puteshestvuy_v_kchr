'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Trash2, Pencil, Check } from 'lucide-react';
import { placeFiltersAPI } from '@/lib/api';
import styles from '../admin.module.css';

const GROUP_KEYS = ['directions', 'seasons', 'objectTypes', 'accessibility'];
const GROUP_LABELS = {
  directions: 'Направление',
  seasons: 'Сезон',
  objectTypes: 'Вид объекта',
  accessibility: 'Доступность',
};

const emptyConfig = () => ({
  directions: [],
  seasons: [],
  objectTypes: [],
  accessibility: [],
});

export default function PlaceFiltersModal({ open, onClose }) {
  const [config, setConfig] = useState(emptyConfig);
  const [initialConfig, setInitialConfig] = useState(emptyConfig);
  const [newValues, setNewValues] = useState({ directions: '', seasons: '', objectTypes: '', accessibility: '' });
  const [editing, setEditing] = useState(null);
  const [editingInput, setEditingInput] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const editInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadFilters = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await placeFiltersAPI.get();
      const data = res.data || emptyConfig();
      const normalized = {
        directions: Array.isArray(data.directions) ? [...data.directions] : [],
        seasons: Array.isArray(data.seasons) ? [...data.seasons] : [],
        objectTypes: Array.isArray(data.objectTypes) ? [...data.objectTypes] : [],
        accessibility: Array.isArray(data.accessibility) ? [...data.accessibility] : [],
      };
      setConfig(normalized);
      setInitialConfig(normalized);
    } catch (err) {
      console.error('Ошибка загрузки фильтров:', err);
      setError('Не удалось загрузить фильтры');
      setConfig(emptyConfig());
      setInitialConfig(emptyConfig());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadFilters();
      setNewValues({ directions: '', seasons: '', objectTypes: '', accessibility: '' });
      setEditing(null);
    }
  }, [open, loadFilters]);

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editing]);

  const addValue = (group, value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return;
    const arr = config[group] || [];
    if (arr.includes(trimmed)) return;
    setConfig((prev) => ({ ...prev, [group]: [...(prev[group] || []), trimmed] }));
    setNewValues((prev) => ({ ...prev, [group]: '' }));
  };

  const removeValue = (group, value) => {
    if (editing?.group === group && editing?.value === value) setEditing(null);
    setConfig((prev) => ({
      ...prev,
      [group]: (prev[group] || []).filter((v) => v !== value),
    }));
  };

  const startEdit = (group, value) => {
    setEditing({ group, value });
    setEditingInput(value);
    setError('');
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditingInput('');
  };

  const applyEdit = async () => {
    if (!editing) return;
    const { group, value: oldValue } = editing;
    const newValue = (editingInput || '').trim();
    if (!newValue) {
      cancelEdit();
      return;
    }
    if (newValue === oldValue) {
      cancelEdit();
      return;
    }
    const arr = config[group] || [];
    if (arr.includes(newValue)) {
      setError(`Значение «${newValue}» уже есть в группе`);
      return;
    }
    setSavingEdit(true);
    setError('');
    try {
      await placeFiltersAPI.replaceValue(group, oldValue, newValue);
      setConfig((prev) => ({
        ...prev,
        [group]: (prev[group] || []).map((v) => (v === oldValue ? newValue : v)),
      }));
      setInitialConfig((prev) => ({
        ...prev,
        [group]: (prev[group] || []).map((v) => (v === oldValue ? newValue : v)),
      }));
      cancelEdit();
    } catch (err) {
      console.error('Ошибка переименования:', err);
      setError(err.response?.data?.message || 'Не удалось переименовать значение');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      for (const group of GROUP_KEYS) {
        const initial = initialConfig[group] || [];
        const current = config[group] || [];
        for (const value of initial) {
          if (!current.includes(value)) {
            await placeFiltersAPI.removeValue(group, value);
          }
        }
      }
      await placeFiltersAPI.update({
        directions: config.directions,
        seasons: config.seasons,
        objectTypes: config.objectTypes,
        accessibility: config.accessibility,
      });
      setInitialConfig({ ...config });
      onClose?.();
    } catch (err) {
      console.error('Ошибка сохранения фильтров:', err);
      setError(err.response?.data?.message || 'Не удалось сохранить фильтры');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-filters-title"
    >
      <div
        className={styles.modalDialog}
        style={{ maxWidth: 1000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 id="place-filters-title" className={styles.modalTitle}>
            Фильтры мест
          </h2>
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
            <>
              <p className={styles.imageHint} style={{ marginBottom: 20 }}>
                Эти опции используются на сайте в фильтре и в карточке места. Добавляйте, удаляйте значения по группам.
              </p>
              {error && (
                <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}
              {GROUP_KEYS.map((group) => (
                <div key={group} className={styles.filterModalGroup}>
                  <div className={styles.filterModalGroupTitle}>{GROUP_LABELS[group]}</div>
                  <div className={styles.filterModalValues}>
                    {(config[group] || []).map((v) => {
                      const isEditing = editing?.group === group && editing?.value === v;
                      return (
                        <div
                          key={v}
                          className={styles.filterModalValueRow}
                          style={isEditing ? { minWidth: 220, flex: '1 1 220px' } : undefined}
                        >
                          {isEditing ? (
                            <>
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editingInput}
                                onChange={(e) => setEditingInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    applyEdit();
                                  }
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                className={styles.filterModalAddInput}
                                style={{ minWidth: 120, flex: 1 }}
                                aria-label="Новое значение"
                              />
                              <button
                                type="button"
                                onClick={applyEdit}
                                disabled={savingEdit || !editingInput.trim() || editingInput.trim() === v}
                                className={styles.filterModalValueApply}
                                title="Применить"
                                aria-label="Применить"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className={styles.filterModalValueDelete}
                                title="Отмена"
                                aria-label="Отмена"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span>{v}</span>
                              <button
                                type="button"
                                onClick={() => startEdit(group, v)}
                                className={styles.filterModalValueEdit}
                                title="Изменить"
                                aria-label={`Изменить ${v}`}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeValue(group, v)}
                                className={styles.filterModalValueDelete}
                                title="Удалить"
                                aria-label={`Удалить ${v}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.filterModalAddRow}>
                    <input
                      type="text"
                      value={newValues[group]}
                      onChange={(e) => setNewValues((prev) => ({ ...prev, [group]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addValue(group, newValues[group]);
                        }
                      }}
                      placeholder={`Добавить в ${GROUP_LABELS[group].toLowerCase()}...`}
                      className={styles.filterModalAddInput}
                      aria-label={`Добавить значение в ${GROUP_LABELS[group]}`}
                    />
                    <button
                      type="button"
                      onClick={() => addValue(group, newValues[group])}
                      className={styles.addBtn}
                      style={{ flexShrink: 0 }}
                    >
                      <Plus size={16} /> Добавить
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className={styles.submitBtn}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
