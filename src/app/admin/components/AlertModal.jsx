'use client';

import { AlertCircle } from 'lucide-react';
import styles from './Modal.module.css';

export default function AlertModal({
  open,
  title = 'Внимание',
  message,
  buttonLabel = 'OK',
  variant = 'error', // 'error' | 'info'
  onClose,
}) {
  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="alertdialog" aria-modal="true" aria-labelledby="alert-title">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={`${styles.iconWrap} ${variant === 'error' ? styles.iconWrapError : styles.iconWrapInfo}`}>
            <AlertCircle size={24} />
          </div>
          <h2 id="alert-title" className={styles.title}>{title}</h2>
        </div>
        <div className={styles.body}>
          {message && <p className={styles.message}>{message}</p>}
          <div className={`${styles.actions} ${styles.actionsSingle}`}>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
