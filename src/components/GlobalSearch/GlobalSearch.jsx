'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, Search, MapPin, Map, Newspaper, Building2, Loader2 } from 'lucide-react'
import { publicPlacesAPI, publicRoutesAPI, publicNewsAPI, publicServicesAPI, getImageUrl } from '@/lib/api'
import styles from './GlobalSearch.module.css'

const ENTITY_TYPES = {
  place: { label: 'Место', icon: MapPin, color: '#10b981', path: (slug) => `/places/${slug}` },
  route: { label: 'Маршрут', icon: Map, color: '#3b82f6', path: (slug) => `/routes/${slug}` },
  news: { label: 'Новость', icon: Newspaper, color: '#f59e0b', path: (slug) => `/news/${slug}` },
  service: { label: 'Услуга', icon: Building2, color: '#8b5cf6', path: (slug) => `/services/${slug}` },
}

// Функция для поиска текста в объекте (рекурсивно по всем полям)
const searchInObject = (obj, query, path = '') => {
  if (!obj || !query) return false
  
  const lowerQuery = query.toLowerCase()
  
  // Если это строка, проверяем совпадение
  if (typeof obj === 'string') {
    return obj.toLowerCase().includes(lowerQuery)
  }
  
  // Если это массив, проверяем каждый элемент
  if (Array.isArray(obj)) {
    return obj.some(item => searchInObject(item, query, path))
  }
  
  // Если это объект, проверяем все его свойства
  if (typeof obj === 'object') {
    return Object.entries(obj).some(([key, value]) => {
      // Пропускаем служебные поля
      if (key === 'id' || key === '_id' || key === '__v') return false
      // Пропускаем изображения и файлы (но не их URL/пути)
      if (key === 'image' || key === 'images' || key === 'file' || key === 'files') {
        // Но если это строка (URL), проверяем её
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery)
        }
        return false
      }
      
      // Для блоков контента (blocks) проверяем содержимое
      if (key === 'blocks' && Array.isArray(value)) {
        return value.some(block => {
          // Проверяем все поля блока, включая data
          if (block.data) {
            return searchInObject(block.data, query, `${path}.${key}.data`)
          }
          return searchInObject(block, query, `${path}.${key}`)
        })
      }
      
      return searchInObject(value, query, `${path}.${key}`)
    })
  }
  
  return false
}

// Функция для вычисления похожести строк (улучшенный алгоритм)
const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  // Точное совпадение
  if (s1 === s2) return 1.0
  
  // Если одна строка содержит другую
  if (s1.includes(s2) || s2.includes(s1)) {
    const ratio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)
    return 0.6 + (ratio * 0.4) // От 0.6 до 1.0
  }
  
  // Подсчитываем общие символы в начале (префикс)
  let commonStart = 0
  const minLen = Math.min(s1.length, s2.length)
  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) {
      commonStart++
    } else {
      break
    }
  }
  
  // Подсчитываем общие символы (без учета порядка)
  const s1Chars = s1.split('')
  const s2Chars = s2.split('')
  let commonChars = 0
  const s2Set = new Set(s2Chars)
  s1Chars.forEach(char => {
    if (s2Set.has(char)) {
      commonChars++
      s2Set.delete(char) // Чтобы не считать один символ дважды
    }
  })
  
  // Вычисляем похожесть с учетом префикса и общих символов
  const maxLen = Math.max(s1.length, s2.length)
  const prefixWeight = commonStart / maxLen * 0.4
  const charsWeight = commonChars / maxLen * 0.6
  
  return prefixWeight + charsWeight
}

