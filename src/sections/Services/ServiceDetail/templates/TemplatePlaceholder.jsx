import { Link } from 'react-router-dom'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import styles from '../ServiceDetail.module.css'

/**
 * Общая обёртка для шаблона типа услуги.
 * Пока без данных с бэка — только заголовок и блоки-заглушки для последующего визуала.
 */
export default function TemplatePlaceholder({ typeTitle, typeKey, children }) {
  return (
    <main className={styles.main}>
      <CenterBlock className={styles.servicePage}>
        <nav className={styles.bread_crumbs}>
          <Link to="/">Главная</Link>
          <span> / </span>
          <Link to="/services">Услуги</Link>
          <span> / </span>
          <span>Шаблон: {typeTitle}</span>
        </nav>

        <h1 className={styles.pageTitle} style={{ marginBottom: 24 }}>
          Шаблон: {typeTitle}
        </h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>
          Тип: <code>{typeKey}</code>. Данные с бэка пока не подставляются.
        </p>

        {children || (
          <>
            <section className={styles.templateBlock} style={{ marginBottom: 24 }}>
              <h2 className={styles.templateBlockTitle}>Описание</h2>
              <div className={styles.templateBlockContent}>Здесь будет описание услуги.</div>
            </section>
            <section className={styles.templateBlock} style={{ marginBottom: 24 }}>
              <h2 className={styles.templateBlockTitle}>Контакты и адрес</h2>
              <div className={styles.templateBlockContent}>Телефон, адрес, ссылки.</div>
            </section>
            <section className={styles.templateBlock}>
              <h2 className={styles.templateBlockTitle}>Дополнительно</h2>
              <div className={styles.templateBlockContent}>Специфичные для типа поля.</div>
            </section>
          </>
        )}
      </CenterBlock>
    </main>
  )
}
