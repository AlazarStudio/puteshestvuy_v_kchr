import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useAccessibilityStyles() {
  const location = useLocation()

  useEffect(() => {
    const linkId = 'accessibility-styles'
    const existingLink = document.getElementById(linkId)

    if (!location.pathname.startsWith('/admin')) {
      if (!existingLink) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://lidrekon.ru/slep/css/special.min.css'
        link.id = linkId
        document.head.appendChild(link)
      }
    } else {
      if (existingLink) existingLink.parentNode.removeChild(existingLink)
    }
  }, [location.pathname])
}
