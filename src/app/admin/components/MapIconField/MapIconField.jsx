import { useMemo, useState } from 'react';
import { getIconGroups, getMuiIconComponent } from '../WhatToBringIcons';
import ImageCropModal from '../ImageCropModal';
import { buildMapIconHref, composePinFromImage } from '@/lib/mapPin';
import { mediaAPI } from '@/lib/api';
import adminStyles from '../../admin.module.css';
import styles from './MapIconField.module.css';

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
  const [cropSrc, setCropSrc] = useState('');
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

  // Файл сперва кадрируется в квадрат, потом вписывается в булавку и только затем уходит на сервер:
  // без этого на карту попадала бы исходная фотография прямоугольником среди меток
  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result || ''));
    reader.onerror = () => setUploadError('Не удалось прочитать файл.');
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (blob) => {
    setCropSrc('');
    setUploading(true);
    try {
      const pin = await composePinFromImage(blob);
      const fd = new FormData();
      fd.append('file', new File([pin], 'map-icon.png', { type: 'image/png' }));
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
    }
  };

  return (
    <div className={adminStyles.formGroup}>
      <label className={adminStyles.formLabel}>Иконка на карте</label>

      <div className={styles.head}>
        <img src={previewHref} alt="" className={styles.preview} />

        <div className={styles.segments}>
          <button
            type="button"
            className={`${styles.segment} ${mode === 'library' ? styles.segmentActive : ''}`}
            onClick={() => setMode('library')}
          >
            Библиотека
          </button>
          <button
            type="button"
            className={`${styles.segment} ${mode === 'upload' ? styles.segmentActive : ''}`}
            onClick={() => setMode('upload')}
          >
            Загрузить
          </button>
        </div>

        {icon || iconType ? (
          <button
            type="button"
            className={styles.reset}
            onClick={() => {
              setUploadError('');
              onChange({ mapIcon: '', mapIconType: null });
            }}
          >
            Сбросить
          </button>
        ) : null}
      </div>

      {mode === 'upload' ? (
        <div className={styles.panel}>
          <input
            type="file"
            accept="image/*"
            id="map-icon-upload"
            style={{ display: 'none' }}
            onChange={handleFilePick}
          />
          <label htmlFor="map-icon-upload" className={styles.uploadBtn}>
            {uploading ? 'Загрузка…' : 'Выбрать файл'}
          </label>
          {uploadError ? <div className={styles.error}>{uploadError}</div> : null}
          <div className={styles.hint}>
            Картинку можно будет кадрировать. Она встанет в круг внутри булавки — форма и цвет метки
            останутся такими же, как у остальных.
          </div>
        </div>
      ) : (
        <div className={styles.panel}>
          <input
            type="text"
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск значка по названию, например waves"
          />
          <div className={styles.grid}>
            {visible.map((name) => {
              const Icon = getMuiIconComponent(name);
              if (!Icon) return null;
              const active = icon === name && iconType === 'library';
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  className={`${styles.cell} ${active ? styles.cellActive : ''}`}
                  onClick={() => onChange({ mapIcon: name, mapIconType: 'library' })}
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>
          <div className={styles.hint}>
            {total === 0
              ? 'Ничего не найдено'
              : visible.length < total
                ? `Показано ${visible.length} из ${total} — уточните поиск, чтобы увидеть остальные`
                : `Найдено: ${total}`}
          </div>
        </div>
      )}

      <ImageCropModal
        open={!!cropSrc}
        imageSrc={cropSrc}
        title="Обрезка иконки"
        aspect={1}
        onComplete={handleCropComplete}
        onCancel={() => setCropSrc('')}
      />
    </div>
  );
}
