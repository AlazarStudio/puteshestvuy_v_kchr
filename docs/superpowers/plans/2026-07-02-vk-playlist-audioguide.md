# VK Playlist Audioguide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Поле «Аудиогид» места принимает код виджета VK-плейлиста (и ссылку `vk.com/music/playlist/...`) наравне с Яндекс.Музыкой; VK-плейлист отображается официальным виджетом в модалке места.

**Architecture:** `audioGuide` остаётся строкой. VK-плейлист хранится каноническим токеном `vk_playlist:{ownerId}_{playlistId}_{hash}`. Админка парсит вставленный код/ссылку в токен; `PlaceModal` по префиксу токена рендерит новый компонент `VkPlaylistWidget`, который грузит официальный `openapi.js` (синглтон) и вызывает `VK.Widgets.Playlist`. Яндекс.Музыка работает как раньше.

**Tech Stack:** React 18, Vite. Без новых зависимостей. Тестов в проекте нет (per CLAUDE.md) — проверка через `npm run lint` и вручную через dev-сервер.

**Спека:** `docs/superpowers/specs/2026-07-02-vk-playlist-audioguide-design.md`

**Стиль кода:** `src/components/PlaceModal/PlaceModal.jsx` написан БЕЗ точек с запятой — правки в нём делать в том же стиле. `src/app/admin/places/[id]/page.jsx` и новый компонент — С точками с запятой (как `RichTextContent`).

---

### Task 1: Компонент VkPlaylistWidget

**Files:**
- Create: `src/components/VkPlaylistWidget/VkPlaylistWidget.jsx`
- Create: `src/components/VkPlaylistWidget/index.js`

- [ ] **Step 1: Создать `src/components/VkPlaylistWidget/VkPlaylistWidget.jsx`**

Полное содержимое файла:

```jsx
import { useEffect, useRef } from 'react';

const SCRIPT_ID = 'vk-openapi-script';
let openApiPromise = null;
let widgetCounter = 0;

/** Загружает официальный VK openapi.js один раз на приложение. */
function loadVkOpenApi() {
  if (openApiPromise) return openApiPromise;
  openApiPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      if (window.VK?.Widgets) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Не удалось загрузить VK openapi.js')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://vk.com/js/api/openapi.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      openApiPromise = null;
      script.remove();
      reject(new Error('Не удалось загрузить VK openapi.js'));
    };
    document.body.appendChild(script);
  });
  return openApiPromise;
}

export const VK_PLAYLIST_PREFIX = 'vk_playlist:';

/** Разбирает токен `vk_playlist:{ownerId}_{playlistId}_{hash}` (hash может быть пустым). */
export function parseVkPlaylistToken(value) {
  if (typeof value !== 'string' || !value.startsWith(VK_PLAYLIST_PREFIX)) return null;
  const match = value.slice(VK_PLAYLIST_PREFIX.length).match(/^(-?\d+)_(\d+)(?:_([A-Za-z0-9]*))?$/);
  if (!match) return null;
  return { ownerId: Number(match[1]), playlistId: Number(match[2]), hash: match[3] || '' };
}

/**
 * Официальный виджет VK-плейлиста (VK.Widgets.Playlist).
 * При нераспознанном токене или сбое загрузки скрипта не рендерит ничего.
 */
export default function VkPlaylistWidget({ token }) {
  const containerRef = useRef(null);
  const idRef = useRef(null);
  if (idRef.current === null) {
    widgetCounter += 1;
    idRef.current = `vk_playlist_widget_${widgetCounter}`;
  }

  const parsed = parseVkPlaylistToken(token);
  const ownerId = parsed?.ownerId;
  const playlistId = parsed?.playlistId;
  const hash = parsed?.hash;

  useEffect(() => {
    if (ownerId == null || playlistId == null) return undefined;
    const node = containerRef.current;
    let cancelled = false;
    loadVkOpenApi()
      .then(() => {
        if (cancelled || !node || !window.VK?.Widgets?.Playlist) return;
        window.VK.Widgets.Playlist(idRef.current, ownerId, playlistId, hash);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (node) node.innerHTML = '';
    };
  }, [ownerId, playlistId, hash]);

  if (!parsed) return null;

  return <div id={idRef.current} ref={containerRef} />;
}
```

