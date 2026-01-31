'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Trash2, Pencil, Check, FolderPlus } from 'lucide-react';
import { routeFiltersAPI } from '@/lib/api';
import styles from '../admin.module.css';

const FIXED_GROUP_KEYS = ['seasons', 'transport', 'durationOptions', 'difficultyLevels', 'distanceOptions', 'elevationOptions', 'isFamilyOptions', 'hasOvernightOptions'];
const FIXED_GROUP_LABELS = {
  seasons: 'Сезон',
  transport: 'Способ передвижения',
  durationOptions: 'Время прохождения',
  difficultyLevels: 'Сложность',
  distanceOptions: 'Расстояние',
  elevationOptions: 'Перепад высот',
  isFamilyOptions: 'Семейный маршрут',
  hasOvernightOptions: 'С ночевкой',
};

const emptyConfig = () => ({
  seasons: [],
  transport: [],
  durationOptions: [],
  difficultyLevels: [],
  distanceOptions: [],
  elevationOptions: [],
  isFamilyOptions: [],
  hasOvernightOptions: [],
});

function normalizeExtraGroups(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((g) => g && typeof g.key === 'string' && g.key.trim()).map((g) => ({
    key: String(g.key).trim().replace(/\s+/g, '_'),
    label: typeof g.label === 'string' ? g.label.trim() || g.key : String(g.key),
    values: Array.isArray(g.values) ? g.values.filter((v) => typeof v === 'string' && v.trim()) : [],
  }));
}

