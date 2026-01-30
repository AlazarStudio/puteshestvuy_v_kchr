'use client';

import { useEffect, useRef, useState } from 'react';
import { Route, ExternalLink } from 'lucide-react';

const DEFAULT_CENTER = [43.5, 41.7];
const DEFAULT_ZOOM = 14;
const SCRIPT_ID = 'yandex-maps-script-2-1';

/**
 * Ссылка на точку в Яндекс.Картах (pt = долгота,широта).
 */
function buildYandexPointUrl(lat, lon, zoom = 16) {
  return `https://yandex.ru/maps/?pt=${lon},${lat}&z=${zoom}`;
}

/** Ссылка на маршрут в Яндекс.Картах (открыть в приложении). */
function buildYandexRouteUrl(fromLat, fromLon, toLat, toLon) {
  const rtext = `${fromLat},${fromLon}~${toLat},${toLon}`;
  return `https://yandex.ru/maps/?rtext=${encodeURIComponent(rtext)}&rtt=auto`;
}

export default function YandexMapPlace({ latitude, longitude, title, location, className }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const multiRouteRef = useRef(null);
  const placemarkRef = useRef(null);
  const routeFromRef = useRef(null); // { lat, lon } — старт построенного маршрута
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState(null);
  const [routeStatus, setRouteStatus] = useState(null); // null | 'loading' | 'ready' | 'denied' | 'error'
  const [routeBuilt, setRouteBuilt] = useState(false); // маршрут уже построен на карте

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

    setRouteBuilt(false);
    const map = new window.ymaps.Map(containerRef.current, {
      center,
      zoom: DEFAULT_ZOOM,
      controls: ['zoomControl', 'typeSelector', 'fullscreenControl', 'geolocationControl'],
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
    placemarkRef.current = placemark;

    return () => {
      multiRouteRef.current = null;
      placemarkRef.current = null;
      routeFromRef.current = null;
      if (mapRef.current && mapRef.current.destroy) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [scriptReady, lat, lon, title, location]);

  const handleBuildRoute = () => {
    if (!hasCoords || !scriptReady || !window.ymaps || !mapRef.current) return;
    setRouteStatus('loading');
    if (!navigator.geolocation) {
      setRouteStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const fromLat = position.coords.latitude;
        const fromLon = position.coords.longitude;
        const referencePoints = [[fromLat, fromLon], [lat, lon]];
        const requireModules = window.ymaps.modules?.require;
        if (typeof requireModules !== 'function') {
          window.open(buildYandexRouteUrl(fromLat, fromLon, lat, lon), '_blank', 'noopener,noreferrer');
          setRouteStatus('ready');
          return;
        }
        const fallbackTimer = setTimeout(() => {
          window.open(buildYandexRouteUrl(fromLat, fromLon, lat, lon), '_blank', 'noopener,noreferrer');
          setRouteStatus('ready');
        }, 8000);
        window.ymaps.modules.require(['multiRouter.MultiRoute', 'multiRouter.MultiRouteModel'], (MultiRoute, MultiRouteModel) => {
          clearTimeout(fallbackTimer);
          if (multiRouteRef.current && mapRef.current) {
            mapRef.current.geoObjects.remove(multiRouteRef.current);
            multiRouteRef.current = null;
          }
          if (placemarkRef.current && mapRef.current) {
            mapRef.current.geoObjects.remove(placemarkRef.current);
            placemarkRef.current = null;
          }
          const multiRoute = new MultiRoute(
            { referencePoints, params: { routingMode: 'auto' } },
            {
              boundsAutoApply: true,
              routeActiveStrokeColor: '#00BF00',
              routeActiveStrokeWidth: 5,
              routeStrokeColor: '#80BF8066',
              routeStrokeWidth: 4,
            }
          );
          mapRef.current.geoObjects.add(multiRoute);
          multiRouteRef.current = multiRoute;
          routeFromRef.current = { lat: fromLat, lon: fromLon };
          setRouteStatus('ready');
          setRouteBuilt(true);
        });
      },
      () => {
        setRouteStatus('denied');
      }
    );
  };

  const handleOpenYandexMaps = () => {
    const from = routeFromRef.current;
    if (from) {
      window.open(buildYandexRouteUrl(from.lat, from.lon, lat, lon), '_blank', 'noopener,noreferrer');
    } else {
      window.open(buildYandexPointUrl(lat, lon), '_blank', 'noopener,noreferrer');
    }
  };

  if (error) {
    return (
      <div className={className} style={{ background: '#f1f5f9', borderRadius: 8, padding: 24, color: '#64748b', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  const mapHeight = 500;
  const overlayStyle = {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 6,
    background: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    zIndex: 1,
  };
  const iconBtnStyle = {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    color: '#475569',
  };

  return (
    <div className={className}>
      {!scriptReady ? (
        <div style={{ height: mapHeight, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          Загрузка карты...
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: mapHeight, borderRadius: 8, overflow: 'hidden' }}>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
          <div style={overlayStyle}>
            <button
              type="button"
              onClick={handleBuildRoute}
              disabled={routeStatus === 'loading'}
              title={routeStatus === 'loading' ? 'Определяем местоположение...' : 'Построить маршрут'}
              style={{
                ...iconBtnStyle,
                cursor: routeStatus === 'loading' ? 'wait' : 'pointer',
                opacity: routeStatus === 'loading' ? 0.7 : 1,
              }}
            >
              <Route size={20} strokeWidth={2} />
            </button>
            {routeBuilt && (
              <button
                type="button"
                onClick={handleOpenYandexMaps}
                title="Открыть в Яндекс.Картах"
                style={iconBtnStyle}
              >
                <ExternalLink size={20} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      )}
      {routeStatus === 'denied' && (
        <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#dc2626' }}>
          Доступ к геолокации запрещён. Разрешите доступ или откройте карту в приложении Яндекс.
        </p>
      )}
    </div>
  );
}
