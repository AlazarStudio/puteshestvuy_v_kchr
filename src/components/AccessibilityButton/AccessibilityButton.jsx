import { useAccessibilityScript } from '../BVI/BVI'
import { useAccessibilityStyles } from '../BVI/BVIStyles'

export default function AccessibilityButton({ className, src = '/bvi_white.png' }) {
  useAccessibilityStyles()
  useAccessibilityScript()

  return (
    <img
      id="specialButton"
      src={src}
      alt="Режим для слабовидящих"
      title="Версия для слабовидящих"
      className={className}
      style={{ cursor: 'pointer', width: '35px', height: '35px', objectFit: 'contain' }}
    />
  )
}
