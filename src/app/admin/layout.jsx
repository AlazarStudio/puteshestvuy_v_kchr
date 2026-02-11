import { useState, useEffect, createContext } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  MapPin, 
  Newspaper, 
  Building2, 
  Star,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { placesAPI, routesAPI, newsAPI, servicesAPI, reviewsAPI } from '@/lib/api';
import styles from './admin.module.css';

export const AdminHeaderRightContext = createContext(null);
export const AdminBreadcrumbContext = createContext(null);

const menuItems = [
  { href: '/admin', label: 'Главная', icon: LayoutDashboard, key: null },
  { href: '/admin/pages', label: 'Страницы сайта', icon: FileText, key: null },
  { href: '/admin/places', label: 'Места', icon: MapPin, key: 'places' },
  { href: '/admin/routes', label: 'Маршруты', icon: Map, key: 'routes' },
  { href: '/admin/news', label: 'Новости и статьи', icon: Newspaper, key: 'news' },
  { href: '/admin/services', label: 'Услуги', icon: Building2, key: 'services' },
  { href: '/admin/reviews', label: 'Отзывы', icon: Star, key: 'reviews' },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerRight, setHeaderRight] = useState(null);
  const [breadcrumbLabel, setBreadcrumbLabel] = useState(null);
  const [counts, setCounts] = useState({
    places: null,
    routes: null,
    news: null,
    services: null,
    reviews: null,
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (!token || !user) {
      if (pathname !== '/admin/login') {
        navigate('/admin/login');
      }
      setIsLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (userData.role !== 'SUPERADMIN') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
        setIsLoading(false);
        return;
      }
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/admin/login');
    }
    
    setIsLoading(false);
  }, [pathname, navigate]);

  // Загрузка счетчиков объектов
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCounts = async () => {
      try {
        const [placesRes, routesRes, newsRes, servicesRes, reviewsRes] = await Promise.all([
          placesAPI.getAll({ page: 1, limit: 1 }).catch(() => ({ data: { pagination: { total: 0 } } })),
          routesAPI.getAll({ page: 1, limit: 1 }).catch(() => ({ data: { pagination: { total: 0 } } })),
          newsAPI.getAll({ page: 1, limit: 1 }).catch(() => ({ data: { pagination: { total: 0 } } })),
          servicesAPI.getAll({ page: 1, limit: 1 }).catch(() => ({ data: { pagination: { total: 0 } } })),
          reviewsAPI.getAll({ page: 1, limit: 1 }).catch(() => ({ data: { pagination: { total: 0 } } })),
        ]);

        setCounts({
          places: placesRes.data?.pagination?.total ?? 0,
          routes: routesRes.data?.pagination?.total ?? 0,
          news: newsRes.data?.pagination?.total ?? 0,
          services: servicesRes.data?.pagination?.total ?? 0,
          reviews: reviewsRes.data?.pagination?.total ?? 0,
        });
      } catch (error) {
        console.error('Ошибка загрузки счетчиков:', error);
      }
    };

    fetchCounts();
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

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
          <Link to="/" target="_blank" rel="noopener noreferrer" className={styles.logo}>КЧР Админ</Link>
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
            const count = item.key ? counts[item.key] : null;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.navIcon}><Icon size={20} /></span>
                {sidebarOpen && (
                  <>
                    <span className={styles.navLabel}>{item.label}</span>
                    {count !== null && (
                      <span className={styles.navCount}>{count}</span>
                    )}
                  </>
                )}
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
            {pathname.split('/').filter(Boolean).map((part, index, arr) => {
              const isLast = index === arr.length - 1;
              const label = isLast && breadcrumbLabel != null && breadcrumbLabel !== ''
                ? breadcrumbLabel
                : part === 'admin' ? 'Админ панель' :
                  part === 'routes' ? 'Маршруты' :
                  part === 'places' ? 'Места' :
                  part === 'news' ? 'Новости и статьи' :
                  part === 'services' ? 'Услуги' :
                  part === 'reviews' ? 'Отзывы' :
                  part === 'pages' ? 'Страницы сайта' :
                  part === 'region' ? 'О регионе' :
                  part === 'footer' ? 'Подвал сайта' : part;
              const href = '/' + arr.slice(0, index + 1).join('/');
              return (
                <span key={index}>
                  {index > 0 && ' / '}
                  <Link
                    to={href}
                    className={isLast ? styles.currentPage : ''}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {label}
                  </Link>
                </span>
              );
            })}
          </div>
          {headerRight && <div className={styles.headerRight}>{headerRight}</div>}
        </header>
        
        <div className={styles.content}>
          <AdminHeaderRightContext.Provider value={{ setHeaderRight }}>
            <AdminBreadcrumbContext.Provider value={{ setBreadcrumbLabel }}>
              <Outlet />
            </AdminBreadcrumbContext.Provider>
          </AdminHeaderRightContext.Provider>
        </div>
      </main>
    </div>
  );
}
