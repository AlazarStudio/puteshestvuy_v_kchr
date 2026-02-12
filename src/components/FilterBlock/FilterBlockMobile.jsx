'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateSimilarity } from '@/lib/searchUtils'
import styles from './FilterBlockMobile.module.css'

/**
 * Мобильная версия блока фильтров.
 * Отображается как кнопка, открывающая модальное окно с фильтрами.
 */
export default function FilterBlockMobile({
  filterGroups = [],
  filters = {},
  onFiltersChange,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Введите запрос',
  suggestionsData = [],
  getSuggestionTitle = (item) => item.title || item.name,
  maxSuggestions = 5,
  initialOpenKeys = {},
}) {
  const groupsWithOptions = filterGroups.filter(
    (g) => Array.isArray(g.options) && g.options.length > 0
  )
  const groupsWithInputOnly = filterGroups.filter(
    (g) => !Array.isArray(g.options) || g.options.length === 0
  )
  const hasSearch = typeof onSearchChange === 'function'
  const hasFilters = groupsWithOptions.length > 0 || groupsWithInputOnly.length > 0

  const [isOpen, setIsOpen] = useState(false)
  const [openKeys, setOpenKeys] = useState(initialOpenKeys)
  const [isSearchOpen, setIsSearchOpen] = useState(true)
  const [similarTitles, setSimilarTitles] = useState([])
  const [bestMatch, setBestMatch] = useState(null)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const searchInputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const debounceTimerRef = useRef(null)
  const modalRef = useRef(null)

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

  // Подсчет активных фильтров для отображения на кнопке
  const activeFiltersCount = Object.values(filters).reduce((count, arr) => {
    return count + (Array.isArray(arr) ? arr.filter(Boolean).length : 0)
  }, 0)

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

  // Функция для поиска похожих названий
  const findSimilarTitles = (query, existingResults = []) => {
    if (!query || query.trim().length < 2) return []
    
    const lowerQuery = query.toLowerCase().trim()
    
    const exactMatch = suggestionsData.find(item => {
      const title = getSuggestionTitle(item)
      return title && title.toLowerCase().includes(lowerQuery)
    })
    
    if (exactMatch) {
      return []
    }
    
    const matchInPlaces = suggestionsData.find(item => {
      if (Array.isArray(item.places) && item.places.length > 0) {
        return item.places.some(place => {
          const placeTitle = place.title || place.name || ''
          return placeTitle.toLowerCase().includes(lowerQuery)
        })
      }
      return false
    })
    
    if (matchInPlaces) {
      return []
    }
    
    const matchInLocation = suggestionsData.find(item => {
      const location = item.location || ''
      return location && location.toLowerCase().includes(lowerQuery)
    })
    
    if (matchInLocation) {
      return []
    }
    
    const existingTitles = new Set(existingResults.map(r => {
      const title = getSuggestionTitle(r)
      return title ? title.toLowerCase() : ''
    }).filter(Boolean))
    
    const allTitles = suggestionsData
      .map(item => {
        const title = getSuggestionTitle(item)
        if (!title || existingTitles.has(title.toLowerCase())) {
          return null
        }
        
        const titleMatch = title.toLowerCase().includes(lowerQuery)
        const titleSimilarity = calculateSimilarity(lowerQuery, title.toLowerCase())
        
        const shortDescription = item.shortDescription || item.description || ''
        const descriptionMatch = shortDescription.toLowerCase().includes(lowerQuery)
        
        const location = item.location || ''
        const locationMatch = location && location.toLowerCase().includes(lowerQuery)
        const locationSimilarity = locationMatch ? calculateSimilarity(lowerQuery, location.toLowerCase()) : 0
        
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
        
        if (titleMatch || descriptionMatch || locationMatch || placeMatch) {
          let similarity = 0
          if (titleMatch) {
            similarity = titleSimilarity
          } else if (locationMatch) {
            similarity = locationSimilarity * 0.7
          } else if (placeMatch) {
            similarity = placeSimilarity * 0.7
          } else if (descriptionMatch) {
            similarity = 0.3
          }
          
          return {
            ...item,
            title,
            similarity
          }
        }
        
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
      .slice(0, 1)
    
    return allTitles.map(item => ({
      title: item.title,
      ...item
    }))
  }

  // Поиск подсказок при изменении searchQuery
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
      const similar = findSimilarTitles(query, [])
      
      if (similar.length > 0) {
        setBestMatch(similar[0])
        setSimilarTitles([])
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

  // Закрытие модального окна при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        !event.target.closest(`.${styles.floatingButton}`)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSuggestionClick = (suggestion) => {
    const title = suggestion.title || getSuggestionTitle(suggestion)
    onSearchChange?.(title)
    searchInputRef.current?.focus()
  }

  // Не рендерить только когда нет ни поиска, ни групп фильтров
  if (!hasSearch && !hasFilters) return null

  return (
    <>
      {/* Плавающая кнопка открытия фильтров (справа внизу) */}
      <button
        className={styles.floatingButton}
        onClick={() => setIsOpen(true)}
        aria-label="Открыть фильтры"
      >
        {activeFiltersCount > 0 && (
          <span className={styles.badge}>{activeFiltersCount}</span>
        )}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 7H21M6 12H18M9 17H15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Модальное окно с фильтрами */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              ref={modalRef}
              className={styles.modal}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Фильтры</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => setIsOpen(false)}
                  aria-label="Закрыть фильтры"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 6L6 18M6 6L18 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div className={styles.modalContent}>
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

              {/* Кнопка применения фильтров */}
              <div className={styles.modalFooter}>
                <button
                  className={styles.applyButton}
                  onClick={() => setIsOpen(false)}
                >
                  Применить
                </button>
                {activeFiltersCount > 0 && (
                  <button
                    className={styles.clearButton}
                    onClick={() => {
                      const clearedFilters = {}
                      filterGroups.forEach(group => {
                        clearedFilters[group.key] = []
                      })
                      onFiltersChange?.(clearedFilters)
                    }}
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
