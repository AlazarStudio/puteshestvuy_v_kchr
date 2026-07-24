/** Цвета статусов фотографии фотобанка — общие для админки и кабинета */
export const GALLERY_STATUS_COLORS = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
};

/** Подписи статусов для модерации в админке */
export const GALLERY_STATUS_LABELS_ADMIN = {
  pending: 'Ожидает',
  approved: 'Опубликовано',
  rejected: 'Отклонено',
};

/** Подписи статусов для пользователя в личном кабинете — более развёрнутые */
export const GALLERY_STATUS_LABELS_USER = {
  pending: 'Ожидает проверки',
  approved: 'Опубликовано',
  rejected: 'Отклонено',
};