export default function RouteFiltersModal({ open, onClose }) {
  const [config, setConfig] = useState(emptyConfig);
  const [initialConfig, setInitialConfig] = useState(emptyConfig);
  const [extraGroups, setExtraGroups] = useState([]);
  const [initialExtraGroups, setInitialExtraGroups] = useState([]);
  const [newValues, setNewValues] = useState({});
  const [editing, setEditing] = useState(null);
  const [editingInput, setEditingInput] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const editInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [newGroupKey, setNewGroupKey] = useState('');
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);
  const [removingGroupKey, setRemovingGroupKey] = useState(null);

  const ADD_GROUP_TAB = '__add__';

  const getValues = useCallback((group) => {
    if (FIXED_GROUP_KEYS.includes(group)) return config[group] || [];
    const g = extraGroups.find((e) => e.key === group);
    return g ? (g.values || []) : [];
  }, [config, extraGroups]);

  const loadFilters = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await routeFiltersAPI.get();
      const data = res.data || {};
      const normalized = {
        seasons: Array.isArray(data.seasons) ? [...data.seasons] : [],
        transport: Array.isArray(data.transport) ? [...data.transport] : [],
        durationOptions: Array.isArray(data.durationOptions) ? [...data.durationOptions] : [],
        difficultyLevels: Array.isArray(data.difficultyLevels) ? [...data.difficultyLevels] : [],
        distanceOptions: Array.isArray(data.distanceOptions) ? [...data.distanceOptions] : [],
        elevationOptions: Array.isArray(data.elevationOptions) ? [...data.elevationOptions] : [],
        isFamilyOptions: Array.isArray(data.isFamilyOptions) ? [...data.isFamilyOptions] : [],
        hasOvernightOptions: Array.isArray(data.hasOvernightOptions) ? [...data.hasOvernightOptions] : [],
      };
      const extra = normalizeExtraGroups(data.extraGroups);
      setConfig(normalized);
      setInitialConfig(normalized);
      setExtraGroups(extra);
      setInitialExtraGroups(extra);
      const keys = [...FIXED_GROUP_KEYS, ...extra.map((g) => g.key)];
      setNewValues(keys.reduce((acc, k) => ({ ...acc, [k]: '' }), {}));
    } catch (err) {
      console.error('Ошибка загрузки фильтров маршрутов:', err);
      setError('Не удалось загрузить фильтры');
      setConfig(emptyConfig());
      setInitialConfig(emptyConfig());
      setExtraGroups([]);
      setInitialExtraGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadFilters();
      setEditing(null);
      setNewGroupKey('');
      setNewGroupLabel('');
      setActiveTab('');
    }
  }, [open, loadFilters]);

  const groupList = [
    ...FIXED_GROUP_KEYS.map((key) => ({ key, label: FIXED_GROUP_LABELS[key], isExtra: false })),
    ...extraGroups.map((g) => ({ key: g.key, label: g.label, isExtra: true })),
  ];

  useEffect(() => {
    if (loading) return;
    const keys = groupList.map((g) => g.key);
    if (!activeTab || (activeTab !== ADD_GROUP_TAB && !keys.includes(activeTab))) {
      setActiveTab(keys[0] || ADD_GROUP_TAB);
    }
  }, [loading, config, extraGroups, activeTab]);

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editing]);

  const addValue = (group, value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return;
    if (FIXED_GROUP_KEYS.includes(group)) {
      const arr = config[group] || [];
      if (arr.includes(trimmed)) return;
      setConfig((prev) => ({ ...prev, [group]: [...(prev[group] || []), trimmed] }));
    } else {
      const g = extraGroups.find((e) => e.key === group);
      if (!g || (g.values || []).includes(trimmed)) return;
      setExtraGroups((prev) => prev.map((e) => (e.key === group ? { ...e, values: [...(e.values || []), trimmed] } : e)));
    }
    setNewValues((prev) => ({ ...prev, [group]: '' }));
  };

  const removeValue = (group, value) => {
    if (editing?.group === group && editing?.value === value) setEditing(null);
    if (FIXED_GROUP_KEYS.includes(group)) {
      setConfig((prev) => ({ ...prev, [group]: (prev[group] || []).filter((v) => v !== value) }));
    } else {
      setExtraGroups((prev) => prev.map((e) => (e.key === group ? { ...e, values: (e.values || []).filter((v) => v !== value) } : e)));
    }
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
    const arr = getValues(group);
    if (arr.includes(newValue)) {
      setError(`Значение «${newValue}» уже есть в группе`);
      return;
    }
    setSavingEdit(true);
    setError('');
    try {
      await routeFiltersAPI.replaceValue(group, oldValue, newValue);
      if (FIXED_GROUP_KEYS.includes(group)) {
        setConfig((prev) => ({ ...prev, [group]: (prev[group] || []).map((v) => (v === oldValue ? newValue : v)) }));
        setInitialConfig((prev) => ({ ...prev, [group]: (prev[group] || []).map((v) => (v === oldValue ? newValue : v)) }));
      } else {
        setExtraGroups((prev) => prev.map((e) => (e.key === group ? { ...e, values: (e.values || []).map((v) => (v === oldValue ? newValue : v)) } : e)));
        setInitialExtraGroups((prev) => prev.map((e) => (e.key === group ? { ...e, values: (e.values || []).map((v) => (v === oldValue ? newValue : v)) } : e)));
      }
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
      await routeFiltersAPI.update({
        seasons: config.seasons,
        transport: config.transport,
        durationOptions: config.durationOptions,
        difficultyLevels: config.difficultyLevels,
        distanceOptions: config.distanceOptions,
        elevationOptions: config.elevationOptions,
        isFamilyOptions: config.isFamilyOptions,
        hasOvernightOptions: config.hasOvernightOptions,
        extraGroups: extraGroups.map((g) => ({ key: g.key, label: g.label, values: g.values || [] })),
      });
      setInitialConfig({ ...config });
      setInitialExtraGroups([...extraGroups]);
      onClose?.();
    } catch (err) {
      console.error('Ошибка сохранения фильтров маршрутов:', err);
      setError(err.response?.data?.message || 'Не удалось сохранить фильтры');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGroup = async () => {
    const key = newGroupKey.trim().replace(/\s+/g, '_');
    const label = newGroupLabel.trim() || key;
    if (!key) {
      setError('Введите ключ группы (латиница, цифры, подчёркивание)');
      return;
    }
    if (FIXED_GROUP_KEYS.includes(key)) {
      setError('Такой ключ уже используется встроенной группой');
      return;
    }
    if (extraGroups.some((g) => g.key === key)) {
      setError('Группа с таким ключом уже есть');
      return;
    }
    setAddingGroup(true);
    setError('');
    try {
      await routeFiltersAPI.addGroup(key, label, []);
      setNewGroupKey('');
      setNewGroupLabel('');
      await loadFilters();
      setActiveTab(key);
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось добавить группу');
    } finally {
      setAddingGroup(false);
    }
  };

  const handleRemoveGroup = async (key) => {
    setRemovingGroupKey(key);
    setError('');
    try {
      await routeFiltersAPI.removeGroup(key);
      await loadFilters();
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось удалить группу');
    } finally {
      setRemovingGroupKey(null);
    }
  };

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const currentGroup = groupList.find((g) => g.key === activeTab);

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-filters-title"
    >
      <div
        className={styles.modalDialog}
        style={{ maxWidth: 1000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 id="route-filters-title" className={styles.modalTitle}>
            Фильтры маршрутов
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
              <p className={styles.imageHint} style={{ marginBottom: 8 }}>
                Опции для фильтра маршрутов и формы редактирования. Переключайте группы по вкладкам.
              </p>
              <p className={styles.imageHint} style={{ marginBottom: 16, fontSize: '0.85rem' }}>
                Если создаёте новую группу (вкладка «Добавить группу») и не добавляете в неё значения — при создании и редактировании маршрута для этой группы будет показано поле для ввода (например, для расстояния в км).
              </p>
              {error && (
                <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}
              <div className={styles.filterModalTabs} role="tablist">
                {groupList.map(({ key: group, label }) => (
                  <button
                    key={group}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === group}
                    aria-controls={`panel-${group}`}
                    id={`tab-${group}`}
                    className={`${styles.filterModalTab} ${activeTab === group ? styles.filterModalTabActive : ''}`}
                    onClick={() => setActiveTab(group)}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === ADD_GROUP_TAB}
                  aria-label="Добавить группу"
                  title="Добавить группу"
                  className={`${styles.filterModalTab} ${activeTab === ADD_GROUP_TAB ? styles.filterModalTabActive : ''}`}
                  onClick={() => setActiveTab(ADD_GROUP_TAB)}
                >
                  <FolderPlus size={18} />
                </button>
              </div>
              <div className={styles.filterModalTabPanel} role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={activeTab !== ADD_GROUP_TAB ? `tab-${activeTab}` : undefined}>
                {activeTab === ADD_GROUP_TAB ? (
                  <div className={styles.filterModalGroup}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                      <div>
                        <label className={styles.formLabel} style={{ marginBottom: 4 }}>Ключ группы (латиница, цифры, _)</label>
                        <input
                          type="text"
                          value={newGroupKey}
                          onChange={(e) => setNewGroupKey(e.target.value.replace(/\s/g, '_'))}
                          placeholder="naprimer_dlina"
                          className={styles.filterModalAddInput}
                          style={{ minWidth: 160 }}
                        />
                      </div>
                      <div>
                        <label className={styles.formLabel} style={{ marginBottom: 4 }}>Название (как в интерфейсе)</label>
                        <input
                          type="text"
                          value={newGroupLabel}
                          onChange={(e) => setNewGroupLabel(e.target.value)}
                          placeholder="Например: Длина"
                          className={styles.filterModalAddInput}
                          style={{ minWidth: 160 }}
                        />
                      </div>
                      <button type="button" onClick={handleAddGroup} disabled={addingGroup || !newGroupKey.trim()} className={styles.submitBtn} style={{ flexShrink: 0 }}>
                        {addingGroup ? '…' : 'Создать группу'}
                      </button>
                    </div>
                  </div>
                ) : currentGroup ? (
                  (() => {
                    const group = currentGroup.key;
                    const label = currentGroup.label;
                    const isExtra = currentGroup.isExtra;
                    return (
                      <div className={styles.filterModalGroup}>
                        <div className={styles.filterModalGroupTitle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                          <span>{label}</span>
                          {isExtra && (
                            <button
                              type="button"
                              onClick={() => window.confirm(`Удалить группу «${label}»? Значения будут удалены у всех маршрутов.`) && handleRemoveGroup(group)}
                              disabled={removingGroupKey === group}
                              className={styles.deleteBtn}
                              style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                              title="Удалить группу"
                            >
                              {removingGroupKey === group ? '…' : 'Удалить группу'}
                            </button>
                          )}
                        </div>
                        <div className={styles.filterModalValues}>
                          {(getValues(group) || []).map((v) => {
                            const isEditing = editing?.group === group && editing?.value === v;
                            return (
                              <div key={v} className={styles.filterModalValueRow} style={isEditing ? { minWidth: 220, flex: '1 1 220px' } : undefined}>
                                {isEditing ? (
                                  <>
                                    <input
                                      ref={editInputRef}
                                      type="text"
                                      value={editingInput}
                                      onChange={(e) => setEditingInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') { e.preventDefault(); applyEdit(); }
                                        if (e.key === 'Escape') cancelEdit();
                                      }}
                                      className={styles.filterModalAddInput}
                                      style={{ minWidth: 120, flex: 1 }}
                                      aria-label="Новое значение"
                                    />
                                    <button type="button" onClick={applyEdit} disabled={savingEdit || !editingInput.trim() || editingInput.trim() === v} className={styles.filterModalValueApply} title="Применить" aria-label="Применить"><Check size={14} /></button>
                                    <button type="button" onClick={cancelEdit} className={styles.filterModalValueDelete} title="Отмена" aria-label="Отмена"><X size={14} /></button>
                                  </>
                                ) : (
                                  <>
                                    <span>{v}</span>
                                    <button type="button" onClick={() => startEdit(group, v)} className={styles.filterModalValueEdit} title="Изменить" aria-label={`Изменить ${v}`}><Pencil size={14} /></button>
                                    <button type="button" onClick={() => removeValue(group, v)} className={styles.filterModalValueDelete} title="Удалить" aria-label={`Удалить ${v}`}><Trash2 size={14} /></button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className={styles.filterModalAddRow}>
                          <input
                            type="text"
                            value={newValues[group] ?? ''}
                            onChange={(e) => setNewValues((prev) => ({ ...prev, [group]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addValue(group, newValues[group]); } }}
                            placeholder={`Добавить в ${label.toLowerCase()}...`}
                            className={styles.filterModalAddInput}
                            aria-label={`Добавить значение в ${label}`}
                          />
                          <button type="button" onClick={() => addValue(group, newValues[group])} className={styles.addBtn} style={{ flexShrink: 0 }}>
                            <Plus size={16} /> Добавить
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : null}
              </div>
            </>
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
    </div>
  );
}
