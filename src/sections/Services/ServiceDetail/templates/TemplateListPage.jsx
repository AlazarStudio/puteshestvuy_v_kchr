import { Link } from 'react-router-dom'
import CenterBlock from '@/components/CenterBlock/CenterBlock'
import { TEMPLATE_COMPONENTS } from './index'
import styles from '../ServiceDetail.module.css'

/** Страница со списком ссылок на все шаблоны типов услуг (для выбора визуала) */
export default function TemplateListPage() {
  const typeKeys = Object.keys(TEMPLATE_COMPONENTS)

  return (
    <main className={styles.main}>
      <CenterBlock className={styles.servicePage}>
        <nav className={styles.bread_crumbs}>
          <Link to="/">Главная</Link>
          <span> / </span>
          <Link to="/services">Услуги</Link>
          <span> / </span>
          <span>Шаблоны по типам</span>
        </nav>
        <h1 className={styles.pageTitle} style={{ marginBottom: 8 }}>
          Шаблоны типов услуг
        </h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
          Без данных с бэка. Выберите тип, чтобы открыть шаблон и определиться с визуалом.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {typeKeys.map((key) => (
            <li key={key}>
              <Link
                to={`/services/template/${key}`}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  background: '#fff',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: '#0f172a',
                  fontWeight: 500,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {key}
              </Link>
            </li>
          ))}
        </ul>
      </CenterBlock>
    </main>
  )
}
