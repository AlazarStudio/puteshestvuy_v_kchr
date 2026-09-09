import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import YandexMapObjects from '@/components/YandexMapObjects/YandexMapObjects'
import MapObjectPopup from '@/components/MapObjectPopup/MapObjectPopup'
import Seo from '@/components/Seo/Seo'
import { collectionPage, breadcrumbList } from '@/lib/seo/schema'
import { absoluteUrl } from '@/lib/seo/config'
import { publicMapAPI } from '@/lib/api'
import { PLACE_FAMILIES, SERVICE_FAMILIES, DEFAULT_FAMILY, placeFamily, serviceFamily } from '@/lib/mapFamilies'
import { buildMapIconHref } from '@/lib/mapPin'
import styles from './Map_page.module.css'

const LAYERS = [
  { key: 'places', label: 'Места' },
  { key: 'services', label: 'Услуги' },
]

// 52px иконки метки + 8px зазор до карточки
const ANCHOR_GAP = 60
// Отступ от краёв карты, за которые карточке нельзя вылезать
const EDGE_GAP = 8
// Курсору нужно время перейти с метки на попап, иначе он закроется по дороге
const CLOSE_DELAY = 200

/**
 * Раскладка попапа у метки: горизонтальный сдвиг, чтобы карточка не вылезала
 * за края карты, и переворот под метку, когда сверху не хватает места.
 */
function useAnchoredPopup(selected, wrapRef, popupRef) {
  const [placement, setPlacement] = useState({ shiftX: 0, below: false })

  useLayoutEffect(() => {
    const anchor = selected?.anchor
    const popup = popupRef.current
    const wrap = wrapRef.current
    if (!anchor || !popup || !wrap) return

    const { width, height } = popup.getBoundingClientRect()
    const half = width / 2
    let shiftX = 0
    if (anchor.x - half < EDGE_GAP) shiftX = EDGE_GAP - (anchor.x - half)
    else if (anchor.x + half > wrap.clientWidth - EDGE_GAP) shiftX = wrap.clientWidth - EDGE_GAP - (anchor.x + half)

    setPlacement({ shiftX, below: anchor.y - ANCHOR_GAP - height < 0 })
  }, [selected, wrapRef, popupRef])

  return placement
}

