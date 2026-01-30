'use client';

import DOMPurify from 'isomorphic-dompurify';
import styles from './RichTextContent.module.css';

/**
 * Безопасный вывод HTML (описание, контент статей и т.д.).
 * Санитизация через DOMPurify для защиты от XSS.
 */
export default function RichTextContent({ html, className }) {
  if (html == null || html === '') return null;

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

  return (
    <div
      className={`${styles.root} ${className || ''}`.trim()}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
