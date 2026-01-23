import RouteDetail from '@/sections/Routes/RouteDetail/RouteDetail'

export async function generateMetadata({ params }) {
  const { id } = await params
  
  return {
    title: `Маршрут ${id} - Путешествуй в КЧР`,
    description: 'Детальная информация о туристическом маршруте',
  }
}

export default async function RoutePage({ params }) {
  const { id } = await params
  
  return <RouteDetail routeId={id} />
}
