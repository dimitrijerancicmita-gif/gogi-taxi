import { useState } from 'react';
import VehicleCard from './VehicleCard.jsx';
import OrderCard   from './OrderCard.jsx';
import styles      from './Sidebar.module.css';

/**
 * Sidebar.jsx
 *
 * Collapsible left panel with:
 *   - Brand header + action buttons
 *   - Live stats (free / busy / orders)
 *   - Tabs: Vozila | Narudžbe
 *   - Customer order button (role === 'customer')
 */
export default function Sidebar({
  open,
  role,
  vehicles,
  setVehicles,
  orders,
  selected,
  onSelectVehicle,
  onOpenAdmin,
  onLogout,
  onOrderClick,
}) {
  const [tab, setTab] = useState('vozila');

  const freeCount = vehicles.filter((v) => v.status === 'slobodan').length;
  const busyCount = vehicles.filter((v) => v.status === 'zauzet').length;

  return (
    <aside className={`${styles.sidebar} ${open ? '' : styles.collapsed}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.hex}>SD</div>
          <span className={styles.brandName}>GOGI TAXI</span>
        </div>
        <div className={styles.actions}>
          {role === 'admin' && (
            <button className={styles.iconBtn} onClick={onOpenAdmin} title="Admin panel">⚙️</button>
          )}
          <button className={styles.iconBtn} onClick={onLogout} title="Odjava">🔒</button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statVal} style={{ color: 'var(--green)' }}>{freeCount}</span>
          <span className={styles.statLbl}>Slobodna</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal} style={{ color: 'var(--red)' }}>{busyCount}</span>
          <span className={styles.statLbl}>Zauzeta</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal}>{orders.length}</span>
          <span className={styles.statLbl}>Narudžbi</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={tab === 'vozila' ? styles.tabActive : styles.tab}
          onClick={() => setTab('vozila')}
        >
          🚖 Vozila ({vehicles.length})
        </button>
        <button
          className={tab === 'narudzbe' ? styles.tabActive : styles.tab}
          onClick={() => setTab('narudzbe')}
        >
          📋 Narudžbe
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {tab === 'vozila' && vehicles.map((v) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            selected={selected?.id === v.id}
            role={role}
            onClick={() => onSelectVehicle(v)}
            onStatusChange={(status) =>
              setVehicles((prev) => prev.map((x) => x.id === v.id ? { ...x, status } : x))
            }
          />
        ))}

        {tab === 'narudzbe' && (
          orders.length === 0
            ? <div className={styles.empty}>Nema narudžbi</div>
            : orders.map((o) => <OrderCard key={o.id} order={o} />)
        )}
      </div>

      {/* Customer order button */}
      {role === 'customer' && (
        <div className={styles.footer}>
          <button className={styles.orderBtn} onClick={onOrderClick}>
            🚖 &nbsp;NARUČI VOZILO
          </button>
        </div>
      )}
    </aside>
  );
}
