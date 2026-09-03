

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import AppImage from '@/components/ui/AppImage'
import { photoAlt, thumbAlt } from '@/utils/imageAlt'
import styles from './NewsGalleryBlock.module.css'

function GalleryTile({ photo, alt, mediaClass, onClick, children }) {
  return (
    <div className={styles.tile}>
      <div className={mediaClass} onClick={onClick}>
        <AppImage src={photo?.src} alt={alt} />
        {children}
      </div>
      {photo?.author && <div className={styles.photoCaption}>Фото: {photo.author}</div>}
    </div>
  )
}

export default function NewsGalleryBlock({ images = [], authors, title, className }) {
  const photos = images.map((url) => ({
    src: url,
    author: authors?.[url]?.trim() || '',
  }))
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
  const hasAnyAuthor = photos.some((p) => p.author)
  const countClass =count === 1 ? styles.galleryCount1 : count === 2 ? styles.galleryCount2 : count === 3 ? styles.galleryCount3 : ''

  const renderGallery = () => {
    if (count === 1) {
      return <GalleryTile photo={photos[0]} alt={photoAlt(title, 1)} mediaClass={styles.galleryFull} onClick={() => openModal(0)} />
    }
    if (count === 2) {
      return (
        <>
          <GalleryTile photo={photos[0]} alt={photoAlt(title, 1)} mediaClass={styles.galleryHalf} onClick={() => openModal(0)} />
          <GalleryTile photo={photos[1]} alt={photoAlt(title, 2)} mediaClass={styles.galleryHalf} onClick={() => openModal(1)} />
        </>
      )
    }
    if (count === 3) {
      return (
        <>
          <GalleryTile photo={photos[0]} alt={photoAlt(title, 1)} mediaClass={styles.galleryThirdLeft} onClick={() => openModal(0)} />
          <div className={styles.galleryThirdRight}>
            <GalleryTile photo={photos[1]} alt={photoAlt(title, 2)} mediaClass={styles.galleryThirdRightItem} onClick={() => openModal(1)} />
            <GalleryTile photo={photos[2]} alt={photoAlt(title, 3)} mediaClass={styles.galleryThirdRightItem} onClick={() => openModal(2)} />
          </div>
        </>
      )
    }
    return (
      <>
        <GalleryTile photo={photos[0]} alt={photoAlt(title, 1)} mediaClass={styles.galleryMain} onClick={() => openModal(0)} />
        <div className={styles.galleryGrid}>
          <div className={styles.galleryGridRow}>
            {visiblePhotos.slice(1, 3).map((photo, index) => {
              const photoIndex = index + 1
              return (
                <GalleryTile
                  key={photoIndex}
                  photo={photo}
                  alt={photoAlt(title, photoIndex + 1)}
                  mediaClass={styles.galleryItem}
                  onClick={() => openModal(photoIndex)}
                />
              )
            })}
          </div>
          <div className={styles.galleryGridRow}>
            {visiblePhotos.slice(3, 5).map((photo, index) => {
              const photoIndex = index + 3
              const isLast = photoIndex === 4 && showMoreButton
              return (
                <GalleryTile
                  key={photoIndex}
                  photo={photo}
                  alt={photoAlt(title, photoIndex + 1)}
                  mediaClass={`${styles.galleryItem} ${isLast ? styles.galleryItemLast : ''}`}
                  onClick={() => openModal(photoIndex)}
                >
                  {isLast && (
                    <div className={styles.moreButton} onClick={(e) => { e.stopPropagation(); openModal(5); }}>
                      <img src="/morePhoto.png" alt="" />
                      <span>Еще {remainingCount} фото</span>
                    </div>
                  )}
                </GalleryTile>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className={`${styles.gallery} ${countClass} ${hasAnyAuthor ? styles.withCaptions : ''} ${className || ''}`}>
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
                        <AppImage src={photo.src} alt={photoAlt(title, index + 1)} variant="full" />
                        {hasAnyAuthor && (
                          <div className={styles.photoCaptionModal}>
                            {photo.author ? `Фото: ${photo.author}` : ''}
                          </div>
                        )}
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
                    <AppImage src={photo.src} alt={thumbAlt(index + 1)} />
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
