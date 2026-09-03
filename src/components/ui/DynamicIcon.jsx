import { lazy, Suspense } from 'react'

// Полный реестр иконок lucide весит около мегабайта. Иконка в контенте
// необязательная и декоративная, поэтому реестр живёт в отдельном чанке
// и не попадает в основной бандл первого экрана.
const IconByName = lazy(() => import('./IconByName'))

export default function DynamicIcon({ name, ...props }) {
  if (!name) return null
  return (
    <Suspense fallback={null}>
      <IconByName name={name} {...props} />
    </Suspense>
  )
}
