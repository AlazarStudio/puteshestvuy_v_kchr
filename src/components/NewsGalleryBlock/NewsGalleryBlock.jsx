'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { getImageUrl } from '@/lib/api'
import styles from './NewsGalleryBlock.module.css'

export default function NewsGalleryBlock({ images = [], className }) {
  const photos = images.map((url) => ({ src: getImageUrl(url) }))
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const swiperRef = useRef(null)

  const visiblePhotos = photos.slice(0, 5)
  const remainingCount = photos.length - 5
  const showMoreButton = photos.length > 5

  const openModal = (index) => {
    setActiveIndex(Math.min(index, photos.length - 1))
    setIsModalOpen(true)
  }

  const closeModal = () => setIsModalOpen(false)

  const handleSlideChange = (swiper) => setActiveIndex(swiper.realIndex)

  useEffect(() => {
    if (isModalOpen && swiperRef.current) {
      swiperRef.current.swiper.slideToLoop(activeIndex)
    }
  }, [isModalOpen, activeIndex])

  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal()
      } else if (swiperRef.current && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.key === 'ArrowLeft' ? swiperRef.current.swiper.slidePrev() : swiperRef.current.swiper.slideNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isModalOpen])

  if (photos.length === 0) return null

  const count = photos.length
  const countClass = count === 1 ? styles.galleryCount1 : count === 2 ? styles.galleryCount2 : count === 3 ? styles.galleryCount3 : ''

  const renderGallery = () => {
    if (count === 1) {
      return (
        <div className={styles.galleryFull} onClick={() => openModal(0)}>
          <img src={photos[0]?.src} alt="" />
        </div>
      )
    }
    if (count === 2) {
      return (
        <>
          <div className={styles.galleryHalf} onClick={() => openModal(0)}>
            <img src={photos[0]?.src} alt="" />
          </div>
          <div className={styles.galleryHalf} onClick={() => openModal(1)}>
            <img src={photos[1]?.src} alt="" />
          </div>
        </>
      )
    }
    if (count === 3) {
      return (
        <>
          <div className={styles.galleryThirdLeft} onClick={() => openModal(0)}>
            <img src={photos[0]?.src} alt="" />
          </div>
          <div className={styles.galleryThirdRight}>
            <div className={styles.galleryThirdRightItem} onClick={() => openModal(1)}>
              <img src={photos[1]?.src} alt="" />
            </div>
            <div className={styles.galleryThirdRightItem} onClick={() => openModal(2)}>
              <img src={photos[2]?.src} alt="" />
            </div>
          </div>
        </>
      )
    }
    return (
      <>
        <div className={styles.galleryMain} onClick={() => openModal(0)}>
          <img src={photos[0]?.src} alt="" />
        </div>
        <div className={styles.galleryGrid}>
          <div className={styles.galleryGridRow}>
            {visiblePhotos.slice(1, 3).map((photo, index) => {
              const photoIndex = index + 1
              return (
                <div key={photoIndex} className={styles.galleryItem} onClick={() => openModal(photoIndex)}>
                  <img src={photo.src} alt="" />
                </div>
              )
            })}
          </div>
          <div className={styles.galleryGridRow}>
            {visiblePhotos.slice(3, 5).map((photo, index) => {
              const photoIndex = index + 3
              const isLast = photoIndex === 4 && showMoreButton
              return (
                <div key={photoIndex} className={`${styles.galleryItem} ${isLast ? styles.galleryItemLast : ''}`} onClick={() => openModal(photoIndex)}>
                  <img src={photo.src} alt="" />
                  {isLast && (
                    <div className={styles.moreButton} onClick={(e) => { e.stopPropagation(); openModal(5); }}>
                      <img src="/morePhoto.png" alt="" />
                      <span>Еще {remainingCount} фото</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className={`${styles.gallery} ${countClass} ${className || ''}`}>
        {renderGallery()}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className={styles.galleryModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className={styles.galleryModalContent}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className={styles.galleryModalClose} onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className={styles.galleryModalMain}>
                <Swiper
                  ref={swiperRef}
                  modules={[Navigation]}
                  navigation
                  loop
                  spaceBetween={20}
                  slidesPerView={1}
                  initialSlide={activeIndex}
                  onSlideChange={handleSlideChange}
                  className={styles.galleryModalSwiper}
                >
                  {photos.map((photo, index) => (
                    <SwiperSlide key={index}>
                      <div className={styles.galleryModalSlide}>
                        <img src={photo.src} alt="" />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
              <div className={styles.galleryModalThumbnails}>
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className={`${styles.thumbnail} ${activeIndex === index ? styles.thumbnailActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveIndex(index)
                      swiperRef.current?.swiper?.slideToLoop(index)
                    }}
                  >
                    <img src={photo.src} alt="" />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