// Функция для поиска похожих названий
const findSimilarTitles = async (query, existingResults = [], maxResults = 5) => {
  if (!query || query.trim().length < 2) return []
  
  const lowerQuery = query.toLowerCase().trim()
  
  // Создаем Set существующих названий из результатов, чтобы исключить их
  const existingTitles = new Set(existingResults.map(r => r.title.toLowerCase()))
  
  try {
    // Получаем все сущности
    const [placesRes, routesRes, newsRes, servicesRes] = await Promise.all([
      publicPlacesAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
      publicRoutesAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
      publicNewsAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
      publicServicesAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
    ])
    
    const allTitles = []
    
    // Собираем все названия, исключая уже найденные
    ;(placesRes.data?.items || []).forEach(item => {
      const title = item.title || item.name
      if (title && !existingTitles.has(title.toLowerCase())) {
        allTitles.push({ title, type: 'place', slug: item.slug, id: item.id || item._id })
      }
    })
    
    ;(routesRes.data?.items || []).forEach(item => {
      const title = item.title || item.name
      if (title && !existingTitles.has(title.toLowerCase())) {
        allTitles.push({ title, type: 'route', slug: item.slug, id: item.id || item._id })
      }
    })
    
    ;(newsRes.data?.items || []).forEach(item => {
      if (item.title && !existingTitles.has(item.title.toLowerCase())) {
        allTitles.push({ title: item.title, type: 'news', slug: item.slug, id: item.id || item._id })
      }
    })
    
    ;(servicesRes.data?.items || []).forEach(item => {
      const title = item.title || item.name
      if (title && !existingTitles.has(title.toLowerCase())) {
        allTitles.push({ title, type: 'service', slug: item.slug, id: item.id || item._id })
      }
    })
    
    // Вычисляем похожесть для каждого названия
    const similarities = allTitles.map(item => ({
      ...item,
      similarity: calculateSimilarity(lowerQuery, item.title.toLowerCase())
    }))
    
    // Фильтруем и сортируем по похожести
    const similar = similarities
      .filter(item => item.similarity > 0.15) // Минимальный порог похожести (понижен для лучшего поиска)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults)
    
    // Выводим в консоль все похожие названия с коэффициентами
    console.log('🔍 Поиск похожих названий для запроса:', query)
    console.log('📊 Всего проверено названий:', allTitles.length)
    console.log('✅ Найдено похожих (порог > 0.15):', similar.length)
    if (similar.length > 0) {
      console.log('🏆 Топ похожих названий:')
      similar.forEach((item, index) => {
        console.log(`  ${index + 1}. "${item.title}" (${item.type}) - похожесть: ${(item.similarity * 100).toFixed(1)}%`)
      })
      console.log('⭐ Максимально похожее:', similar[0].title, `(${(similar[0].similarity * 100).toFixed(1)}%)`)
    } else {
      console.log('❌ Похожих названий не найдено')
      // Показываем топ-10 даже если они ниже порога
      const topSimilar = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10)
      console.log('📈 Топ-10 по похожести (включая ниже порога):')
      topSimilar.forEach((item, index) => {
        console.log(`  ${index + 1}. "${item.title}" (${item.type}) - похожесть: ${(item.similarity * 100).toFixed(1)}%`)
      })
    }
    
    return similar.map(item => ({
      title: item.title,
      type: item.type,
      slug: item.slug,
      id: item.id
    }))
  } catch (error) {
    console.error('Error finding similar titles:', error)
    return []
  }
}

