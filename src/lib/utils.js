/**
 * Удаляет HTML-теги из строки (для краткого превью в карточках).
 */
export function stripHtml(html) {
  if (html == null || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Скачивание файла с другого origin: атрибут download работает только для
 * same-origin, поэтому тянем через fetch и отдаём как blob.
 * При сбое сети открываем файл в новой вкладке.
 */
export async function downloadFile(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Не удалось загрузить файл');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || url.split('/').pop() || 'file';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
