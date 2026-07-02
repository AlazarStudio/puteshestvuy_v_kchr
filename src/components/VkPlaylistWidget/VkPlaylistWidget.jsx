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
      existing.addEventListener('error', () => {
        openApiPromise = null;
        existing.remove();
        reject(new Error('Не удалось загрузить VK openapi.js'));
      }, { once: true });
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
      .catch((e) => console.error('VkPlaylistWidget:', e));
    return () => {
      cancelled = true;
      if (node) node.innerHTML = '';
    };
  }, [ownerId, playlistId, hash]);

  if (!parsed) return null;

  return <div id={idRef.current} ref={containerRef} />;
}
