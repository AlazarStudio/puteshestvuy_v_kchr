import { Link } from 'react-router-dom'
import ServiceCardWithParallax from '@/components/ServiceCardWithParallax/ServiceCardWithParallax'
import styles from './profile.module.css'
import serviceStyles from '@/sections/Services/Services_page.module.css'

export default function ServicesTab({ services, loading }) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Избранные сервис и услуги</h2>
      {loading ? (
        <p className={styles.favLoading}>Загрузка...</p>
      ) : services.length === 0 ? (
        <p className={styles.empty}>
          Нет избранных услуг. <Link to="/services">Добавить услуги</Link>
        </p>
      ) : (
        <div className={serviceStyles.servicesGrid}>
          {services.map((service) => (
            <div key={service.id} className={styles.serviceCardWrap}>
              <ServiceCardWithParallax
                service={service}
                serviceUrl={`/services/${service.slug || service.id}`}
                isArticle={false}
                styles={serviceStyles}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
