import ServicePageContent from './ServicePageContent'

export async function generateMetadata({ params }) {
  const { slug } = await params
  return {
    title: `Услуга - Путешествуй в КЧР`,
    description: 'Детальная информация об услуге или сервисе для туристов',
  }
}

export default async function ServicePage({ params }) {
  const { slug } = await params
  return <ServicePageContent slug={slug} />
}