// Функция поиска с fallback (удаление символов с конца)
const searchWithFallback = async (query) => {
  if (!query || query.trim().length === 0) {
    return { results: [], fallback: null, similarTitles: [], bestMatch: null }
  }
  
  const normalizedQuery = query.trim()
  let currentQuery = normalizedQuery
  let results = []
  let fallbackQuery = null
  
  // Пытаемся найти результаты с текущим запросом
  while (currentQuery.length > 0) {
    const searchResults = await performSearch(currentQuery)
    
    if (searchResults.length > 0) {
      results = searchResults
      // Если это не оригинальный запрос, сохраняем fallback
      if (currentQuery !== normalizedQuery) {
        fallbackQuery = currentQuery
      }
      break
    }
    
    // Удаляем последний символ и пробуем снова
    currentQuery = currentQuery.slice(0, -1)
  }
  
  // Сортируем результаты по похожести названия к оригинальному запросу
  if (results.length > 0) {
    const lowerOriginalQuery = normalizedQuery.toLowerCase()
    const resultsWithSimilarity = results.map(result => ({
      ...result,
      titleSimilarity: calculateSimilarity(lowerOriginalQuery, result.title.toLowerCase())
    }))
    
    // Сортируем: сначала по похожести названия (от большей к меньшей), затем по типу
    resultsWithSimilarity.sort((a, b) => {
      // Сначала по похожести названия
      if (b.titleSimilarity !== a.titleSimilarity) {
        return b.titleSimilarity - a.titleSimilarity
      }
      // Если похожесть одинаковая, сортируем по типу (места, маршруты, новости, услуги)
      const typeOrder = { place: 0, route: 1, news: 2, service: 3 }
      return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99)
    })
    
    // Убираем поле similarity из результатов перед возвратом
    results = resultsWithSimilarity.map(({ titleSimilarity, ...rest }) => rest)
    
    console.log('📊 Результаты отсортированы по похожести названия:')
    resultsWithSimilarity.forEach((item, index) => {
      console.log(`  ${index + 1}. "${item.title}" (${item.type}) - похожесть названия: ${(item.titleSimilarity * 100).toFixed(1)}%`)
    })
  }
  
  // Ищем похожие названия относительно запроса, по которому нашли результаты
  let similarTitles = []
  let bestMatch = null
  
  // Если есть результаты по усеченному запросу - ищем bestMatch среди них относительно оригинального запроса
  if (fallbackQuery && results.length > 0) {
    // Вычисляем похожесть каждого найденного результата к оригинальному запросу
    const resultsWithSimilarity = results.map(result => ({
      ...result,
      similarity: calculateSimilarity(normalizedQuery.toLowerCase(), result.title.toLowerCase())
    }))
    
    // Сортируем по похожести и берем самое похожее
    resultsWithSimilarity.sort((a, b) => b.similarity - a.similarity)
    
    if (resultsWithSimilarity.length > 0 && resultsWithSimilarity[0].similarity > 0.15) {
      bestMatch = {
        title: resultsWithSimilarity[0].title,
        type: resultsWithSimilarity[0].type,
        slug: resultsWithSimilarity[0].slug,
        id: resultsWithSimilarity[0].id
      }
      console.log('🎯 BestMatch из найденных результатов:', bestMatch, `похожесть: ${(resultsWithSimilarity[0].similarity * 100).toFixed(1)}%`)
    }
    
    // Также ищем дополнительные похожие названия среди всех сущностей
    similarTitles = await findSimilarTitles(normalizedQuery, results, 5)
  } else if (results.length === 0) {
    // Если нет результатов - ищем похожие названия относительно оригинального запроса
    const queryForSimilarity = normalizedQuery
    if (queryForSimilarity && queryForSimilarity.length >= 2) {
      similarTitles = await findSimilarTitles(queryForSimilarity, results, 5)
      if (similarTitles.length > 0) {
        bestMatch = similarTitles[0]
      }
    }
  }
  
  return { results, fallback: fallbackQuery, similarTitles, bestMatch }
}

