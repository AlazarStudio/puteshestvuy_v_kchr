'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_CENTER = [43.5, 41.7];
const DEFAULT_ZOOM = 14;
const SCRIPT_ID = 'yandex-maps-script-2-1';

/**
 * Ссылка на маршрут в Яндекс.Картах: от текущей геолокации до места.
 * rtext = lat1,lon1~lat2,lon2 (от~до), rtt=auto (на авто).
 */
function buildYandexRouteUrl(fromLat, fromLon, toLat, toLon) {
  const rtext = `${fromLat},${fromLon}~${toLat},${toLon}`;
  return `https://yandex.ru/maps/?rtext=${encodeURIComponent(rtext)}&rtt=auto`;
}

/**
 * Ссылка на точку в Яндекс.Картах (pt = долгота,широта).
 */
function buildYandexPointUrl(lat, lon, zoom = 16) {
  return `https://yandex.ru/maps/?pt=${lon},${lat}&z=${zoom}`;
}

export default function YandexMapPlace({ latitude, longitude, title, location, className }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState(null);
  const [routeStatus, setRouteStatus] = useState(null); // null | 'loading' | 'open' | 'denied' | 'error'

  const hasCoords = latitude != null && longitude != null && Number(latitude) && Number(longitude);
  const lat = hasCoords ? Number(latitude) : DEFAULT_CENTER[0];
  const lon = hasCoords ? Number(longitude) : DEFAULT_CENTER[1];
  const center = [lat, lon];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';
    const lang = 'ru_RU';

    if (window.ymaps && window.ymaps.ready) {
      setScriptReady(true);
      return;
    }

    if (document.getElementById(SCRIPT_ID)) {
      if (window.ymaps && window.ymaps.ready) {
        window.ymaps.ready(() => setScriptReady(true));
      } else {
        const check = setInterval(() => {
          if (window.ymaps && window.ymaps.ready) {
            clearInterval(check);
            window.ymaps.ready(() => setScriptReady(true));
          }
        }, 100);
        return () => clearInterval(check);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=${lang}`;
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(() => setScriptReady(true));
    };
    script.onerror = () => setError('Не удалось загрузить Яндекс.Карты');
    document.head.appendChild(script);

    return () => {
      if (mapRef.current && mapRef.current.destroy) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.ymaps) return;

    const map = new window.ymaps.Map(containerRef.current, {
      center,
      zoom: DEFAULT_ZOOM,
      controls: ['zoomControl', 'typeSelector', 'fullscreenControl'],
    });
    mapRef.current = map;

    const placemark = new window.ymaps.Placemark(
      center,
      {
        balloonContentHeader: title || location || 'Место',
        balloonContentBody: location || '',
      },
      { draggable: false }
    );
    map.geoObjects.add(placemark);

    return () => {
      if (mapRef.current && mapRef.current.destroy) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [scriptReady, lat, lon, title, location]);

  const handleBuildRoute = () => {
    setRouteStatus('loading');
    if (!navigator.geolocation) {
      setRouteStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const fromLat = position.coords.latitude;
        const fromLon = position.coords.longitude;
        const url = buildYandexRouteUrl(fromLat, fromLon, lat, lon);
        window.open(url, '_blank', 'noopener,noreferrer');
        setRouteStatus('open');
      },
      () => {
        setRouteStatus('denied');
      }
    );
  };

  const handleOpenYandexMaps = () => {
    window.open(buildYandexPointUrl(lat, lon), '_blank', 'noopener,noreferrer');
  };

  if (error) {
    return (
      <div className={className} style={{ background: '#f1f5f9', borderRadius: 8, padding: 24, color: '#64748b', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  return (
    <div className={className}>
      {!scriptReady ? (
        <div style={{ height: 500, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          Загрузка карты...
        </div>
      ) : (
        <div ref={containerRef} style={{ width: '100%', height: 500, borderRadius: 8, overflow: 'hidden' }} />
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
        <button
          type="button"
          onClick={handleBuildRoute}
          disabled={routeStatus === 'loading'}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#fff',
            fontWeight: 500,
            cursor: routeStatus === 'loading' ? 'wait' : 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {routeStatus === 'loading' ? 'Определяем местоположение...' : 'Построить маршрут'}
        </button>
        <button
          type="button"
          onClick={handleOpenYandexMaps}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#fff',
            fontWeight: 500,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Открыть в Яндекс.Картах
        </button>
      </div>
      {routeStatus === 'denied' && (
        <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#dc2626' }}>
          Доступ к геолокации запрещён. Откройте «Открыть в Яндекс.Картах» и постройте маршрут там.
        </p>
      )}
    </div>
  );
}
