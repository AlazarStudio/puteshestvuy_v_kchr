import { loadAccessibility, isAccessibilityLoaded } from '../BVI/BVI'

export default function AccessibilityButton({ className, src = '/bvi_white.png' }) {
  // Первое нажатие подгружает внешнюю библиотеку и сразу включает режим,
  // дальше кнопкой управляет уже сам виджет
  const handleClick = () => {
    if (isAccessibilityLoaded()) return
    loadAccessibility(() => document.getElementById('specialButton')?.click())
  }

  return (
    <img
      id="specialButton"
      src={src}
      alt="Режим для слабовидящих"
      title="Версия для слабовидящих"
      className={className}
      onClick={handleClick}
      style={{ cursor: 'pointer', width: '35px', height: '35px', objectFit: 'contain' }}
    />
  )
}
