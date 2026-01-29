'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Map, 
  MapPin, 
  Newspaper, 
  Building2, 
  Star,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import styles from './admin.module.css';

export const AdminHeaderRightContext = createContext(null);

const menuItems = [
  { href: '/admin', label: 'Главная', icon: LayoutDashboard },
  { href: '/admin/places', label: 'Места', icon: MapPin },
  { href: '/admin/routes', label: 'Маршруты', icon: Map },
  { href: '/admin/news', label: 'Новости', icon: Newspaper },
  { href: '/admin/services', label: 'Услуги', icon: Building2 },
  { href: '/admin/reviews', label: 'Отзывы', icon: Star },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerRight, setHeaderRight] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (!token || !user) {
      if (pathname !== '/admin/login') {
        router.push('/admin/login');
      }
      setIsLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (userData.role !== 'SUPERADMIN') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
        setIsLoading(false);
        return;
      }
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      router.push('/admin/login');
    }
    
    setIsLoading(false);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  // Показываем страницу логина без layout
  if (pathname === '/admin/login') {
    return children;
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.adminContainer}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <Link href={"/"} target='_blank' className={styles.logo}>КЧР Админ</Link>
          <button 
            className={styles.toggleBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
        
        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.navIcon}><Icon size={20} /></span>
                {sidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span className={styles.navIcon}><LogOut size={20} /></span>
            {sidebarOpen && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.breadcrumb}>
            {pathname.split('/').filter(Boolean).map((part, index, arr) => (
              <span key={part}>
                {index > 0 && ' / '}
                <span className={index === arr.length - 1 ? styles.currentPage : ''}>
                  {part === 'admin' ? 'Админ панель' : 
                   part === 'routes' ? 'Маршруты' :
                   part === 'places' ? 'Места' :
                   part === 'news' ? 'Новости' :
                   part === 'services' ? 'Услуги' :
                   part === 'reviews' ? 'Отзывы' : part}
                </span>
              </span>
            ))}
          </div>
          {headerRight && <div className={styles.headerRight}>{headerRight}</div>}
        </header>
        
        <div className={styles.content}>
          <AdminHeaderRightContext.Provider value={{ setHeaderRight }}>
            {children}
          </AdminHeaderRightContext.Provider>
        </div>
      </main>
    </div>
  );
}
