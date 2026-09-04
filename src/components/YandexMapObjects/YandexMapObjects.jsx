import { useEffect, useRef, useState } from 'react'
import styles from './YandexMapObjects.module.css'

const SCRIPT_ID = 'yandex-maps-script-2-1'
const DEFAULT_CENTER = [43.7, 41.7]
const DEFAULT_ZOOM = 8

/**
 * Карта объектов платформы: много точек, кластеризация, фильтрация без перезапроса.
 * @param {Array} objects — [{ id, coords: [lat, lng], iconHref, payload }],
 *                где payload несёт поля объекта плюс layer и familyKey
 * @param {Set} visibleKeys — ключи вида `слой:семейство`, которые сейчас показываются
 * @param {function} onSelect — клик по метке, получает payload точки
 */
export default function YandexMapObjects({ objects = [], visibleKeys, onSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const managerRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  const [scriptReady, setScriptReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  // Загрузка API — копия блока из YandexMapRoute.jsx:56-98.
  // SCRIPT_ID тот же: он не даёт загрузить API Яндекса второй раз,
  // если на странице окажется другая карта.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || ''

    // Через ready, а не сразу: сам ymaps.ready появляется в момент выполнения
    // загрузчика, то есть раньше, чем догрузятся модули, и ymaps.Map в этот
    // момент ещё не определён. Повторный вызов ready безопасен — если API уже
    // готово, колбэк выполнится немедленно
    if (window.ymaps && window.ymaps.ready) {
      window.ymaps.ready(() => setScriptReady(true))
      return
    }

    if (document.getElementById(SCRIPT_ID)) {
      const check = setInterval(() => {
        if (window.ymaps && window.ymaps.ready) {
          clearInterval(check)
          window.ymaps.ready(() => setScriptReady(true))
        }
      }, 100)
      return () => clearInterval(check)
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`
    script.async = true
    script.onload = () => { window.ymaps.ready(() => setScriptReady(true)) }
    script.onerror = () => setError('Не удалось загрузить Яндекс.Карты')
    document.head.appendChild(script)
  }, [])

  // Создание карты и менеджера объектов
  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.ymaps) return

    const map = new window.ymaps.Map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      controls: ['zoomControl', 'typeSelector', 'fullscreenControl', 'geolocationControl'],
    })
    mapRef.current = map

    // Карта занимает весь экран под шапкой, и вне неё курсору оказаться негде:
    // с зумом колесом страницу было бы нечем прокрутить до подвала.
    // Зум остаётся кнопками zoomControl, двойным кликом и щипком
    map.behaviors.disable('scrollZoom')

    const manager = new window.ymaps.ObjectManager({
      clusterize: true,
      gridSize: 64,
      clusterDisableClickZoom: false,
    })
    manager.clusters.options.set({
      preset: 'islands#greenClusterIcons',
    })
    managerRef.current = manager
    map.geoObjects.add(manager)

    const selectByEvent = (e) => {
      const id = e.get('objectId')
      const obj = manager.objects.getById(id)
      if (obj?.properties?.payload) onSelectRef.current?.(obj.properties.payload)
    }
    manager.objects.events.add('click', selectByEvent)

    // На десктопе попап открывается уже по наведению: он стоит в углу карты,
    // а не у метки, поэтому курсору не нужно «догонять» его. На тач-устройствах
    // mouseenter не приходит, там остаётся клик
    if (window.matchMedia('(hover: hover)').matches) {
      manager.objects.events.add('mouseenter', selectByEvent)
    }

    return () => {
      map.destroy()
      mapRef.current = null
      managerRef.current = null
    }
  }, [scriptReady])

  // Наполнение точками и подгонка границ.
  // scriptReady в зависимостях обязателен: точки приходят пропом ещё до того,
  // как появится менеджер, и без него эффект больше не повторится
  useEffect(() => {
    const manager = managerRef.current
    const map = mapRef.current
    if (!manager || !map || objects.length === 0) return

    manager.removeAll()
    manager.add({
      type: 'FeatureCollection',
      features: objects.map((o) => ({
        type: 'Feature',
        id: o.id,
        geometry: { type: 'Point', coordinates: o.coords },
        properties: { payload: o.payload },
        options: {
          iconLayout: 'default#image',
          iconImageHref: o.iconHref,
          iconImageSize: [42, 52],
          iconImageOffset: [-21, -52],
        },
      })),
    })

    // Границы считаются по самим точкам: карта открывается на КЧР
    // без зашитых в код координат региона
    const bounds = manager.getBounds()
    if (bounds) map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 })
  }, [objects, scriptReady])

  // Фильтрация без перезапроса
  useEffect(() => {
    const manager = managerRef.current
    if (!manager || !visibleKeys) return
    manager.setFilter((feature) => {
      const { layer, familyKey } = feature.properties.payload
      return visibleKeys.has(`${layer}:${familyKey}`)
    })
  }, [visibleKeys, objects, scriptReady])

  if (error) {
    return <div className={styles.error}>{error}</div>
  }

  return <div ref={containerRef} className={styles.map} />
}
