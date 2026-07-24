import { Link } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { getImageUrl } from '@/lib/api'
import styles from './GalleryPromoBlock.module.css'

export default function GalleryPromoBlock({
  title = 'Фотобанк региона',
  text = 'Поделитесь своими снимками Карачаево-Черкесии — после проверки они войдут в общую коллекцию региона и станут доступны другим путешественникам.',
  buttonText = 'Перейти в фотогалерею',
  image = '',
}) {
  return (
    <div
      className={styles.block}
      style={image ? { backgroundImage: `url(${getImageUrl(image)})` } : undefined}
    >
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.icon}><Camera size={28} /></div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.text}>{text}</p>
        <Link to="/gallery" className={styles.button}>{buttonText}</Link>
      </div>
    </div>
  )
}
