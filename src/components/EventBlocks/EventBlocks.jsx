import { Link } from 'react-router-dom'
import RichTextContent from '@/components/RichTextContent/RichTextContent'
import NewsGalleryBlock from '@/components/NewsGalleryBlock'
import { resolveLink } from '@/app/admin/components/LinkSelector/LinkSelector'
import { getImageUrl } from '@/lib/api'
import { slugFromText } from '@/app/admin/components/NewsBlockEditor/NewsBlockEditor'
import styles from './EventBlocks.module.css'

/** Тело события: тот же формат блоков, что у новости, плюс кнопка и видео */
export default function EventBlocks({ blocks = [], poster }) {
  const sorted = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <div className={styles.root}>
      {sorted.map((block) => {
        if (block.type === 'heading' && block.data?.text) {
          return (
            <h2 key={block.id} id={slugFromText(block.data.text)} className={styles.heading}>
              {block.data.text}
            </h2>
          )
        }

        if (block.type === 'text' && block.data?.content) {
          return <RichTextContent key={block.id} html={block.data.content} />
        }

        if (block.type === 'quote' && block.data?.content) {
          return (
            <blockquote key={block.id} className={styles.quote}>
              <RichTextContent html={block.data.content} />
            </blockquote>
          )
        }

        if (block.type === 'image' && block.data?.url) {
          const author = block.data?.author?.trim()
          return (
            <figure key={block.id} className={styles.imageFigure}>
              <div className={styles.imageBlock}>
                <img src={getImageUrl(block.data.url)} alt="" />
              </div>
              {author && <figcaption className={styles.caption}>Фото: {author}</figcaption>}
            </figure>
          )
        }

        if (block.type === 'gallery' && Array.isArray(block.data?.images) && block.data.images.length > 0) {
          return (
            <NewsGalleryBlock key={block.id} images={block.data.images} authors={block.data.imageAuthors} />
          )
        }

        if (block.type === 'video' && block.data?.url) {
          return (
            <div key={block.id} className={styles.videoEmbed}>
              <iframe
                title="Видео"
                src={block.data.url}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          )
        }

        if (block.type === 'eventVideo' && block.data?.url) {
          if (block.data.source === 'file') {
            return (
              <div key={block.id} className={styles.videoFile}>
                <video
                  controls
                  preload="metadata"
                  playsInline
                  poster={block.data.poster || poster ? getImageUrl(block.data.poster || poster) : undefined}
                  src={getImageUrl(block.data.url)}
                />
              </div>
            )
          }
          return (
            <div key={block.id} className={styles.videoEmbed}>
              <iframe
                title="Видео"
                src={block.data.url}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          )
        }

        if (block.type === 'button' && block.data?.link) {
          const { text, url, isFile } = resolveLink(block.data.link)
          const label = block.data.text?.trim() || text
          if (!label || !url || url === '#') return null

          const isExternal = /^https?:\/\//i.test(url) || isFile
          return isExternal ? (
            <a
              key={block.id}
              className={styles.button}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {label}
            </a>
          ) : (
            <Link key={block.id} className={styles.button} to={url}>
              {label}
            </Link>
          )
        }

        return null
      })}
    </div>
  )
}
