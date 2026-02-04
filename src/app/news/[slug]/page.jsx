import NewsDetail from '@/sections/News/NewsDetail'

export async function generateMetadata({ params }) {
  // В будущем здесь можно получать данные новости по slug
  return {
    title: 'Новость или статья | Путешествуй в КЧР',
    description: 'Читайте актуальные новости о туризме в Карачаево-Черкесии',
  }
}

export default async function NewsDetailPage({ params }) {
  const { slug } = await params
  
  return <NewsDetail slug={slug} />
}