Замечания для исполнителя:
- Id контейнера генерируется модульным счётчиком, НЕ через `useId` — React-овские id содержат `:`, что может сломать внутренние селекторы VK.
- `openApiPromise` сбрасывается в `null` при ошибке загрузки, чтобы следующий монтаж мог повторить попытку.
- Паттерн загрузки внешнего скрипта повторяет существующие `YandexMapPicker`/`BVI` (script с id-guard в `document.body`).

- [ ] **Step 2: Создать `src/components/VkPlaylistWidget/index.js`**

Полное содержимое файла:

```js
export { default, VK_PLAYLIST_PREFIX, parseVkPlaylistToken } from './VkPlaylistWidget';
```

(Существующие index.js в компонентах реэкспортируют только default — здесь добавляем и именованные экспорты, они нужны потребителям.)

- [ ] **Step 3: Прогнать линтер**

Run: `npm run lint`
Expected: без новых ошибок (предупреждения, существовавшие до правок, не в счёт).

- [ ] **Step 4: Commit**

```bash
git add src/components/VkPlaylistWidget
git commit -m "feat: add VkPlaylistWidget component for VK playlist embeds"
```

---

### Task 2: Отображение VK-плейлиста в PlaceModal

**Files:**
- Modify: `src/components/PlaceModal/PlaceModal.jsx` (импорты ~строка 16; секция «Аудиогид» строки 429–443)

- [ ] **Step 1: Добавить импорт**

После строки `import ParallaxImage from '../ParallaxImage'` добавить (без точки с запятой — стиль файла):

```jsx
import VkPlaylistWidget, { VK_PLAYLIST_PREFIX } from '../VkPlaylistWidget'
```

- [ ] **Step 2: Ветвление в секции «Аудиогид»**

Заменить блок (строки 429–443):

```jsx
                        {/* Аудиогид — встраивание Яндекс.Музыки */}
                        {place?.audioGuide && (
                          <>
                            <div className={styles.title}>Аудиогид</div>
                            <div className={styles.audioEmbed}>
                              <iframe
                                title="Аудиогид — Яндекс.Музыка"
                                src={place.audioGuide}
                                frameBorder="0"
                                allow="clipboard-write"
                                style={{ border: 'none', width: '100%', maxWidth: '100%', height: 556 }}
                              />
                            </div>
                          </>
                        )}
```

на:

```jsx
                        {/* Аудиогид — Яндекс.Музыка (iframe) или VK-плейлист (виджет) */}
                        {place?.audioGuide && (
                          <>
                            <div className={styles.title}>Аудиогид</div>
                            <div className={styles.audioEmbed}>
                              {place.audioGuide.startsWith(VK_PLAYLIST_PREFIX) ? (
                                <VkPlaylistWidget token={place.audioGuide} />
                              ) : (
                                <iframe
                                  title="Аудиогид — Яндекс.Музыка"
                                  src={place.audioGuide}
                                  frameBorder="0"
                                  allow="clipboard-write"
                                  style={{ border: 'none', width: '100%', maxWidth: '100%', height: 556 }}
                                />
                              )}
                            </div>
                          </>
                        )}
```

- [ ] **Step 3: Прогнать линтер**

Run: `npm run lint`
Expected: без новых ошибок.

- [ ] **Step 4: Commit**

```bash
git add src/components/PlaceModal/PlaceModal.jsx
git commit -m "feat: render VK playlist widget in place audioguide section"
```

---

### Task 3: Парсинг VK-кода в админке + тексты поля

**Files:**
- Modify: `src/app/admin/places/[id]/page.jsx` (константы ~строка 15; `handleAudioGuideChange` строки 344–351; лейбл и подсказка строки 981–987)

- [ ] **Step 1: Добавить регулярки на уровне модуля**

После `const TOAST_DURATION_MS = 3000;` добавить:

```js
// Код виджета VK: VK.Widgets.Playlist("vk_playlist_-217757946_1", -217757946, 1, "hash", {})
const VK_PLAYLIST_EMBED_RE = /VK\.Widgets\.Playlist\(\s*["'][^"']*["']\s*,\s*(-?\d+)\s*,\s*(\d+)\s*,\s*["']([A-Za-z0-9]*)["']/;
// Ссылка на плейлист: https://vk.com/music/playlist/-217757946_1 или .../-217757946_1_hash
const VK_PLAYLIST_URL_RE = /vk\.com\/music\/playlist\/(-?\d+)_(\d+)(?:_([A-Za-z0-9]+))?/;
```

