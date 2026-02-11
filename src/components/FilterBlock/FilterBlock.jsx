'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateSimilarity } from '@/lib/searchUtils'
import styles from './FilterBlock.module.css'

/**
 * Универсальный блок фильтров.
 * filterGroups — массив групп с API страницы: { key, label, options }.
 * Если групп нет — рендерим только поиск (если передан onSearchChange).
 * Блок не отображается только когда нет ни поиска, ни фильтров.
 */
export default function FilterBlock({
  filterGroups = [],
  filters = {},
  onFiltersChange,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Введите запрос',
  suggestionsData = [], // Массив элементов для поиска подсказок
  getSuggestionTitle = (item) => item.title || item.name, // Функция для получения названия
  maxSuggestions = 5, // Максимальное количество подсказок
  initialOpenKeys = {}, // Начальное состояние открытых блоков
}) {
  const groupsWithOptions = filterGroups.filter(
    (g) => Array.isArray(g.options) && g.options.length > 0
  )
  const groupsWithInputOnly = filterGroups.filter(
    (g) => !Array.isArray(g.options) || g.options.length === 0
  )
  const hasSearch = typeof onSearchChange === 'function'
  const hasFilters = groupsWithOptions.length > 0 || groupsWithInputOnly.length > 0

  const [openKeys, setOpenKeys] = useState(initialOpenKeys)
  
  // Автоматически открываем блоки с активными фильтрами
  useEffect(() => {
    const keysToOpen = {}
    filterGroups.forEach((group) => {
      const hasActiveFilter = filters[group.key] && filters[group.key].length > 0
      if (hasActiveFilter) {
        keysToOpen[group.key] = true
      }
    })
    if (Object.keys(keysToOpen).length > 0) {
      setOpenKeys((prev) => ({ ...prev, ...keysToOpen }))
    }
  }, [filters, filterGroups])
  const [isSearchOpen, setIsSearchOpen] = useState(true)
  const [similarTitles, setSimilarTitles] = useState([])
  const [bestMatch, setBestMatch] = useState(null)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const searchInputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const debounceTimerRef = useRef(null)

  const isGroupOpen = (key, index) => openKeys[key] ?? index === 0

  const toggleGroup = (key, index) => {
    setOpenKeys((prev) => ({ ...prev, [key]: !(prev[key] ?? index === 0) }))
  }

  const toggle = (field, value) => {
    const arr = filters[field] || []
    const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
    onFiltersChange?.({ ...filters, [field]: next })
  }

  const setInputFilter = (field, value) => {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    onFiltersChange?.({ ...filters, [field]: trimmed ? [trimmed] : [] })
  }

  // Функция для поиска похожих названий (ищет в названии и кратком описании)
  const findSimilarTitles = (query, existingResults = []) => {
    if (!query || query.trim().length < 2) return []
    
    const lowerQuery = query.toLowerCase().trim()
    
    // Проверяем, есть ли точное совпадение в названии
    const exactMatch = suggestionsData.find(item => {
      const title = getSuggestionTitle(item)
      return title && title.toLowerCase().includes(lowerQuery)
    })
    
    // Если есть точное совпадение, не показываем подсказки
    if (exactMatch) {
      return []
    }
    
    // Проверяем, есть ли совпадение в местах маршрута
    const matchInPlaces = suggestionsData.find(item => {
      if (Array.isArray(item.places) && item.places.length > 0) {
        return item.places.some(place => {
          const placeTitle = place.title || place.name || ''
          return placeTitle.toLowerCase().includes(lowerQuery)
        })
      }
      return false
    })
    
    // Если найдено в местах маршрута, не показываем подсказки (фильтрация найдет)
    if (matchInPlaces) {
      return []
    }
    
    // Проверяем, есть ли совпадение в локации (для мест)
    const matchInLocation = suggestionsData.find(item => {
      const location = item.location || ''
      return location && location.toLowerCase().includes(lowerQuery)
    })
    
    // Если найдено в локации, не показываем подсказки (фильтрация найдет)
    if (matchInLocation) {
      return []
    }
    
    // Создаем Set существующих названий из результатов, чтобы исключить их
    const existingTitles = new Set(existingResults.map(r => {
      const title = getSuggestionTitle(r)
      return title ? title.toLowerCase() : ''
    }).filter(Boolean))
    
    // Собираем все названия, ищем в названии И в кратком описании И в местах маршрута
    const allTitles = suggestionsData
      .map(item => {
        const title = getSuggestionTitle(item)
        if (!title || existingTitles.has(title.toLowerCase())) {
          return null
        }
        
        // Ищем в названии
        const titleMatch = title.toLowerCase().includes(lowerQuery)
        const titleSimilarity = calculateSimilarity(lowerQuery, title.toLowerCase())
        
        // Ищем в кратком описании
        const shortDescription = item.shortDescription || item.description || ''
        const descriptionMatch = shortDescription.toLowerCase().includes(lowerQuery)
        
        // Ищем в локации (если это место)
        const location = item.location || ''
        const locationMatch = location && location.toLowerCase().includes(lowerQuery)
        const locationSimilarity = locationMatch ? calculateSimilarity(lowerQuery, location.toLowerCase()) : 0
        
        // Ищем в местах маршрута (если это маршрут)
        let placeMatch = false
        let placeSimilarity = 0
        if (Array.isArray(item.places) && item.places.length > 0) {
          placeMatch = item.places.some(place => {
            const placeTitle = place.title || place.name || ''
            const placeTitleLower = placeTitle.toLowerCase()
            if (placeTitleLower.includes(lowerQuery)) {
              placeSimilarity = Math.max(placeSimilarity, calculateSimilarity(lowerQuery, placeTitleLower))
              return true
            }
            return false
          })
        }
        
        // Если найдено в названии, описании, локации или местах
        if (titleMatch || descriptionMatch || locationMatch || placeMatch) {
          // Приоритет: название > локация/места > описание
          let similarity = 0
          if (titleMatch) {
            similarity = titleSimilarity
          } else if (locationMatch) {
            similarity = locationSimilarity * 0.7 // Локация имеет меньший приоритет чем название
          } else if (placeMatch) {
            similarity = placeSimilarity * 0.7 // Места имеют меньший приоритет чем название
          } else if (descriptionMatch) {
            similarity = 0.3 // Описание имеет наименьший приоритет
          }
          
          return {
            ...item,
            title,
            similarity
          }
        }
        
        // Если не найдено точно, проверяем похожесть названия
        if (titleSimilarity > 0.15) {
          return {
            ...item,
            title,
            similarity: titleSimilarity
          }
        }
        
        return null
      })
      .filter(item => item !== null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 1) // Только один лучший результат
    
    return allTitles.map(item => ({
      title: item.title,
      ...item
    }))
  }

  // Поиск подсказок при изменении searchQuery (как в GlobalSearch)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!searchQuery || !searchQuery.trim()) {
      setSimilarTitles([])
      setBestMatch(null)
      setIsLoadingSuggestions(false)
      return
    }

    if (suggestionsData.length === 0) {
      console.log('FilterBlock: suggestionsData is empty!')
      setSimilarTitles([])
      setBestMatch(null)
      setIsLoadingSuggestions(false)
      return
    }

    const query = searchQuery.trim()
    if (query.length < 2) {
      setSimilarTitles([])
      setBestMatch(null)
      setIsLoadingSuggestions(false)
      return
    }

    setIsLoadingSuggestions(true)
    const timer = setTimeout(() => {
      // Ищем похожие названия
      const similar = findSimilarTitles(query, [])
      
      if (similar.length > 0) {
        setBestMatch(similar[0])
        setSimilarTitles([]) // Не используем больше
      } else {
        setBestMatch(null)
        setSimilarTitles([])
      }
      setIsLoadingSuggestions(false)
    }, 300)

    debounceTimerRef.current = timer

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [searchQuery, suggestionsData, getSuggestionTitle, maxSuggestions])

  // Закрытие подсказок при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        // Не закрываем подсказки при клике вне - они должны оставаться видимыми
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSuggestionClick = (suggestion) => {
    const title = suggestion.title || getSuggestionTitle(suggestion)
    onSearchChange?.(title)
    searchInputRef.current?.focus()
  }

  // Не рендерить только когда нет ни поиска, ни групп фильтров
  if (!hasSearch && !hasFilters) return null

  return (
    <div className={styles.filter}>
      {hasSearch && (
        <div className={styles.filterBlock}>
          <div className={styles.headerRow} onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <div className={styles.title}>Поиск</div>
            <motion.svg
              className={styles.arrow}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ rotate: isSearchOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </div>
          <div className={styles.searchWrapper} ref={suggestionsRef}>
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className={styles.search}>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                      onFocus={() => {}}
                    />
                    <img src="/search_gray.png" alt="" className={styles.searchIcon} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {isSearchOpen && searchQuery && searchQuery.trim().length >= 2 && bestMatch && (
              <div className={styles.suggestionsInline}>
                <div className={styles.fallbackInline}>
                  <span className={styles.fallbackTextInline}>
                    Возможно вы искали:{' '}
                  </span>
                  <button
                    type="button"
                    className={styles.fallbackButtonInline}
                    onClick={() => handleSuggestionClick(bestMatch)}
                  >
                    <strong>{bestMatch.title}</strong>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {groupsWithOptions.map((group, index) => (
        <div key={group.key} className={styles.filterBlock}>
          <div
            className={styles.headerRow}
            onClick={() => toggleGroup(group.key, index)}
          >
            <div className={styles.title}>{group.label}</div>
            <motion.svg
              className={styles.arrow}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ rotate: isGroupOpen(group.key, index) ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </div>
          <AnimatePresence>
            {isGroupOpen(group.key, index) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div className={styles.checkBlock}>
                  {group.options.map((v) => (
                    <label key={v} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={(filters[group.key] || []).includes(v)}
                        onChange={() => toggle(group.key, v)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>{v}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {groupsWithInputOnly.map((group, index) => (
        <div key={group.key} className={styles.filterBlock}>
          <div
            className={styles.headerRow}
            onClick={() => toggleGroup(group.key, groupsWithOptions.length + index)}
          >
            <div className={styles.title}>{group.label}</div>
            <motion.svg
              className={styles.arrow}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{
                rotate: isGroupOpen(group.key, groupsWithOptions.length + index) ? 180 : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </div>
          <AnimatePresence>
            {isGroupOpen(group.key, groupsWithOptions.length + index) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div className={styles.filterInput}>
                  <input
                    type="text"
                    placeholder={`Введите значение для «${group.label}»`}
                    value={(filters[group.key] && filters[group.key][0]) || ''}
                    onChange={(e) => setInputFilter(group.key, e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
