const normalizeText = (text) => text.replace(/[\s\u00a0\u2000-\u200a\u202f\u205f\u3000]+/g, ' ')

export const searchInObject = (obj, query, path = '') => {
  if (!obj || !query) return false
  
  const lowerQuery = normalizeText(query.toLowerCase())
  
  if (typeof obj === 'string') {
    return normalizeText(obj.toLowerCase()).includes(lowerQuery)
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

function levenshteinDistance(a, b) {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m

  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array(n + 1)

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1])
    }
    ;[prev, curr] = [curr, prev]
  }

  return prev[n]
}

function levenshteinSimilarity(a, b) {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1.0
  return 1 - levenshteinDistance(a, b) / maxLen
}

export const calculateSimilarity = (str1, str2) => {
  const s1 = normalizeText(str1.toLowerCase().trim())
  const s2 = normalizeText(str2.toLowerCase().trim())

  if (s1 === s2) return 1.0
  if (!s1 || !s2) return 0.0

  if (s1.includes(s2) || s2.includes(s1)) {
    const ratio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)
    return 0.7 + ratio * 0.3
  }

  const fullSim = levenshteinSimilarity(s1, s2)

  const words1 = s1.split(/\s+/).filter(Boolean)
  const words2 = s2.split(/\s+/).filter(Boolean)

  let wordScore = 0
  if (words1.length > 0 && words2.length > 0) {
    let totalSim = 0
    let matched = 0

    for (const w1 of words1) {
      let best = 0
      for (const w2 of words2) {
        const sim = levenshteinSimilarity(w1, w2)
        const containSim = (w2.includes(w1) || w1.includes(w2))
          ? 0.7 + Math.min(w1.length, w2.length) / Math.max(w1.length, w2.length) * 0.3
          : 0
        best = Math.max(best, sim, containSim)
      }
      totalSim += best
      if (best > 0.6) matched++
    }

    const avgSim = totalSim / words1.length
    const matchRatio = matched / words1.length
    wordScore = avgSim * 0.7 + matchRatio * 0.3
  }

  return Math.max(fullSim, wordScore)
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
