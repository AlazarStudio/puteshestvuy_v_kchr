'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Search, MapPin, Map, Newspaper, Building2, Loader2 } from 'lucide-react'
import { publicPlacesAPI, publicRoutesAPI, publicNewsAPI, publicServicesAPI, getImageUrl } from '@/lib/api'
import { searchInObject, calculateSimilarity } from '@/lib/searchUtils'
import styles from './GlobalSearch.module.css'

const ENTITY_TYPES = {
  place: { label: 'Место', icon: MapPin, color: '#10b981', path: (slug) => `/places/${slug}` },
  route: { label: 'Маршрут', icon: Map, color: '#3b82f6', path: (slug) => `/routes/${slug}` },
  news: { label: 'Новость', icon: Newspaper, color: '#f59e0b', path: (slug) => `/news/${slug}` },
  service: { label: 'Услуга', icon: Building2, color: '#8b5cf6', path: (slug) => `/services/${slug}` },
}

async function performApiSearch(query) {
  if (!query || query.trim().length === 0) return []

  const search = query.trim()

  const [placesRes, routesRes, newsRes, servicesRes] = await Promise.all([
    publicPlacesAPI.getAll({ search, limit: 50 }).catch(() => ({ data: { items: [] } })),
    publicRoutesAPI.getAll({ search, limit: 50 }).catch(() => ({ data: { items: [] } })),
    publicNewsAPI.getAll({ search, limit: 50 }).catch(() => ({ data: { items: [] } })),
    publicServicesAPI.getAll({ search, limit: 50 }).catch(() => ({ data: { items: [] } })),
  ])

  const allResults = []

  ;(placesRes.data?.items || []).forEach(item => {
    allResults.push({
      type: 'place',
      id: item.id || item._id,
      slug: item.slug,
      title: item.title || item.name,
      description: item.description || item.shortDescription || '',
      image: item.image,
    })
  })

  ;(routesRes.data?.items || []).forEach(item => {
    const routeImage = (item.images && item.images.length > 0) ? item.images[0] : item.image
    allResults.push({
      type: 'route',
      id: item.id || item._id,
      slug: item.slug,
      title: item.title || item.name,
      description: item.description || item.shortDescription || '',
      image: routeImage,
    })
  })

  ;(newsRes.data?.items || []).forEach(item => {
    allResults.push({
      type: 'news',
      id: item.id || item._id,
      slug: item.slug,
      title: item.title,
      description: item.description || item.shortDescription || '',
      image: item.image,
    })
  })

  ;(servicesRes.data?.items || []).forEach(item => {
    allResults.push({
      type: 'service',
      id: item.id || item._id,
      slug: item.slug,
      title: item.title || item.name,
      description: item.description || item.shortDescription || '',
      image: item.image,
    })
  })

  return allResults
}

function collectAllTitles(allData) {
  if (!allData) return []

  const titles = []
  const typeMap = { places: 'place', routes: 'route', news: 'news', services: 'service' }

  for (const [key, type] of Object.entries(typeMap)) {
    ;(allData[key] || []).forEach(item => {
      const title = item.title || item.name
      if (title) {
        titles.push({ title, type, slug: item.slug, id: item.id || item._id })
      }
    })
  }

  return titles
}

function findBestMatch(allData, query) {
  if (!allData || !query || query.trim().length < 2) return null

  const lowerQuery = query.toLowerCase().trim()
  const allTitles = collectAllTitles(allData)

  let best = null
  let bestScore = 0

  for (const t of allTitles) {
    const score = calculateSimilarity(lowerQuery, t.title.toLowerCase())
    if (score > bestScore) {
      bestScore = score
      best = t
    }
  }

  return bestScore > 0.35 ? best : null
}

function sortResultsBySimilarity(results, query) {
  if (results.length === 0) return results

  const lowerQuery = query.toLowerCase()
  const scored = results.map(result => ({
    ...result,
    _score: calculateSimilarity(lowerQuery, (result.title || '').toLowerCase())
  }))

  scored.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score
    const typeOrder = { place: 0, route: 1, news: 2, service: 3 }
    return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99)
  })

  return scored.map(({ _score, ...rest }) => rest)
}

