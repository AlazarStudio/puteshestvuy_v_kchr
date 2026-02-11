// Функция для поиска текста в объекте (рекурсивно по всем полям)
export const searchInObject = (obj, query, path = '') => {
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
export const calculateSimilarity = (str1, str2) => {
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

// Функция поиска с fallback (удаление символов с конца)
export const searchWithFallback = async (query, searchFunction) => {
  if (!query || query.trim().length === 0) {
    return { results: [], fallback: null }
  }
  
  const normalizedQuery = query.trim()
  let currentQuery = normalizedQuery
  let results = []
  let fallbackQuery = null
  
  // Пытаемся найти результаты с текущим запросом
  while (currentQuery.length > 0) {
    const searchResults = await searchFunction(currentQuery)
    
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
      titleSimilarity: calculateSimilarity(lowerOriginalQuery, (result.title || '').toLowerCase())
    }))
    
    // Сортируем: сначала по похожести названия (от большей к меньшей)
    resultsWithSimilarity.sort((a, b) => {
      if (b.titleSimilarity !== a.titleSimilarity) {
        return b.titleSimilarity - a.titleSimilarity
      }
      return 0
    })
    
    // Убираем поле similarity из результатов перед возвратом
    results = resultsWithSimilarity.map(({ titleSimilarity, ...rest }) => rest)
  }
  
  return { results, fallback: fallbackQuery }
}

// Функция для поиска похожих названий среди элементов
export const findSimilarTitles = (query, items = [], existingResults = [], getTitle = (item) => item.title || item.name, maxResults = 5) => {
  if (!query || query.trim().length < 2) return []
  
  const lowerQuery = query.toLowerCase().trim()
  
  // Создаем Set существующих названий из результатов, чтобы исключить их
  const existingTitles = new Set(existingResults.map(r => {
    const title = getTitle(r)
    return title ? title.toLowerCase() : ''
  }).filter(Boolean))
  
  // Собираем все названия, исключая уже найденные
  const allTitles = items
    .map(item => {
      const title = getTitle(item)
      if (!title || existingTitles.has(title.toLowerCase())) {
        return null
      }
      return {
        ...item,
        title,
        similarity: calculateSimilarity(lowerQuery, title.toLowerCase())
      }
    })
    .filter(item => item !== null && item.similarity > 0.15) // Минимальный порог похожести
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults)
  
  return allTitles.map(item => ({
    ...item,
    // Убираем similarity из результата, если не нужен
  }))
}
