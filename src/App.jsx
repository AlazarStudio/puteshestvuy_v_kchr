import { lazy, Suspense } from 'react'
import { Routes, Route, Outlet, useParams, useLocation } from 'react-router-dom'
import LayoutWrapper from '@/components/layout/LayoutWrapper'
import Main_page from '@/sections/Main_page'
import Seo from '@/components/Seo/Seo'
import NotFound from '@/app/not-found'

// Публичные страницы: всё, кроме главной, догружается отдельным чанком.
// Главная и layout (шапка/подвал) остаются в основном бандле — это первый экран (LCP).
const Region_page = lazy(() => import('@/sections/Region/Region_page'))
const Routes_page = lazy(() => import('@/sections/Routes/Routes_page'))
const RouteDetail = lazy(() => import('@/sections/Routes/RouteDetail/RouteDetail'))
const Places_page = lazy(() => import('@/sections/Places/Places_page'))
const News_page = lazy(() => import('@/sections/News/News_page'))
const NewsDetail = lazy(() => import('@/sections/News/NewsDetail/NewsDetail'))
const Events_page = lazy(() => import('@/sections/Events/Events_page'))
const EventDetail = lazy(() => import('@/sections/Events/EventDetail/EventDetail'))
const Services_page = lazy(() => import('@/sections/Services/Services_page'))
const Gallery_page = lazy(() => import('@/sections/Gallery/Gallery_page'))
const Map_page = lazy(() => import('@/sections/Map/Map_page'))
const LegalPage = lazy(() => import('@/sections/Legal/LegalPage'))
const ServicePageContent = lazy(() => import('@/app/services/[slug]/ServicePageContent'))
const TemplateListPage = lazy(() => import('@/sections/Services/ServiceDetail/templates/TemplateListPage'))
const ServiceTemplateByType = lazy(() =>
  import('@/sections/Services/ServiceDetail/templates').then((m) => ({ default: m.ServiceTemplateByType }))
)
const LoginPage = lazy(() => import('@/app/login/page'))
const RegisterPage = lazy(() => import('@/app/register/page'))
const ForgotPasswordPage = lazy(() => import('@/app/forgot-password/page'))
const ResetPasswordPage = lazy(() => import('@/app/reset-password/page'))
const ProfilePage = lazy(() => import('@/app/profile/page'))

// Админка: самый тяжёлый кусок (редактор, кроппер, таблицы) — только по требованию
const AdminLayout = lazy(() => import('@/app/admin/layout'))
const AdminDashboard = lazy(() => import('@/app/admin/page'))
const AdminLoginPage = lazy(() => import('@/app/admin/login/page'))
const AdminPlacesPage = lazy(() => import('@/app/admin/places/page'))
const AdminPlaceEditPage = lazy(() => import('@/app/admin/places/[id]/page'))
const AdminRoutesPage = lazy(() => import('@/app/admin/routes/page'))
const AdminRouteEditPage = lazy(() => import('@/app/admin/routes/[id]/page'))
const AdminNewsPage = lazy(() => import('@/app/admin/news/page'))
const AdminNewsEditPage = lazy(() => import('@/app/admin/news/[id]/page'))
const AdminEventsPage = lazy(() => import('@/app/admin/events/page'))
const AdminEventEditPage = lazy(() => import('@/app/admin/events/[id]/page'))
const AdminServicesPage = lazy(() => import('@/app/admin/services/page'))
const AdminServiceEditPage = lazy(() => import('@/app/admin/services/[id]/page'))
const AdminReviewsPage = lazy(() => import('@/app/admin/reviews/page'))
const AdminUsersPage = lazy(() => import('@/app/admin/users/page'))
const AdminBookingsPage = lazy(() => import('@/app/admin/bookings/page'))
const AdminRegionPage = lazy(() => import('@/app/admin/region/page'))
const AdminFooterPage = lazy(() => import('@/app/admin/footer/page'))
const AdminPagesPage = lazy(() => import('@/app/admin/pages/page'))
const AdminSuggestionsPage = lazy(() => import('@/app/admin/suggestions/page'))
const AdminGalleryPage = lazy(() => import('@/app/admin/gallery/page'))

// Нейтральная заглушка на время подгрузки чанка: держит высоту, ничего не рисует
const pageFallback = <div style={{ minHeight: '60vh' }} />

function PublicLayout() {
  return (
    <LayoutWrapper>
      <Suspense fallback={pageFallback}>
        <Outlet />
      </Suspense>
    </LayoutWrapper>
  )
}

function NewsDetailWrapper() {
  const { slug } = useParams()
  return <NewsDetail slug={slug} />
}

function EventDetailWrapper() {
  const { slug } = useParams()
  return <EventDetail slug={slug} />
}

function RouteDetailWrapper() {
  const { slug } = useParams()
  return <RouteDetail routeSlug={slug} />
}

function ServiceDetailWrapper() {
  const { slug } = useParams()
  return <ServicePageContent slug={slug} />
}

function LegalPageWrapper() {
  const { slug } = useParams()
  return <LegalPage slug={slug} />
}

function ServiceTemplatePreviewWrapper() {
  const { type } = useParams()
  const pathname = useLocation().pathname
  // type из URL (на случай если useParams вложенного маршрута не отдаёт param)
  const typeFromPath = pathname.split('/').pop()
  const resolvedType = type || typeFromPath
  return (
    <>
      <Seo noindex title="Шаблон услуги — Путешествуй КЧР" />
      <ServiceTemplateByType type={resolvedType} />
    </>
  )
}

export default function App() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <Routes>
        {/* Публичные страницы с Layout (Header + Footer) */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Main_page />} />
          <Route path="region" element={<Region_page />} />
          <Route path="routes" element={<Routes_page />} />
          <Route path="routes/:slug" element={<RouteDetailWrapper />} />
          <Route path="places" element={<Places_page />} />
          <Route path="places/:slug" element={<Places_page />} />
          <Route path="news" element={<News_page />} />
          <Route path="news/:slug" element={<NewsDetailWrapper />} />
          <Route path="events" element={<Events_page />} />
          <Route path="events/:slug" element={<EventDetailWrapper />} />
          <Route path="services" element={<Services_page />} />
          <Route path="services/template" element={<TemplateListPage />} />
          <Route path="services/template/:type" element={<ServiceTemplatePreviewWrapper />} />
          <Route path="services/:slug" element={<ServiceDetailWrapper />} />
          <Route path="gallery" element={<Gallery_page />} />
          <Route path="map" element={<Map_page />} />
          <Route path="legal/:slug" element={<LegalPageWrapper />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="profile" element={<ProfilePage />} />
          {/* 404 внутри layout: у страницы должны быть шапка и подвал */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Админ: логин без layout */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Админ: страницы с layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="places" element={<AdminPlacesPage />} />
          <Route path="places/:id" element={<AdminPlaceEditPage />} />
          <Route path="routes" element={<AdminRoutesPage />} />
          <Route path="routes/:id" element={<AdminRouteEditPage />} />
          <Route path="news" element={<AdminNewsPage />} />
          <Route path="news/:id" element={<AdminNewsEditPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="events/:id" element={<AdminEventEditPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="services/:id" element={<AdminServiceEditPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="pages" element={<AdminPagesPage />} />
          <Route path="region" element={<AdminRegionPage />} />
          <Route path="footer" element={<AdminFooterPage />} />
          <Route path="suggestions" element={<AdminSuggestionsPage />} />
          <Route path="gallery" element={<AdminGalleryPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