function mergeResults(primary, secondary) {
  if (secondary.length === 0) return primary
  if (primary.length === 0) return secondary

  const ids = new Set(primary.map(r => `${r.type}-${r.id}`))
  const extras = secondary.filter(r => !ids.has(`${r.type}-${r.id}`))
  return [...primary, ...extras]
}

function mapItemsToResults(items, type) {
  return items.map(item => ({
    type,
    id: item.id || item._id,
    slug: item.slug,
    title: item.title || item.name,
    description: item.description || item.shortDescription || '',
    image: type === 'route' && item.images?.length > 0 ? item.images[0] : item.image,
  }))
}

function searchInAllData(allData, query) {
  if (!allData || !query || query.trim().length === 0) return []

  const lowerQuery = query.toLowerCase().trim()

  return [
    ...mapItemsToResults((allData.places || []).filter(i => searchInObject(i, lowerQuery)), 'place'),
    ...mapItemsToResults((allData.routes || []).filter(i => searchInObject(i, lowerQuery)), 'route'),
    ...mapItemsToResults((allData.news || []).filter(i => searchInObject(i, lowerQuery)), 'news'),
    ...mapItemsToResults((allData.services || []).filter(i => searchInObject(i, lowerQuery)), 'service'),
  ]
}

async function performSearch(allData, query) {
  if (!query || query.trim().length === 0) {
    return { results: [], bestMatch: null }
  }

  const normalizedQuery = query.trim()

  // 1) API-поиск (бэкенд — надёжный полнотекстовый поиск)
  const apiResults = await performApiSearch(normalizedQuery)

  // 2) Проверяем, совпадает ли запрос с чем-то на клиенте (точное вхождение)
  const exactClientResults = searchInAllData(allData, normalizedQuery)
  const hasExactClientMatch = exactClientResults.length > 0

  // 3) Если точного совпадения нет — ищем ближайшее название (обработка опечаток)
  let bestMatch = null
  let suggestionResults = []

  if (!hasExactClientMatch && allData) {
    bestMatch = findBestMatch(allData, normalizedQuery)

    if (bestMatch && apiResults.length === 0) {
      suggestionResults = searchInAllData(allData, bestMatch.title)
    }
  }

  // 4) Объединяем результаты
  let results = mergeResults(apiResults, suggestionResults)

  // 5) Если ни API, ни suggestions не дали результатов — fallback с клиентскими данными
  if (results.length === 0 && exactClientResults.length > 0) {
    results = exactClientResults
  }

  results = sortResultsBySimilarity(results, normalizedQuery)

  return { results, bestMatch: hasExactClientMatch ? null : bestMatch }
}

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [bestMatch, setBestMatch] = useState(null)
  const [filterType, setFilterType] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [allData, setAllData] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const searchIdRef = useRef(0)
  const navigate = useNavigate()

  const filteredResults = filterType
    ? results.filter(r => r.type === filterType)
    : results

  const availableTypes = [...new Set(results.map(r => r.type))]

  const loadAllData = useCallback(async () => {
    setDataLoading(true)
    try {
      const [placesRes, routesRes, newsRes, servicesRes] = await Promise.all([
        publicPlacesAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
        publicRoutesAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
        publicNewsAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
        publicServicesAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
      ])
      setAllData({
        places: placesRes.data?.items || [],
        routes: routesRes.data?.items || [],
        news: newsRes.data?.items || [],
        services: servicesRes.data?.items || [],
      })
    } catch {
      setAllData({ places: [], routes: [], news: [], services: [] })
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadAllData()
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults([])
      setBestMatch(null)
      setFilterType(null)
      setAllData(null)
    }
  }, [isOpen, loadAllData])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!isOpen) return

    if (!query.trim()) {
      setResults([])
      setBestMatch(null)
      return
    }

    setIsLoading(true)
    const currentId = ++searchIdRef.current

    debounceRef.current = setTimeout(async () => {
      if (currentId !== searchIdRef.current) return

      const { results: searchResults, bestMatch: match } = await performSearch(allData, query)

      if (currentId !== searchIdRef.current) return

      setResults(searchResults)
      setBestMatch(match)
      setIsLoading(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, isOpen, allData])
  
  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])
  
  const handleResultClick = (result) => {
    const entityConfig = ENTITY_TYPES[result.type]
    const path = entityConfig.path(result.slug || result.id)
    navigate(path)
    onClose()
  }
  
  if (!isOpen) return null
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.searchInputWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Поиск по сайту..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {(isLoading || dataLoading) && <Loader2 className={styles.loaderIcon} size={20} />}
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            <X size={24} />
          </button>
        </div>
        
        <div className={styles.content}>
          {query.trim() && (
            <>
              {(isLoading || dataLoading) ? (
                <div className={styles.loading}>
                  <Loader2 className={styles.loaderIcon} size={32} />
                  <p>Поиск...</p>
                </div>
              ) : results.length > 0 ? (
                <>
                  {bestMatch && (
                    <div className={styles.fallback}>
                      <div className={styles.fallbackRow}>
                        <span className={styles.fallbackText}>
                          Возможно вы искали:{' '}
                        </span>
                        <button
                          type="button"
                          className={styles.fallbackButton}
                          onClick={() => setQuery(bestMatch.title)}
                        >
                          <strong>{bestMatch.title}</strong>
                        </button>
                      </div>
                    </div>
                  )}
                  {availableTypes.length > 1 && (
                    <div className={styles.filterTags}>
                      <button
                        type="button"
                        className={`${styles.filterTag} ${!filterType ? styles.filterTagActive : ''}`}
                        onClick={() => setFilterType(null)}
                      >
                        Все
                      </button>
                      {availableTypes.map((type) => {
                        const cfg = ENTITY_TYPES[type]
                        const Icon = cfg?.icon
                        const count = results.filter(r => r.type === type).length
                        return (
                          <button
                            key={type}
                            type="button"
                            className={`${styles.filterTag} ${filterType === type ? styles.filterTagActive : ''}`}
                            onClick={() => setFilterType(type)}
                          >
                            {Icon && <Icon size={14} />}
                            <span>{cfg?.label || type}</span>
                            <span className={styles.filterTagCount}>{count}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {filteredResults.length === 0 && filterType ? (
                    <div className={styles.emptyFiltered}>
                      <p>По фильтру «{ENTITY_TYPES[filterType]?.label}» ничего не найдено.</p>
                      <button type="button" className={styles.filterResetBtn} onClick={() => setFilterType(null)}>
                        Сбросить фильтр
                      </button>
                    </div>
                  ) : (
                  <div className={styles.results}>
                    {filteredResults.map((result) => {
                      const entityConfig = ENTITY_TYPES[result.type]
                      const Icon = entityConfig.icon
                      
                      return (
                        <div
                          key={`${result.type}-${result.id}`}
                          className={styles.resultItem}
                          onClick={() => handleResultClick(result)}
                        >
                          <div className={styles.resultIcon} style={{ backgroundColor: `${entityConfig.color}15` }}>
                            <Icon size={20} style={{ color: entityConfig.color }} />
                          </div>
                          <div className={styles.resultContent}>
                            <h3 className={styles.resultTitle}>{result.title}</h3>
                            <button
                              type="button"
                              className={styles.resultTypeTag}
                              style={{ color: entityConfig.color }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setFilterType(filterType === result.type ? null : result.type)
                              }}
                            >
                              {entityConfig.label}
                            </button>
                            {result.description && (
                              <p className={styles.resultDescription}>
                                {(() => {
                                  const text = (result.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                                  return text.length > 150 ? `${text.substring(0, 150)}...` : text
                                })()}
                              </p>
                            )}
                          </div>
                          {result.image && (
                            <div className={styles.resultImage}>
                              <img src={getImageUrl(result.image)} alt={result.title} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  )}
                </>
              ) : (
                <div className={styles.empty}>
                  <p className={styles.emptyText}>
                    По запросу <strong>"{query}"</strong> ничего не найдено
                  </p>
                  {bestMatch && (
                    <div className={styles.fallbackRow}>
                      <span className={styles.fallbackText}>
                        Возможно вы искали:{' '}
                      </span>
                      <button
                        type="button"
                        className={styles.fallbackButton}
                        onClick={() => setQuery(bestMatch.title)}
                      >
                        <strong>{bestMatch.title}</strong>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          {!query.trim() && (
            <div className={styles.empty}>
              <Search className={styles.emptyIcon} size={48} />
              <p className={styles.emptyText}>Введите запрос для поиска</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
