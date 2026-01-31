'use client';

import { useEffect, useRef, useState } from 'react';
import { Route, ExternalLink, X } from 'lucide-react';
import { getImageUrl } from '@/lib/api';

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

export default function YandexMapPlace({ latitude, longitude, title, location, image, className }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const multiRouteRef = useRef(null);
  const placemarkRef = useRef(null);
  const routeFromRef = useRef(null); // { lat, lon } — старт построенного маршрута
  const mapWrapperRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState(null);
  const [routeStatus, setRouteStatus] = useState(null); // null | 'loading' | 'ready' | 'denied' | 'error'
  const [routeBuilt, setRouteBuilt] = useState(false); // маршрут уже построен на карте
  const [customBalloon, setCustomBalloon] = useState(null); // null | { x, y } — позиция кастомного попапа относительно контейнера карты

  const hasCoords = latitude != null && longitude != null && Number(latitude) && Number(longitude);
  const lat = hasCoords ? Number(latitude) : DEFAULT_CENTER[0];
  const lon = hasCoords ? Number(longitude) : DEFAULT_CENTER[1];
  const center = [lat, lon];

  function getPixelPositionFromCenter(map, coords, placemark) {
    const wrapper = mapWrapperRef.current || containerRef.current;
    if (!wrapper || !map) return null;
    const rect = wrapper.getBoundingClientRect();
    let x, y;
    if (typeof map.convertCoordinatesToClient === 'function') {
      const clientXY = map.convertCoordinatesToClient(coords);
      x = clientXY[0] - rect.left;
      y = clientXY[1] - rect.top;
    } else if (typeof map.converter !== 'undefined' && typeof map.converter.globalToClient === 'function') {
      const clientXY = map.converter.globalToClient(coords);
      x = clientXY[0] - rect.left;
      y = clientXY[1] - rect.top;
    } else if (placemark && typeof placemark.getOverlaySync === 'function') {
      try {
        const overlay = placemark.getOverlaySync();
        if (overlay && overlay.getElement) {
          const el = overlay.getElement();
          if (el && typeof el.getBoundingClientRect === 'function') {
            const r = el.getBoundingClientRect();
            x = r.left - rect.left + r.width / 2;
            y = r.top - rect.top;
          } else return null;
        } else return null;
      } catch (_) {
        return null;
      }
    } else {
      return null;
    }
    return { x, y };
  }

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
      { balloonContentHeader: '\u00A0', balloonContentBody: '\u00A0' },
      {
        draggable: false,
        iconLayout: 'default#image',
        iconImageHref: '/pointMap.png',
        iconImageSize: [51, 62],
        iconImageOffset: [-26, -62],
      }
    );
    map.geoObjects.add(placemark);
    placemarkRef.current = placemark;

    map.balloon.events.add('open', () => {
      const pos = getPixelPositionFromCenter(map, center, placemark);
      if (pos) {
        map.balloon.close();
        setCustomBalloon(pos);
      } else {
        const wrapper = mapWrapperRef.current || containerRef.current;
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        const balloonEl = document.querySelector('[class*="balloon__layout"], [class*="balloon__content"]');
        let x, y;
        if (balloonEl) {
          const br = balloonEl.getBoundingClientRect();
          x = br.left - rect.left + br.width / 2;
          y = br.top - rect.top;
        } else {
          x = rect.width / 2;
          y = rect.height / 2 - 80;
        }
        map.balloon.close();
        setCustomBalloon({ x, y });
      }
    });

    map.events.add('actionbegin', () => setCustomBalloon(null));

    return () => {
      multiRouteRef.current = null;
      placemarkRef.current = null;
      routeFromRef.current = null;
      if (mapRef.current && mapRef.current.destroy) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      setCustomBalloon(null);
    };
  }, [scriptReady, lat, lon]);

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
        <div ref={mapWrapperRef} style={{ position: 'relative', width: '100%', height: mapHeight, borderRadius: 8, overflow: 'hidden' }}>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
          {customBalloon && (
            <div
              role="dialog"
              aria-label="Информация о месте"
              style={{
                position: 'absolute',
                left: customBalloon.x,
                top: customBalloon.y - 16,
                transform: 'translate(-50%, -100%)',
                minWidth: 220,
                maxWidth: 400,
                display: 'flex',
                flexDirection: 'row',
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                zIndex: 10,
                pointerEvents: 'auto',
                paddingLeft: '88px'
              }}
            >
              {image && (
                <div
                  style={{
                    width: 88,
                    height: '100%',
                    flexShrink: 0,
                    alignSelf: 'stretch',
                    borderTopLeftRadius: 12,
                    borderBottomLeftRadius: 12,
                    overflow: 'hidden',
                    background: '#f1f5f9',
                    position: 'absolute',
                    left: '0',
                    top: '0'
                  }}
                >
                  <img
                    src={getImageUrl(image)}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      verticalAlign: 'top',
                    }}
                  />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0, padding: '20px 40px 18px 20px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setCustomBalloon(null)}
                  aria-label="Закрыть"
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    background: 'none',
                    border: 'none',
                    padding: 4,
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} />
                </button>
                {location && (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 6, lineHeight: 1.3 }}>
                    {location}
                  </div>
                )}
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111', lineHeight: 1.3 }}>
                  {title || location || 'Место'}
                </div>
              </div>
            </div>
          )}
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
