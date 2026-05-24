import styles from './VehicleCard.module.css';

/**
 * VehicleCard.jsx
 *
 * Shows one vehicle in the sidebar list.
 * Admin gets a status <select>; customer sees read-only info.
 */
export default function VehicleCard({ vehicle: v, selected, role, onClick, onStatusChange }) {
  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''} fadeIn`}
      onClick={onClick}
    >
      <div className={styles.top}>
        <div>
          <div className={styles.name}>{v.name}</div>
          <div className={styles.driver}>👤 {v.driver}</div>
        </div>
        <span className={`status-badge ${v.status}`}>
          {{ slobodan: 'Slobodan', zauzet: 'Zauzet', offline: 'Offline' }[v.status]}
        </span>
      </div>

      <div className={styles.bottom}>
        <span className={styles.phone}>📞 {v.phone}</span>
        {role === 'admin' && (
          <select
            className={styles.statusSel}
            value={v.status}
            onChange={(e) => onStatusChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="slobodan">Slobodan</option>
            <option value="zauzet">Zauzet</option>
            <option value="offline">Offline</option>
          </select>
        )}
      </div>
    </div>
  );
}
