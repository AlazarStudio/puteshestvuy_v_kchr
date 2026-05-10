const LANG_KEY = 'site_lang'
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA'])
const BATCH_SIZE = 50

export function getCurrentLang() {
  return localStorage.getItem(LANG_KEY) || 'ru'
}

export function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang)
}

function collectTextNodes(root) {
  const nodes = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT
      if (parent.closest('[data-notranslate]')) return NodeFilter.FILTER_REJECT
      if (parent.dataset.translated) return NodeFilter.FILTER_SKIP
      const text = node.textContent.trim()
      if (!text || text.length < 2) return NodeFilter.FILTER_SKIP
      return NodeFilter.FILTER_ACCEPT
    },
  })
  let node
  while ((node = walker.nextNode())) nodes.push(node)
  return nodes
}

async function fetchTranslations(texts) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  const res = await fetch(`${apiUrl}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, targetLang: 'en' }),
  })
  if (!res.ok) throw new Error('Translation request failed')
  const data = await res.json()
  return data.translations
}

export async function translatePage() {
  const nodes = collectTextNodes(document.body)
  if (nodes.length === 0) return

  for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
    const batch = nodes.slice(i, i + BATCH_SIZE)
    const texts = batch.map((n) => n.textContent.trim())
    try {
      const translations = await fetchTranslations(texts)
      batch.forEach((node, idx) => {
        if (!translations[idx] || !node.parentElement) return
        node.parentElement.dataset.translated = '1'
        node.textContent = translations[idx]
      })
    } catch (e) {
      console.error('Translation batch error:', e)
    }
  }
}

let observer = null
let debounceTimer = null

export function startObserver() {
  if (observer) observer.disconnect()
  observer = new MutationObserver((mutations) => {
    const hasNew = mutations.some((m) =>
      Array.from(m.addedNodes).some(
        (n) => n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE
      )
    )
    if (!hasNew) return
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => translatePage(), 600)
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

export function stopObserver() {
  clearTimeout(debounceTimer)
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

// Сбросить пометки о переводе (нужно перед re-translate после навигации)
export function resetTranslationMarks() {
  document.querySelectorAll('[data-translated]').forEach((el) => {
    delete el.dataset.translated
  })
}