export default function Map_page() {
  const navigate = useNavigate()
  const [data, setData] = useState({ places: [], services: [] })
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [activeLayers, setActiveLayers] = useState(() => new Set(['places', 'services']))
  const [offKeys, setOffKeys] = useState(() => new Set())
  const [selected, setSelected] = useState(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const mapWrapRef = useRef(null)
  const popupRef = useRef(null)
  const closeTimerRef = useRef(null)
  const overPopupRef = useRef(false)
  const { shiftX, below } = useAnchoredPopup(selected, mapWrapRef, popupRef)

  useEffect(() => {
    let cancelled = false
    publicMapAPI
      .getObjects()
      .then(({ data }) => {
        if (!cancelled) setData({ places: data?.places || [], services: data?.services || [] })
      })
      .catch(() => { if (!cancelled) setFailed(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Точки в форме, которую понимает карта
  const objects = useMemo(() => {
    const fromPlaces = data.places.map((p) => {
      const family = placeFamily(p.objectTypes)
      return {
        id: `place-${p.id}`,
        coords: [p.latitude, p.longitude],
        iconHref: buildMapIconHref(p.mapIcon, p.mapIconType, family.icon),
        payload: { ...p, layer: 'places', familyKey: family.key },
      }
    })
    const fromServices = data.services.map((s) => {
      const family = serviceFamily(s.category)
      return {
        id: `service-${s.id}`,
        coords: [s.latitude, s.longitude],
        iconHref: buildMapIconHref(s.mapIcon, s.mapIconType, family.icon),
        payload: { ...s, layer: 'services', familyKey: family.key },
      }
    })
    return [...fromPlaces, ...fromServices]
  }, [data])

  // Счётчики по семействам — для подписей в легенде
  const counts = useMemo(() => {
    const acc = {}
    objects.forEach((o) => {
      acc[o.payload.familyKey] = (acc[o.payload.familyKey] || 0) + 1
    })
    return acc
  }, [objects])

  // Показываются семейства, которые не погашены и чей слой включён.
  // Ключ составной — `слой:семейство`: ключ default общий для обоих слоёв,
  // и без слоя в ключе такие точки не гаснут вместе со своим слоем
  const visibleKeys = useMemo(() => {
    const keys = new Set()
    const add = (family, layer) => {
      if (!activeLayers.has(layer)) return
      if (offKeys.has(family.key)) return
      keys.add(`${layer}:${family.key}`)
    }
    PLACE_FAMILIES.forEach((f) => add(f, 'places'))
    SERVICE_FAMILIES.forEach((f) => add(f, 'services'))
    // Строка легенды у семейства по умолчанию одна, ключа два — клик по строке
    // гасит дефолтные точки сразу обоих слоёв
    add(DEFAULT_FAMILY, 'places')
    add(DEFAULT_FAMILY, 'services')
    return keys
  }, [activeLayers, offKeys])

  // Число объектов, реально показанных на карте: кнопка со свёрнутой панелью
  // иначе не сообщает ничего — ни легенды, ни того, что слой выключен
  const visibleCount = useMemo(
    () => objects.filter((o) => visibleKeys.has(`${o.payload.layer}:${o.payload.familyKey}`)).length,
    [objects, visibleKeys],
  )

  // Панель лежит поверх карты, поэтому закрывается и кликом мимо, и Esc
  useEffect(() => {
    if (!isFilterOpen) return

    const onPointerDown = (e) => {
      if (filterRef.current?.contains(e.target)) return
      setIsFilterOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsFilterOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isFilterOpen])

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  const cancelClose = () => clearTimeout(closeTimerRef.current)

  const handleSelect = (payload, anchor) => {
    cancelClose()
    overPopupRef.current = false
    setSelected({ payload, anchor })
  }

  // Закрытие с задержкой: курсор идёт с метки на попап через зазор,
  // и мгновенное закрытие не дало бы до него добраться. Событие ухода
  // с метки приходит от ymaps с задержкой, уже после входа курсора в
  // попап, поэтому таймер закрытия проверяет флаг overPopupRef
  const handleHoverEnd = () => {
    cancelClose()
    closeTimerRef.current = setTimeout(() => {
      if (!overPopupRef.current) setSelected(null)
    }, CLOSE_DELAY)
  }

  const handlePopupEnter = () => {
    overPopupRef.current = true
    cancelClose()
  }

  const handlePopupLeave = () => {
    overPopupRef.current = false
    handleHoverEnd()
  }

  const handleDismiss = () => {
    cancelClose()
    overPopupRef.current = false
    setSelected(null)
  }

  const toggleLayer = (key) => {
    setActiveLayers((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleFamily = (key) => {
    setOffKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const openObject = () => {
    if (!selected) return
    const { layer, slug } = selected.payload
    navigate(layer === 'places' ? `/places/${slug}` : `/services/${slug}`)
  }

  const renderLegendItem = (family, enabled) => (
    <button
      key={family.key}
      type="button"
      className={`${styles.legendItem} ${offKeys.has(family.key) || !enabled ? styles.legendItemOff : ''}`}
      onClick={() => toggleFamily(family.key)}
      disabled={!enabled}
    >
      <img src={family.icon} alt="" />
      <span className={styles.legendLabel}>{family.label}</span>
      <span className={styles.legendCount}>{counts[family.key] || 0}</span>
    </button>
  )

  const renderLegendGroup = (families, layer) => (
    <div className={styles.legendGroup}>
      {families.map((f) => renderLegendItem(f, activeLayers.has(layer)))}
    </div>
  )

  return (
    <main className={styles.main}>
      <Seo
        title="Карта объектов"
        description="Интерактивная карта Карачаево-Черкесии: интересные места и услуги для туристов на одной карте."
        path="/map"
        jsonLd={[
          collectionPage({ name: 'Карта объектов', description: 'Интерактивная карта мест и услуг Карачаево-Черкесии.', url: absoluteUrl('/map') }),
          breadcrumbList([
            { name: 'Главная', url: absoluteUrl('/') },
            { name: 'Карта объектов', url: absoluteUrl('/map') },
          ]),
        ]}
      />

      <h1 className={styles.title}>Карта объектов</h1>

      <section className={styles.mapSection}>
        <div ref={mapWrapRef} className={styles.mapWrap}>
          {failed ? (
            <div className={styles.state}>Не удалось загрузить объекты карты</div>
          ) : loading ? (
            <div className={styles.state}>Загрузка…</div>
          ) : (
            <YandexMapObjects
              objects={objects}
              visibleKeys={visibleKeys}
              onSelect={handleSelect}
              onHoverEnd={handleHoverEnd}
              onDismiss={handleDismiss}
            />
          )}

          {selected?.anchor && (
            <div
              ref={popupRef}
              className={`${styles.popupWrap} ${below ? styles.popupWrapBelow : ''}`}
              style={{ left: selected.anchor.x, top: selected.anchor.y, '--shift-x': `${shiftX}px` }}
            >
              <MapObjectPopup
                object={selected.payload}
                entityType={selected.payload.layer === 'places' ? 'place' : 'service'}
                entityId={selected.payload.id}
                place={selected.payload}
                placement={below ? 'below' : 'above'}
                onOpen={openObject}
                onMouseEnter={handlePopupEnter}
                onMouseLeave={handlePopupLeave}
              />
            </div>
          )}
        </div>

        <div ref={filterRef}>
          <button
            type="button"
            className={styles.filterToggle}
            onClick={() => setIsFilterOpen((p) => !p)}
            aria-expanded={isFilterOpen}
          >
            Фильтры
            <span className={styles.filterToggleCount}>· {visibleCount}</span>
          </button>

          {isFilterOpen && (
            <aside className={styles.panel}>
              <div className={styles.layers}>
                {LAYERS.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    className={`${styles.layer} ${activeLayers.has(l.key) ? styles.layerOn : ''}`}
                    onClick={() => toggleLayer(l.key)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              {renderLegendGroup(PLACE_FAMILIES, 'places')}
              {renderLegendGroup(SERVICE_FAMILIES, 'services')}

              {/* Семейство по умолчанию — общее для обоих слоёв, поэтому стоит
                  отдельной строкой: без неё сумма счётчиков легенды не сходится
                  с числом объектов в ответе API */}
              <div className={styles.legendGroup}>
                {renderLegendItem(DEFAULT_FAMILY, activeLayers.size > 0)}
              </div>
            </aside>
          )}
        </div>
      </section>
    </main>
  )
}
