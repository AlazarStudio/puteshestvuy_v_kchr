import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function loadLidrekon() {
  if (document.getElementById('accessibility-script')) return
  const script = document.createElement('script')
  script.src = 'https://lidrekon.ru/slep/js/uhpv-full.min.js'
  script.id = 'accessibility-script'
  document.body.appendChild(script)
}

function ensureJQuery(callback) {
  if (window.jQuery) { callback(); return }

  const existing = document.getElementById('jquery-for-bvi')
  if (existing) {
    existing.addEventListener('load', callback, { once: true })
    return
  }

  const script = document.createElement('script')
  script.src = 'https://code.jquery.com/jquery-3.7.1.min.js'
  script.id = 'jquery-for-bvi'
  script.onload = callback
  document.body.appendChild(script)
}

export function useAccessibilityScript() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      const s = document.getElementById('accessibility-script')
      if (s) s.parentNode.removeChild(s)
      return
    }

    ensureJQuery(loadLidrekon)
  }, [location.pathname])
}
