import RouteDetail from '@/sections/Routes/RouteDetail/RouteDetail'

export async function generateMetadata({ params }) {
  const { slug } = await params
  
  return {
    title: `Маршрут - Путешествуй в КЧР`,
    description: 'Детальная информация о туристическом маршруте',
  }
}

export default async function RoutePage({ params }) {
  const { slug } = await params
  
  return <RouteDetail routeSlug={slug} />
}
