import { useMemo, useState } from 'react';
import { getIconGroups, getMuiIconComponent } from '../WhatToBringIcons';
import { buildMapIconHref } from '@/lib/mapPin';
import { mediaAPI } from '@/lib/api';
import styles from '../../admin.module.css';

/** Сколько значков показывать в выдаче: их полторы тысячи, все разом не нужны */
const MAX_VISIBLE = 60;

let iconNamesCache = null;

/**
 * Имена значков в порядке групп. Считаются при первом обращении, а не при импорте:
 * модуль попадает в общий бандл и иначе разбирал бы полторы тысячи имён по группам
 * на каждой странице сайта, включая публичные.
 * Set убирает повторы: значок вроде Bike подходит сразу нескольким группам,
 * а getIconGroups не исключает уже разобранные имена из последующих групп.
 */
function getIconNames() {
  if (!iconNamesCache) {
    iconNamesCache = [...new Set(getIconGroups().flatMap((g) => g.iconNames))];
  }
  return iconNamesCache;
}

/**
 * Поле «Иконка на карте»: значок из библиотеки Lucide либо загруженный файл.
 * Превью показывает собранную булавку — то, что окажется на карте, а не голый значок.
 */
export default function MapIconField({ icon, iconType, fallbackHref, onChange }) {
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  // Режим — состояние поля, а не формы: сам по себе он ничего не меняет в записи,
  // наверх уходит только выбранный значок, загруженный файл или сброс
  const [mode, setMode] = useState(iconType === 'upload' ? 'upload' : 'library');

  const previewHref = buildMapIconHref(icon, iconType, fallbackHref);

  const { visible, total } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const names = getIconNames();
    const found = q ? names.filter((n) => n.toLowerCase().includes(q)) : names;
    return { visible: found.slice(0, MAX_VISIBLE), total: found.length };
  }, [query]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await mediaAPI.upload(fd);
      const url = res.data?.url;
      // Пустой адрес молча означал бы «иконки нет» при заданном типе — считаем это ошибкой
      if (!url) throw new Error('Загрузка вернулась без адреса файла');
      onChange({ mapIcon: url, mapIconType: 'upload' });
    } catch (err) {
      console.error(err);
      setUploadError('Не удалось загрузить файл. Попробуйте ещё раз.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>Иконка на карте</label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <img
          src={previewHref}
          alt=""
          width={42}
          height={52}
          style={{ flexShrink: 0 }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`${styles.whatToBringTypeSegment} ${mode === 'library' ? styles.whatToBringTypeSegmentActive : ''}`}
            onClick={() => setMode('library')}
          >
            Библиотека
          </button>
          <button
            type="button"
            className={`${styles.whatToBringTypeSegment} ${mode === 'upload' ? styles.whatToBringTypeSegmentActive : ''}`}
            onClick={() => setMode('upload')}
          >
            Загрузить
          </button>
        </div>

        {icon || iconType ? (
          <button
            type="button"
            onClick={() => {
              setUploadError('');
              onChange({ mapIcon: '', mapIconType: null });
            }}
            className={styles.whatToBringUploadBtn}
          >
            Сбросить
          </button>
        ) : null}
      </div>

      {mode === 'upload' ? (
        <div style={{ marginTop: 10 }}>
          <input
            type="file"
            accept="image/*"
            id="map-icon-upload"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <label htmlFor="map-icon-upload" className={styles.whatToBringUploadBtn}>
            {uploading ? 'Загрузка…' : 'Выбрать файл'}
          </label>
          {uploadError ? (
            <div style={{ marginTop: 6, fontSize: '0.85rem', color: '#dc2626' }}>
              {uploadError}
            </div>
          ) : null}
          <div style={{ marginTop: 6, fontSize: '0.85rem', color: '#64748b' }}>
            Картинка заменит метку целиком и будет показана размером 42×52.
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          <input
            type="text"
            className={styles.formInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск значка по названию, например waves"
          />
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 6,
              marginTop: 8, maxHeight: 180, overflowY: 'auto',
            }}
          >
            {visible.map((name) => {
              const Icon = getMuiIconComponent(name);
              if (!Icon) return null;
              const active = icon === name && iconType === 'library';
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => onChange({ mapIcon: name, mapIconType: 'library' })}
                  style={{
                    width: 36, height: 36, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6, cursor: 'pointer', background: 'transparent',
                    border: active ? '2px solid #156A60' : '1px solid #e2e8f0',
                  }}
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 6, fontSize: '0.85rem', color: '#64748b' }}>
            {total === 0
              ? 'Ничего не найдено'
              : visible.length < total
                ? `Показано ${visible.length} из ${total} — уточните поиск, чтобы увидеть остальные`
                : `Найдено: ${total}`}
          </div>
        </div>
      )}
    </div>
  );
}