- [ ] **Step 2: Расширить `handleAudioGuideChange`**

Заменить (строки 344–351):

```js
  const handleAudioGuideChange = (e) => {
    let value = e.target.value.trim();
    if (value.includes('<iframe') && value.includes('src=')) {
      const match = value.match(/src=["']([^"']+)["']/);
      if (match) value = match[1];
    }
    setFormData((prev) => ({ ...prev, audioGuide: value }));
  };
```

на:

```js
  const handleAudioGuideChange = (e) => {
    let value = e.target.value.trim();
    const vkMatch = value.match(VK_PLAYLIST_EMBED_RE) || value.match(VK_PLAYLIST_URL_RE);
    if (vkMatch) {
      value = `vk_playlist:${vkMatch[1]}_${vkMatch[2]}_${vkMatch[3] || ''}`;
    } else if (value.includes('<iframe') && value.includes('src=')) {
      const match = value.match(/src=["']([^"']+)["']/);
      if (match) value = match[1];
    }
    setFormData((prev) => ({ ...prev, audioGuide: value }));
  };
```

(Токен должен совпадать с форматом `parseVkPlaylistToken` из Task 1: `vk_playlist:{ownerId}_{playlistId}_{hash}`, hash может быть пустым — тогда токен оканчивается на `_`.)

- [ ] **Step 3: Обновить лейбл и подсказку поля**

Заменить (строки 981–987):

```jsx
            <label className={styles.formLabel}>Аудиогид (Яндекс.Музыка)</label>
            <div className={styles.formHintBox}>
              <span className={styles.formHintIcon}>💡</span>
              <span className={styles.formHintText}>
                Вставьте ссылку из кода встраивания (атрибут <code>src</code> из iframe) или вставьте весь код iframe — ссылка подставится автоматически.
              </span>
            </div>
```

на:

```jsx
            <label className={styles.formLabel}>Аудиогид (Яндекс.Музыка / VK)</label>
            <div className={styles.formHintBox}>
              <span className={styles.formHintIcon}>💡</span>
              <span className={styles.formHintText}>
                Вставьте ссылку из кода встраивания Яндекс.Музыки (атрибут <code>src</code> из iframe) или весь код iframe — ссылка подставится автоматически. Также можно вставить код виджета плейлиста VK (Поделиться → Экспортировать) — он распознается автоматически.
              </span>
            </div>
```

Плейсхолдер `input` не менять.

- [ ] **Step 4: Прогнать линтер**

Run: `npm run lint`
Expected: без новых ошибок.

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/places/[id]/page.jsx"
git commit -m "feat: parse VK playlist embed code in admin audioguide field"
```

---

### Task 4: Ручная проверка

**Files:** нет правок кода.

- [ ] **Step 1: Проверка парсинга без бэкенда**

Быстрая проверка регулярок и токена в Node:

```bash
node -e "
const EMBED_RE = /VK\.Widgets\.Playlist\(\s*[\"'][^\"']*[\"']\s*,\s*(-?\d+)\s*,\s*(\d+)\s*,\s*[\"']([A-Za-z0-9]*)[\"']/;
const code = 'VK.Widgets.Playlist(\"vk_playlist_-217757946_1\", -217757946, 1, \"\", {});';
const m = code.match(EMBED_RE);
console.log(m ? 'vk_playlist:' + m[1] + '_' + m[2] + '_' + (m[3] || '') : 'NO MATCH');
"
```

Expected output: `vk_playlist:-217757946_1_`

- [ ] **Step 2: Проверка в dev-сервере (нужен запущенный бэкенд)**

1. `npm run dev` → открыть админку → Места → любое место.
2. В поле «Аудиогид» вставить полный код виджета VK (div + 2 script). Ожидание: в поле появляется `vk_playlist:-217757946_1_`.
3. Сохранить. Открыть место на публичной части (модалка места). Ожидание: секция «Аудиогид» показывает VK-плейлист (виджет с треками).
4. Регресс: место со старой ссылкой Яндекс.Музыки — секция «Аудиогид» отображается как раньше (iframe).

- [ ] **Step 3: Commit плана (отметки чекбоксов), если менялся**

```bash
git add docs/superpowers/plans/2026-07-02-vk-playlist-audioguide.md
git commit -m "docs: mark VK playlist plan tasks done"
```
