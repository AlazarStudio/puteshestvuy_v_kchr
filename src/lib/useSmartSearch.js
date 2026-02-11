import { useState, useEffect, useRef } from 'react'
import { searchInObject, searchWithFallback } from './searchUtils'

/**
 * Хук для умного поиска с fallback логикой
 * @param {Array} items - массив элементов для поиска
 * @param {string} query - поисковый запрос
 * @param {Function} getTitle - функция для получения названия элемента (item) => string
 * @param {number} debounceMs - задержка debounce в миллисекундах (по умолчанию 300)
 * @returns {Object} { results, fallback, isLoading }
 */
export function useSmartSearch(items = [], query = '', getTitle = (item) => item.title || item.name, debounceMs = 300) {
  const [results, setResults] = useState([])
  const [fallback, setFallback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const debounceTimerRef = useRef(null)

  useEffect(() => {
    // Очищаем предыдущий таймер
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!query || !query.trim()) {
      setResults([])
      setFallback(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const timer = setTimeout(async () => {
      // Функция поиска для searchWithFallback
      const performSearch = async (searchQuery) => {
        if (!searchQuery || !searchQuery.trim()) return []
        
        const lowerQuery = searchQuery.toLowerCase().trim()
        
        // Фильтруем элементы используя searchInObject
        const filtered = items.filter(item => searchInObject(item, lowerQuery))
        
        return filtered.map(item => ({
          ...item,
          title: getTitle(item),
        }))
      }

      const { results: searchResults, fallback: fallbackQuery } = await searchWithFallback(query, performSearch)
      
      setResults(searchResults)
      setFallback(fallbackQuery)
      setIsLoading(false)
    }, debounceMs)

    debounceTimerRef.current = timer

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [query, items, getTitle, debounceMs])

  return { results, fallback, isLoading }
}
