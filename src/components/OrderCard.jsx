import styles from './OrderCard.module.css';

export default function OrderCard({ order: o }) {
  const finished = o.status === 'Završena';
  return (
    <div className={`${styles.card} fadeIn`}>
      <div className={styles.top}>
        <span className={styles.name}>{o.name}</span>
        <span className={styles.status} style={finished ? { background:'rgba(107,114,128,.2)', color:'var(--gray)' } : {}}>
          {o.status}
        </span>
      </div>
      {/* Telefon korisnika */}
      <div className={styles.row}>📞 <a href={`tel:${o.phone}`} className={styles.tel}>{o.phone}</a></div>
      <div className={styles.row}>📍 {o.address}</div>
      <div className={styles.row}>🚖 {o.driver} &nbsp;·&nbsp; ⏱ {o.eta}</div>
      <div className={styles.time}>🕐 {o.time}</div>
    </div>
  );
}
