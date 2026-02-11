'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import styles from './ParallaxImage.module.css'

/**
 * Компонента для создания эффекта плавного движения картинки за курсором мыши
 * 
 * @param {string} src - URL изображения
 * @param {string} alt - Альтернативный текст для изображения
 * @param {number} maxOffset - Максимальное смещение картинки в пикселях (по умолчанию 10)
 * @param {number} scale - Масштаб увеличения при наведении (по умолчанию 1.02)
 * @param {object} springConfig - Конфигурация пружины для плавности движения
 *   - stiffness: жесткость (по умолчанию 160)
 *   - damping: затухание (по умолчанию 18)
 *   - mass: масса (по умолчанию 0.5)
 * @param {string} className - Дополнительные CSS классы для контейнера
 * @param {string} imgClassName - Дополнительные CSS классы для изображения
 * @param {object} style - Дополнительные inline стили для контейнера
 * @param {object} imgStyle - Дополнительные inline стили для изображения
 * @param {function} onMouseEnter - Callback при наведении мыши
 * @param {function} onMouseLeave - Callback при уходе мыши
 * @param {function} onMouseMove - Callback при движении мыши
 * @param {React.ReactNode} children - Дочерние элементы, которые будут отображаться поверх изображения
 */
export default function ParallaxImage({
  src,
  alt = '',
  maxOffset = 10,
  scale = 1.02,
  springConfig = { stiffness: 160, damping: 18, mass: 0.5 },
  className = '',
  imgClassName = '',
  style = {},
  imgStyle = {},
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  children,
  ...props
}) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scaleValue = useMotionValue(1)
  
  // Плавность движения с настраиваемыми параметрами
  const xSpring = useSpring(x, springConfig)
  const ySpring = useSpring(y, springConfig)
  const scaleSpring = useSpring(scaleValue, { stiffness: 100, damping: 25, mass: 1 })

  const handleMouseMove = (e) => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width // 0..1
    const py = (e.clientY - rect.top) / rect.height // 0..1

    // -0.5..0.5 (центр = 0)
    const dx = px - 0.5
    const dy = py - 0.5

    x.set(dx * maxOffset)
    y.set(dy * maxOffset)

    // Вызываем пользовательский callback, если он передан
    if (onMouseMove) {
      onMouseMove(e)
    }
    
    // Не останавливаем всплытие события, чтобы клики работали
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    scaleValue.set(1)

    // Вызываем пользовательский callback, если он передан
    if (onMouseLeave) {
      onMouseLeave()
    }
  }

  const handleMouseEnter = (e) => {
    scaleValue.set(scale)
    
    // Вызываем пользовательский callback, если он передан
    if (onMouseEnter) {
      onMouseEnter(e)
    }
  }

  return (
    <div
      ref={ref}
      className={`${styles.container} ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      <div className={styles.imageWrapper}>
        <motion.img
          src={src}
          alt={alt}
          className={`${styles.image} ${imgClassName}`}
          style={{
            x: xSpring,
            y: ySpring,
            scale: scaleSpring,
            ...imgStyle,
          }}
        />
      </div>
      {children && (
        <div className={styles.overlay}>
          {children}
        </div>
      )}
    </div>
  )
}
