import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ExternalLink } from 'lucide-react';
import { statsAPI } from '@/lib/api';
import styles from '../admin.module.css';

const PERIODS = [
  { key: 'd7', label: '7 дней' },
  { key: 'd30', label: '30 дней' },
];
const METRICS = [
  { key: 'visits', label: 'Визиты' },
  { key: 'users', label: 'Посетители' },
  { key: 'pageviews', label: 'Просмотры' },
];
const POPULAR = [
  { key: 'places', label: 'Популярные места', href: '/admin/places' },
  { key: 'routes', label: 'Популярные маршруты', href: '/admin/routes' },
  { key: 'services', label: 'Популярные услуги', href: '/admin/services' },
];

const formatNumber = (value) => Number(value || 0).toLocaleString('ru-RU');

/**
 * Посещаемость на дашборде: сводка Метрики за 7 и 30 дней, топ страниц и популярные
 * объекты по уникальным просмотрам. Метрика может быть не настроена или недоступна —
 * популярные объекты показываются в любом случае.
 */
export default function AnalyticsBlock() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    statsAPI
      .getAnalytics()
      .then((response) => {
        if (cancelled) return;
        setData(response.data);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const metrika = data?.metrika;
  const popular = data?.popular || {};

  return (
    <section className={styles.analytics}>
      <div className={styles.analyticsHeader}>
        <h2>
          <BarChart3 size={20} />
          Посещаемость
        </h2>
        {data?.configured && (
          <a
            className={styles.analyticsLink}
            href={`https://metrika.yandex.ru/dashboard?id=${data.counterId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Открыть в Метрике
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {status === 'loading' && <p className={styles.analyticsNote}>Загрузка…</p>}
      {status === 'error' && <p className={styles.analyticsNote}>Не удалось загрузить посещаемость</p>}

      {status === 'ready' && (
        <>
          {!data.configured && (
            <p className={styles.analyticsNote}>
              Метрика не настроена: укажите номер счётчика и токен в настройках сервера
              (YANDEX_METRIKA_COUNTER_ID, YANDEX_METRIKA_TOKEN).
            </p>
          )}
          {data.configured && !metrika?.ok && (
            <p className={styles.analyticsNote}>Метрика сейчас недоступна, ниже только просмотры объектов.</p>
          )}

          {metrika?.ok && (
            <div className={styles.analyticsPeriods}>
              {PERIODS.map((period) => (
                <div key={period.key} className={styles.analyticsPeriod}>
                  <h3>{period.label}</h3>
                  <dl>
                    {METRICS.map((metric) => (
                      <div key={metric.key}>
                        <dt>{metric.label}</dt>
                        <dd>{formatNumber(metrika[period.key]?.[metric.key])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
              <div className={styles.analyticsList}>
                <h3>Топ страниц за 30 дней</h3>
                {(() => {
                  const topPages = metrika?.topPages || [];
                  return topPages.length === 0 ? (
                    <p className={styles.analyticsNote}>Пока нет данных</p>
                  ) : (
                    <ol>
                      {topPages.map((page) => (
                        <li key={page.path}>
                          <a href={page.path} target="_blank" rel="noopener noreferrer" title={page.path}>
                            {page.path}
                          </a>
                          <span>{formatNumber(page.pageviews)}</span>
                        </li>
                      ))}
                    </ol>
                  );
                })()}
              </div>
            </div>
          )}

          <div className={styles.analyticsPopular}>
            {POPULAR.map((group) => {
              const items = popular[group.key] || [];
              return (
                <div key={group.key} className={styles.analyticsList}>
                  <h3>{group.label}</h3>
                  {items.length === 0 ? (
                    <p className={styles.analyticsNote}>Просмотров пока нет</p>
                  ) : (
                    <ol>
                      {items.map((item) => (
                        <li key={item.id}>
                          <Link to={`${group.href}/${item.id}`} title={item.title}>
                            {item.title}
                          </Link>
                          <span>{formatNumber(item.views)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