// Выполнение поиска по всем сущностям
const performSearch = async (query) => {
  if (!query || query.trim().length === 0) return []
  
  const lowerQuery = query.toLowerCase().trim()
  
  try {
    // Параллельный поиск по всем сущностям
    const [placesRes, routesRes, newsRes, servicesRes] = await Promise.all([
      publicPlacesAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
      publicRoutesAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
      publicNewsAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
      publicServicesAPI.getAll({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
    ])
    
    const allResults = []
    
    // Фильтруем места
    const places = (placesRes.data?.items || []).filter(item => searchInObject(item, lowerQuery))
    places.forEach(item => {
      allResults.push({
        type: 'place',
        id: item.id || item._id,
        slug: item.slug,
        title: item.title || item.name,
        description: item.description || item.shortDescription || '',
        image: item.image,
      })
    })
    
    // Фильтруем маршруты
    const routes = (routesRes.data?.items || []).filter(item => searchInObject(item, lowerQuery))
    routes.forEach(item => {
      // Берем первую картинку из галереи, если есть, иначе основную картинку
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
    
    // Фильтруем новости
    const news = (newsRes.data?.items || []).filter(item => searchInObject(item, lowerQuery))
    news.forEach(item => {
      allResults.push({
        type: 'news',
        id: item.id || item._id,
        slug: item.slug,
        title: item.title,
        description: item.description || item.shortDescription || '',
        image: item.image,
      })
    })
    
    // Фильтруем услуги
    const services = (servicesRes.data?.items || []).filter(item => searchInObject(item, lowerQuery))
    services.forEach(item => {
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
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [fallback, setFallback] = useState(null)
  const [similarTitles, setSimilarTitles] = useState([])
  const [bestMatch, setBestMatch] = useState(null)
  const [filterType, setFilterType] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  
  const filteredResults = filterType
    ? results.filter(r => r.type === filterType)
    : results
  
  const availableTypes = [...new Set(results.map(r => r.type))]
  
  // Фокус на инпут при открытии
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])
  
  // Поиск с debounce
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setFallback(null)
      setSimilarTitles([])
      setBestMatch(null)
      setFilterType(null)
      return
    }
    
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    if (!query.trim()) {
      setResults([])
      setFallback(null)
      setSimilarTitles([])
      setBestMatch(null)
      return
    }
    
    setIsLoading(true)
    const timer = setTimeout(async () => {
      const { results: searchResults, fallback: fallbackQuery, similarTitles: similar, bestMatch: match } = await searchWithFallback(query)
      console.log('Search completed:', { 
        query, 
        resultsCount: searchResults.length, 
        fallback: fallbackQuery, 
        similarCount: similar?.length, 
        bestMatch: match 
      })
      setResults(searchResults)
      setFallback(fallbackQuery)
      setSimilarTitles(similar || [])
      setBestMatch(match)
      setIsLoading(false)
    }, 300)
    
    setDebounceTimer(timer)
    
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [query, isOpen])
  
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
            {isLoading && <Loader2 className={styles.loaderIcon} size={20} />}
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            <X size={24} />
          </button>
        </div>
        
        <div className={styles.content}>
          {query.trim() && (
            <>
              {isLoading ? (
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
                      {similarTitles.length > 1 && (
                        <div className={styles.similarTitles}>
                          <p className={styles.similarTitlesLabel}>Похожие названия:</p>
                          <div className={styles.similarTitlesList}>
                            {similarTitles.slice(1).map((item, index) => {
                              const entityConfig = ENTITY_TYPES[item.type]
                              const Icon = entityConfig?.icon
                              return (
                                <button
                                  key={`${item.type}-${item.id}-${index}`}
                                  type="button"
                                  className={styles.similarTitleItem}
                                  onClick={() => setQuery(item.title)}
                                >
                                  {Icon && <Icon size={14} style={{ color: entityConfig.color }} />}
                                  <span>{item.title}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
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
                  {similarTitles.length > 1 && (
                    <div className={styles.similarTitles}>
                      <p className={styles.similarTitlesLabel}>Похожие названия:</p>
                      <div className={styles.similarTitlesList}>
                        {similarTitles.slice(1).map((item, index) => {
                          const entityConfig = ENTITY_TYPES[item.type]
                          const Icon = entityConfig?.icon
                          return (
                            <button
                              key={`${item.type}-${item.id}-${index}`}
                              type="button"
                              className={styles.similarTitleItem}
                              onClick={() => setQuery(item.title)}
                            >
                              {Icon && <Icon size={14} style={{ color: entityConfig.color }} />}
                              <span>{item.title}</span>
                            </button>
                          )
                        })}
                      </div>
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
