'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_CENTER = [43.5, 41.7];
const DEFAULT_ZOOM = 10;
const SCRIPT_ID = 'yandex-maps-script-2-1';
const MAP_HEIGHT = 400;

/**
 * Карта маршрута: точки мест в порядке следования и маршрут между ними.
 * places — массив { id, title, latitude, longitude } в порядке маршрута.
 */
export default function YandexMapRoute({ places = [], height = MAP_HEIGHT, className }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const placemarksRef = useRef([]);
  const routeRef = useRef(null); // MultiRoute или Polyline
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState(null);

  const pointsWithCoords = places.filter(
    (p) =>
      p &&
      p.latitude != null &&
      p.longitude != null &&
      Number(p.latitude) &&
      Number(p.longitude)
  );
  const coordsOrdered = pointsWithCoords.map((p) => [Number(p.latitude), Number(p.longitude)]);

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
      center: coordsOrdered.length ? coordsOrdered[0] : DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      controls: ['zoomControl', 'typeSelector', 'fullscreenControl'],
    });
    mapRef.current = map;

    const placemarks = [];

    if (pointsWithCoords.length > 0) {
      pointsWithCoords.forEach((place, index) => {
        const coords = [Number(place.latitude), Number(place.longitude)];
        const label = String(index + 1);
        const placemark = new window.ymaps.Placemark(
          coords,
          {
            balloonContent: `<strong>${index + 1}. ${place.title || 'Точка'}</strong>`,
            iconContent: label,
          },
          {
            preset: 'islands#blueCircleIcon',
            iconContentLayout: window.ymaps.templateLayoutFactory.createClass(
              '<div style="color:#fff;font-weight:bold;font-size:14px;line-height:1;margin-top:4px;">$[properties.iconContent]</div>'
            ),
          }
        );
        map.geoObjects.add(placemark);
        placemarks.push(placemark);
      });

      if (coordsOrdered.length >= 2) {
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
                referencePoints: coordsOrdered,
                params: { routingMode: 'auto' },
              },
              {
                boundsAutoApply: true,
                routeActiveStrokeColor: '#00BF00',
                routeActiveStrokeWidth: 5,
                routeStrokeColor: '#80BF8066',
                routeStrokeWidth: 4,
              }
            );
            mapRef.current.geoObjects.add(multiRoute);
            routeRef.current = multiRoute;
          });
        } else {
          const polyline = new window.ymaps.Polyline(coordsOrdered, {}, {
            strokeColor: '#00BF00',
            strokeWidth: 4,
            strokeOpacity: 0.8,
          });
          map.geoObjects.add(polyline);
          routeRef.current = polyline;
          map.setBounds(window.ymaps.util.bounds.fromPoints(coordsOrdered), {
            checkZoomRange: true,
            zoomMargin: 50,
          });
        }
      }

      if (coordsOrdered.length === 1) {
        map.setCenter(coordsOrdered[0], 14);
      } else if (coordsOrdered.length >= 2 && typeof window.ymaps.modules?.require !== 'function') {
        map.setBounds(window.ymaps.util.bounds.fromPoints(coordsOrdered), {
          checkZoomRange: true,
          zoomMargin: 50,
        });
      }
    }

    placemarksRef.current = placemarks;

    return () => {
      placemarks.forEach((pm) => map.geoObjects.remove(pm));
      placemarksRef.current = [];
      if (routeRef.current && mapRef.current) {
        mapRef.current.geoObjects.remove(routeRef.current);
        routeRef.current = null;
      }
      if (mapRef.current && mapRef.current.destroy) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [scriptReady, JSON.stringify(coordsOrdered.map((c) => c.join(',')))]);

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
        {error}. Укажите NEXT_PUBLIC_YANDEX_MAPS_API_KEY.
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

  if (places.length === 0) {
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

  if (pointsWithCoords.length === 0) {
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

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height, borderRadius: 8, overflow: 'hidden' }}
    />
  );
}
