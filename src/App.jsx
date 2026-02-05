import { Routes, Route, Outlet, useParams, useLocation } from 'react-router-dom'
import LayoutWrapper from '@/components/layout/LayoutWrapper'
import Main_page from '@/sections/Main_page'
import Region_page from '@/sections/Region/Region_page'
import Routes_page from '@/sections/Routes/Routes_page'
import RouteDetail from '@/sections/Routes/RouteDetail/RouteDetail'
import Places_page from '@/sections/Places/Places_page'
import News_page from '@/sections/News/News_page'
import NewsDetail from '@/sections/News/NewsDetail/NewsDetail'
import Services_page from '@/sections/Services/Services_page'
import ServicePageContent from '@/app/services/[slug]/ServicePageContent'
import { ServiceTemplateByType } from '@/sections/Services/ServiceDetail/templates'
import TemplateListPage from '@/sections/Services/ServiceDetail/templates/TemplateListPage'
import NotFound from '@/app/not-found'
import AdminLayout from '@/app/admin/layout'
import AdminDashboard from '@/app/admin/page'
import AdminLoginPage from '@/app/admin/login/page'
import AdminPlacesPage from '@/app/admin/places/page'
import AdminPlaceEditPage from '@/app/admin/places/[id]/page'
import AdminRoutesPage from '@/app/admin/routes/page'
import AdminRouteEditPage from '@/app/admin/routes/[id]/page'
import AdminNewsPage from '@/app/admin/news/page'
import AdminNewsEditPage from '@/app/admin/news/[id]/page'
import AdminServicesPage from '@/app/admin/services/page'
import AdminServiceEditPage from '@/app/admin/services/[id]/page'
import AdminReviewsPage from '@/app/admin/reviews/page'
import AdminRegionPage from '@/app/admin/region/page'

function PublicLayout() {
  return (
    <LayoutWrapper>
      <Outlet />
    </LayoutWrapper>
  )
}

function NewsDetailWrapper() {
  const { slug } = useParams()
  return <NewsDetail slug={slug} />
}

function RouteDetailWrapper() {
  const { slug } = useParams()
  return <RouteDetail routeSlug={slug} />
}

function ServiceDetailWrapper() {
  const { slug } = useParams()
  return <ServicePageContent slug={slug} />
}

function ServiceTemplatePreviewWrapper() {
  const { type } = useParams()
  const pathname = useLocation().pathname
  // type из URL (на случай если useParams вложенного маршрута не отдаёт param)
  const typeFromPath = pathname.split('/').pop()
  const resolvedType = type || typeFromPath
  return <ServiceTemplateByType type={resolvedType} />
}

export default function App() {
  return (
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
        <Route path="services" element={<Services_page />} />
        <Route path="services/template" element={<TemplateListPage />} />
        <Route path="services/template/:type" element={<ServiceTemplatePreviewWrapper />} />
        <Route path="services/:slug" element={<ServiceDetailWrapper />} />
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
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="services/:id" element={<AdminServiceEditPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="region" element={<AdminRegionPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
