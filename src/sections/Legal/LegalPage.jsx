import CenterBlock from '@/components/CenterBlock/CenterBlock'
import Seo from '@/components/Seo/Seo'
import NotFound from '@/app/not-found'
import { getLegalDocument } from '@/lib/legal'
import linkify from '@/lib/legal/linkify'
import styles from './LegalPage.module.css'

function LegalBlock({ block }) {
  if (block.type === 'heading') {
    return <h2 className={styles.heading}>{block.text}</h2>
  }

  if (block.type === 'subheading') {
    return <h3 className={styles.subheading}>{block.text}</h3>
  }

  if (block.type === 'list') {
    return (
      <ul className={styles.list}>
        {block.items.map((item, i) => (
          <li key={i}>
            {typeof item === 'string' ? (
              linkify(item)
            ) : (
              <>
                <strong className={styles.label}>{item.label}</strong> {linkify(item.text)}
              </>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <p className={`${styles.paragraph} ${block.strong ? styles.strong : ''}`}>
      {block.label && <strong className={styles.label}>{block.label}</strong>}
      {block.label ? ' ' : null}
      {linkify(block.text)}
    </p>
  )
}

export default function LegalPage({ slug }) {
  const doc = getLegalDocument(slug)

  if (!doc) return <NotFound />

  return (
    <main className={styles.page}>
      <Seo title={doc.seo.title} description={doc.seo.description} path={`/legal/${doc.slug}`} />

      <CenterBlock width={900}>
        <article className={styles.doc}>
          <h1 className={styles.title}>{doc.title}</h1>
          {doc.subtitle && <p className={styles.subtitle}>{linkify(doc.subtitle)}</p>}
          {doc.blocks.map((block, i) => (
            <LegalBlock key={i} block={block} />
          ))}
        </article>
      </CenterBlock>
    </main>
  )
}
