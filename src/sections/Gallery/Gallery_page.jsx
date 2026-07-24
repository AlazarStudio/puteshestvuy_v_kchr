import { useState, useEffect, useCallback, useRef } from 'react'
import { Upload } from 'lucide-react'
import ImgFullWidthBlock from '@/components/ImgFullWidthBlock/ImgFullWidthBlock'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import PhotoLightbox from '@/components/PhotoLightbox'
import UploadPhotoModal from '@/components/UploadPhotoModal'
import Seo from '@/components/Seo/Seo'
import { collectionPage, breadcrumbList } from '@/lib/seo/schema'
import { absoluteUrl } from '@/lib/seo/config'
import { publicGalleryAPI, publicPagesAPI, getImageUrl } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import styles from './Gallery_page.module.css'

const PER_PAGE = 24

const DEFAULT_HERO = {
  title: 'ФОТОБАНК РЕГИОНА',
  description: 'Фотографии Карачаево-Черкесии, снятые путешественниками. Загрузите свои — они станут частью общей коллекции региона',
  image: '/full_places_bg.jpg',
}

export default function Gallery_page() {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  const [hero, setHero] = useState(DEFAULT_HERO)
  const [photos, setPhotos] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadIdRef = useRef(0)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    publicPagesAPI.get('gallery')
      .then((res) => {
        if (res.data?.content?.hero) setHero({ ...DEFAULT_HERO, ...res.data.content.hero })
      })
      .catch(() => {})
  }, [])

  const load = useCallback(async (nextPage, { append } = {}) => {
    const requestId = ++loadIdRef.current
    setLoading(true)
    setError('')
    try {
      const { data } = await publicGalleryAPI.getAll({ page: nextPage, limit: PER_PAGE })
      if (requestId !== loadIdRef.current) return
      setPhotos((prev) => (append ? [...prev, ...(data.items || [])] : (data.items || [])))
      setTotal(data.pagination?.total ?? 0)
      setPages(data.pagination?.pages ?? 1)
      setPage(nextPage)
    } catch {
      if (requestId !== loadIdRef.current) return
      setError('Не удалось загрузить фотографии. Попробуйте обновить страницу')
    } finally {
      if (requestId === loadIdRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const handleUploadClick = () => {
    if (!user) { openAuthModal(); return }
    setUploadOpen(true)
  }

  return (
    <main className={styles.main}>
      <Seo
        title="Фотобанк Карачаево-Черкесии — фотографии региона"
        description="Фотографии Карачаево-Черкесии от путешественников. Смотрите, скачивайте и добавляйте свои снимки в фотобанк региона."
        path="/gallery"
        jsonLd={[
          collectionPage({
            name: 'Фотобанк региона',
            description: 'Фотографии Карачаево-Черкесии от путешественников.',
            url: absoluteUrl('/gallery'),
          }),
          breadcrumbList([
            { name: 'Главная', url: absoluteUrl('/') },
            { name: 'Фотогалерея', url: absoluteUrl('/gallery') },
          ]),
        ]}
      />

      <ImgFullWidthBlock
        img={getImageUrl(hero.image)}
        title={hero.title}
        desc={hero.description}
        alt="Фотобанк Карачаево-Черкесии"
      />

      <CenterBlock>
        <div className={styles.gridBottomSpace}>
          <div className={styles.head}>
            <div className={styles.count}>
              {total > 0 ? `Фотографий в фотобанке: ${total}` : 'Фотобанк пополняется'}
            </div>
            <button type="button" className={styles.uploadBtn} onClick={handleUploadClick}>
              <Upload size={18} />
              <span>Загрузить фото</span>
            </button>
          </div>

          {loading && photos.length === 0 ? (
            <div className={styles.state}>Загрузка...</div>
          ) : error && photos.length === 0 ? (
            <div className={styles.state}>{error}</div>
          ) : photos.length === 0 ? (
            <div className={styles.state}>
              <p>В фотобанке пока нет фотографий. Станьте первым.</p>
              <button type="button" className={styles.uploadBtn} onClick={handleUploadClick}>
                <Upload size={18} />
                <span>Загрузить фото</span>
              </button>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    className={styles.cardBtn}
                    onClick={() => setLightboxIndex(index)}
                  >
                    <div
                      className={styles.cardImg}
                      style={photo.width && photo.height ? { aspectRatio: `${photo.width} / ${photo.height}` } : undefined}
                    >
                      <img src={getImageUrl(photo.url)} alt="" loading="lazy" />
                    </div>
                    <div className={styles.cardCaption}>
                      <span className={styles.cardPlace}>{photo.placeCaption}</span>
                      <span className={styles.cardAuthor}>{photo.authorCaption}</span>
                    </div>
                  </button>
                ))}
              </div>

              {error && <div className={styles.state}>{error}</div>}

              {page < pages && (
                <div className={styles.moreRow}>
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => load(page + 1, { append: true })}
                    disabled={loading}
                  >
                    {loading ? 'Загрузка...' : 'Показать ещё'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </CenterBlock>

      <PhotoLightbox
        photos={photos}
        startIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />

      <UploadPhotoModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => load(1)}
      />
    </main>
  )
}
