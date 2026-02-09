'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AdminRegionPage from '../region/page';
import AdminFooterPage from '../footer/page';
import styles from '../admin.module.css';

export default function AdminPagesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabFromUrl = searchParams.get('tab') || 'region';
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'footer' ? 'footer' : 'region');

  useEffect(() => {
    const tab = searchParams.get('tab') || 'region';
    setActiveTab(tab === 'footer' ? 'footer' : 'region');
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/admin/pages?tab=${tab}`, { replace: true });
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Страницы сайта</h1>
          <p className={styles.pageSubtitle}>Редактирование страниц сайта</p>
        </div>
      </div>

      <div className={styles.pageTabs}>
        <button
          type="button"
          className={`${styles.pageTab} ${activeTab === 'region' ? styles.pageTabActive : ''}`}
          onClick={() => handleTabChange('region')}
        >
          О регионе
        </button>
        <button
          type="button"
          className={`${styles.pageTab} ${activeTab === 'footer' ? styles.pageTabActive : ''}`}
          onClick={() => handleTabChange('footer')}
        >
          Футер
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'region' && <AdminRegionPage />}
        {activeTab === 'footer' && <AdminFooterPage />}
      </div>
    </div>
  );
}
