'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function ThumbnailParallax({ 
  src, 
  alt,
  maxOffset = 10,
  scale = 1.02
}) {
  const cardRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scaleValue = useMotionValue(1)
  const xSpring = useSpring(x, { stiffness: 160, damping: 18, mass: 0.5 })
  const ySpring = useSpring(y, { stiffness: 160, damping: 18, mass: 0.5 })
  const scaleSpring = useSpring(scaleValue, { stiffness: 100, damping: 25, mass: 1 })

  const handleMouseMove = (e) => {
    const el = cardRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const dx = px - 0.5
    const dy = py - 0.5

    x.set(dx * maxOffset)
    y.set(dy * maxOffset)
  }

  const handleMouseEnter = () => {
    scaleValue.set(scale)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    scaleValue.set(1)
  }

  return (
    <div
      ref={cardRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.img
        src={src}
        alt={alt}
        style={{
          x: xSpring,
          y: ySpring,
          scale: scaleSpring,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    </div>
  )
}
