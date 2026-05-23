import styles from './Notification.module.css';

/**
 * Notification.jsx
 *
 * Auto-dismissing toast shown in the bottom-right corner.
 * Types: 'success' | 'error' | 'info'
 */
export default function Notification({ msg, type = 'info' }) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.icon}>{icons[type]}</span>
      <span>{msg}</span>
    </div>
  );
}
