

import { useEffect, useRef, useState } from 'react';
import { Route, ExternalLink } from 'lucide-react';

const DEFAULT_CENTER = [43.5, 41.7];
const DEFAULT_ZOOM = 10;
const SCRIPT_ID = 'yandex-maps-script-2-1';
const MAP_HEIGHT = 400;

/** Ссылка на маршрут в Яндекс.Картах (все точки по порядку). points — массив [lat, lon]. */
function buildYandexRouteUrlMulti(points) {
  if (points.length === 0) return 'https://yandex.ru/maps/';
  const rtext = points.map((p) => `${p[0]},${p[1]}`).join('~');
  return `https://yandex.ru/maps/?rtext=${encodeURIComponent(rtext)}&rtt=auto`;
}

/**
 * Карта маршрута: точки мест в порядке следования и маршрут между ними.
 * places — массив { id, title, latitude, longitude, ... } в порядке маршрута.
 * showRouteFromMe — показывать кнопки «Построить маршрут» (от меня до первой точки) и «Открыть в Яндекс.Картах» со всеми точками.
 * onPlacemarkClick — вызывается при клике на маркер, аргумент — объект места.
 */
export default function YandexMapRoute({ places = [], height = MAP_HEIGHT, className, showRouteFromMe = false, onPlacemarkClick, routeOverride = null, openUrl = null }) {
  const containerRef = useRef(null);
  const mapWrapperRef = useRef(null);
  const mapRef = useRef(null);
  const placemarksRef = useRef([]);
  const routeRef = useRef(null);
  const geocodedMarkersRef = useRef([]); // метки с названиями точек, определёнными по координатам
  const routeFromMeRef = useRef(null); // маршрут от пользователя до первой точки
  const userCoordsRef = useRef(null); // { lat, lon } — сохранённое местоположение пользователя
  const onPlacemarkClickRef = useRef(onPlacemarkClick);
  onPlacemarkClickRef.current = onPlacemarkClick;
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState(null);
  const [routeStatus, setRouteStatus] = useState(null); // null | 'loading' | 'ready' | 'denied' | 'error'
  const [routeBuiltFromMe, setRouteBuiltFromMe] = useState(false);

  const pointsWithCoords = places.filter(
    (p) =>
      p &&
      p.latitude != null &&
      p.longitude != null &&
      Number(p.latitude) &&
      Number(p.longitude)
  );
  const coordsOrdered = pointsWithCoords.map((p) => [Number(p.latitude), Number(p.longitude)]);
  // routeOverride (из прикреплённой ссылки Яндекс.Карт) задаёт точки и режим маршрута
  // вместо координат мест; метки мест при этом остаются прежними.
  const routePoints = routeOverride?.points?.length ? routeOverride.points : coordsOrdered;
  const routingMode = routeOverride?.mode || 'auto';
  // Маршрут можно показать только по прикреплённой ссылке — даже если у маршрута нет мест.
  const hasOverrideRoute = Array.isArray(routeOverride?.points) && routeOverride.points.length >= 2;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';
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

    setRouteBuiltFromMe(false);
    userCoordsRef.current = null;
    const controls = ['zoomControl', 'typeSelector', 'fullscreenControl'];
    if (showRouteFromMe) {
      controls.push('geolocationControl');
    }
    const map = new window.ymaps.Map(containerRef.current, {
      center: coordsOrdered.length ? coordsOrdered[0] : (routePoints.length ? routePoints[0] : DEFAULT_CENTER),
      zoom: DEFAULT_ZOOM,
      controls,
    });
    mapRef.current = map;

    const placemarks = [];
    geocodedMarkersRef.current = [];

    if (pointsWithCoords.length > 0) {
      pointsWithCoords.forEach((place, index) => {
        const coords = [Number(place.latitude), Number(place.longitude)];
        const label = String(index + 1);
        const placemark = new window.ymaps.Placemark(
          coords,
          {
            balloonContent: onPlacemarkClick ? '' : `<strong>${index + 1}. ${place.title || 'Точка'}</strong>`,
            iconContent: label,
          },
          {
            preset: 'islands#blueCircleIcon',
            iconContentLayout: window.ymaps.templateLayoutFactory.createClass(
              '<div style="color:#fff;font-weight:bold;font-size:14px;line-height:1;margin-top:4px;">$[properties.iconContent]</div>'
            ),
          }
        );
        if (typeof onPlacemarkClickRef.current === 'function') {
          placemark.events.add('click', () => onPlacemarkClickRef.current?.(place));
        }
        map.geoObjects.add(placemark);
        placemarks.push(placemark);
      });

      if (coordsOrdered.length === 1 && !hasOverrideRoute) {
        map.setCenter(coordsOrdered[0], 14);
      } else if (coordsOrdered.length >= 2 && typeof window.ymaps.modules?.require !== 'function') {
        map.setBounds(window.ymaps.util.bounds.fromPoints(coordsOrdered), {
          checkZoomRange: true,
          zoomMargin: 50,
        });
      }
    }

    // Линия маршрута строится по routePoints (из прикреплённой ссылки, если она задана,
    // иначе по координатам мест) — независимо от того, есть ли у маршрута места.
    if (routePoints.length >= 2) {
      const requireModules = window.ymaps.modules?.require;
      if (typeof requireModules === 'function') {
        requireModules(['multiRouter.MultiRoute'], (MultiRoute) => {
          if (!mapRef.current) return;
          if (routeRef.current) {
            mapRef.current.geoObjects.remove(routeRef.current);
            routeRef.current = null;
          }
          const multiRoute = new MultiRoute(
            {
              referencePoints: routePoints,
              params: { routingMode: routingMode },
            },
            {
              boundsAutoApply: true,
              // прячем «родной» бейдж Яндекса с длиной (у начала линии) — свою метку с
              // длиной ставим по центру линии ниже (в requestsuccess).
              routeActiveMarkerVisible: false,
              // при маршруте из ссылки прячем технические A/B-метки Яндекса — на карте
              // остаются названные POI-метки Яндекса (с их категорийными иконками) в
              // этих точках, наши пронумерованные метки мест и сама линия маршрута.
              wayPointVisible: !hasOverrideRoute,
              routeActiveStrokeColor: '#00BF00',
              routeActiveStrokeWidth: 5,
              routeStrokeColor: '#80BF8066',
              routeStrokeWidth: 4,
            }
          );
          mapRef.current.geoObjects.add(multiRoute);
          routeRef.current = multiRoute;

          // Метка с длиной маршрута — по центру линии (пин Яндекса скрыт выше).
          let distanceLabel = null;
          multiRoute.model.events.add('requestsuccess', () => {
            if (!mapRef.current) return;
            const active = multiRoute.getActiveRoute && multiRoute.getActiveRoute();
            if (!active) return;
            const distance = active.properties.get('distance');
            const distanceText = distance && distance.text ? distance.text : '';
            if (!distanceText) return;
            // Геометрия активного маршрута доступна только через paths → segments.
            let coords = [];
            try {
              const paths = active.getPaths();
              for (let i = 0; i < paths.getLength(); i++) {
                const segments = paths.get(i).getSegments();
                for (let j = 0; j < segments.getLength(); j++) {
                  const g = segments.get(j).geometry.getCoordinates();
                  if (Array.isArray(g)) coords.push(...g);
                }
              }
            } catch {
              coords = [];
            }
            if (!coords.length) return;
            const mid = coords[Math.floor(coords.length / 2)];
            if (!Array.isArray(mid) || typeof mid[0] !== 'number') return;
            if (distanceLabel) {
              try { mapRef.current.geoObjects.remove(distanceLabel); } catch { /* уже удалена */ }
              const i = geocodedMarkersRef.current.indexOf(distanceLabel);
              if (i >= 0) geocodedMarkersRef.current.splice(i, 1);
            }
            distanceLabel = new window.ymaps.Placemark(
              mid,
              { iconContent: distanceText },
              { preset: 'islands#darkGreenStretchyIcon' }
            );
            mapRef.current.geoObjects.add(distanceLabel);
            geocodedMarkersRef.current.push(distanceLabel);
          });
        });
      } else {
        const polyline = new window.ymaps.Polyline(routePoints, {}, {
          strokeColor: '#00BF00',
          strokeWidth: 4,
          strokeOpacity: 0.8,
        });
        map.geoObjects.add(polyline);
        routeRef.current = polyline;
        map.setBounds(window.ymaps.util.bounds.fromPoints(routePoints), {
          checkZoomRange: true,
          zoomMargin: 50,
        });
      }
    }

    // Точки маршрута из ссылки не содержат названий — определяем их по координатам
    // (reverse geocode) и подписываем метки. Только когда у маршрута нет своих мест.
    const overridePts = routeOverride?.points;
    if (
      Array.isArray(overridePts) &&
      overridePts.length &&
      pointsWithCoords.length === 0 &&
      typeof window.ymaps.geocode === 'function'
    ) {
      overridePts.forEach((pt, index) => {
        const preset =
          index === 0
            ? 'islands#greenDotIconWithCaption'
            : index === overridePts.length - 1
              ? 'islands#redDotIconWithCaption'
              : 'islands#blueDotIconWithCaption';
        window.ymaps
          .geocode(pt, { results: 1 })
          .then((res) => {
            if (!mapRef.current) return;
            const obj = res.geoObjects.get(0);
            const name =
              (obj && (obj.properties.get('name') || obj.getAddressLine?.())) || `Точка ${index + 1}`;
            const pm = new window.ymaps.Placemark(pt, { iconCaption: name, hintContent: name }, { preset });
            mapRef.current.geoObjects.add(pm);
            geocodedMarkersRef.current.push(pm);
          })
          .catch(() => {});
      });
    }

    placemarksRef.current = placemarks;

    return () => {
      placemarks.forEach((pm) => map.geoObjects.remove(pm));
      geocodedMarkersRef.current.forEach((pm) => {
        try { map.geoObjects.remove(pm); } catch { /* карта могла быть уже уничтожена */ }
      });
      geocodedMarkersRef.current = [];
      placemarksRef.current = [];
      if (routeRef.current && mapRef.current) {
        mapRef.current.geoObjects.remove(routeRef.current);
        routeRef.current = null;
      }
      if (routeFromMeRef.current && mapRef.current) {
        mapRef.current.geoObjects.remove(routeFromMeRef.current);
        routeFromMeRef.current = null;
      }
      if (mapRef.current && mapRef.current.destroy) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [scriptReady, showRouteFromMe, JSON.stringify(coordsOrdered.map((c) => c.join(','))), JSON.stringify(routePoints), routingMode]);

  const handleBuildRoute = () => {
    if (!scriptReady || !window.ymaps || !mapRef.current || coordsOrdered.length === 0) return;
    setRouteStatus('loading');
    if (!navigator.geolocation) {
      setRouteStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const fromLat = position.coords.latitude;
        const fromLon = position.coords.longitude;
        userCoordsRef.current = { lat: fromLat, lon: fromLon };
        const referencePoints = [[fromLat, fromLon], coordsOrdered[0]];
        const requireModules = window.ymaps.modules?.require;
        if (typeof requireModules === 'function') {
          requireModules(['multiRouter.MultiRoute'], (MultiRoute) => {
            if (!mapRef.current) return;
            if (routeFromMeRef.current) {
              mapRef.current.geoObjects.remove(routeFromMeRef.current);
              routeFromMeRef.current = null;
            }
            const multiRoute = new MultiRoute(
              { referencePoints, params: { routingMode: 'auto' } },
              {
                boundsAutoApply: true,
                routeActiveStrokeColor: '#0066cc',
                routeActiveStrokeWidth: 5,
                routeStrokeColor: '#0066cc66',
                routeStrokeWidth: 4,
              }
            );
            mapRef.current.geoObjects.add(multiRoute);
            routeFromMeRef.current = multiRoute;
            setRouteBuiltFromMe(true);
            setRouteStatus('ready');
          });
        } else {
          setRouteBuiltFromMe(true);
          setRouteStatus('ready');
        }
      },
      () => setRouteStatus('denied')
    );
  };

  const handleOpenYandexMaps = () => {
    const user = userCoordsRef.current;
    const points = user
      ? [[user.lat, user.lon], ...coordsOrdered]
      : coordsOrdered;
    window.open(openUrl || buildYandexRouteUrlMulti(points), '_blank', 'noopener,noreferrer');
  };

  if (error) {
    return (
      <div
        className={className}
        style={{
          height,
          background: '#f1f5f9',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
        }}
      >
        {error}. Укажите VITE_YANDEX_MAPS_API_KEY.
      </div>
    );
  }

  if (!scriptReady) {
    return (
      <div
        className={className}
        style={{
          height,
          background: '#f1f5f9',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
        }}
      >
        Загрузка карты...
      </div>
    );
  }

  if (places.length === 0 && !hasOverrideRoute) {
    return (
      <div
        className={className}
        style={{
          height,
          background: '#f8fafc',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '0.9375rem',
        }}
      >
        Добавьте места на маршрут — карта покажет точки и маршрут между ними.
      </div>
    );
  }

  if (pointsWithCoords.length === 0 && !hasOverrideRoute) {
    return (
      <div
        className={className}
        style={{
          height,
          background: '#f8fafc',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '0.9375rem',
        }}
      >
        У выбранных мест нет координат. Укажите широту и долготу в карточках мест.
      </div>
    );
  }

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

  if (!showRouteFromMe) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{ width: '100%', height, borderRadius: 8, overflow: 'hidden' }}
      />
    );
  }

  return (
    <div className={className}>
      <div ref={mapWrapperRef} style={{ position: 'relative', width: '100%', height, borderRadius: 8, overflow: 'hidden' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        <div style={overlayStyle}>
          <button
            type="button"
            onClick={handleBuildRoute}
            disabled={routeStatus === 'loading'}
            title={routeStatus === 'loading' ? 'Определяем местоположение...' : 'Построить маршрут от моего местоположения'}
            style={{
              ...iconBtnStyle,
              cursor: routeStatus === 'loading' ? 'wait' : 'pointer',
              opacity: routeStatus === 'loading' ? 0.7 : 1,
            }}
          >
            <Route size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={handleOpenYandexMaps}
            title="Открыть в Яндекс.Картах"
            style={iconBtnStyle}
          >
            <ExternalLink size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
      {routeStatus === 'denied' && (
        <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#dc2626' }}>
          Доступ к геолокации запрещён. Разрешите доступ или откройте карту в приложении Яндекс.
        </p>
      )}
    </div>
  );
}
