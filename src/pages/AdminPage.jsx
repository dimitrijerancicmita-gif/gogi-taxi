import { useState } from 'react';
import { STATUS_META, MAP_CENTER } from '../constants/index.js';
import DriverPage from './DriverPage.jsx';
import styles from './AdminPage.module.css';

export default function AdminPage({ vehicles, setVehicles, orders, onBack }) {
  const [tab,     setTab]     = useState('vozila');
  const [showAdd, setShowAdd] = useState(false);
  const [nv,      setNv]      = useState({ name: '', driver: '', phone: '' });
  const [addErr,  setAddErr]  = useState(false);

  const handleAdd = () => {
    if (!nv.name || !nv.driver || !nv.phone) { setAddErr(true); return; }
    const spread = 0.025;
    setVehicles(prev => [...prev, {
      id: Date.now(), name: nv.name.trim(), driver: nv.driver.trim(),
      phone: nv.phone.trim(), status: 'slobodan',
      lat: MAP_CENTER[0] + (Math.random() - 0.5) * spread,
      lng: MAP_CENTER[1] + (Math.random() - 0.5) * spread,
    }]);
    setNv({ name: '', driver: '', phone: '' });
    setAddErr(false);
    setShowAdd(false);
  };

  const handleRemove  = (id) => setVehicles(prev => prev.filter(v => v.id !== id));
  const handleStatus  = (id, status) => setVehicles(prev => prev.map(v => v.id === id ? { ...v, status } : v));

  const freeCount = vehicles.filter(v => v.status === 'slobodan').length;
  const busyCount = vehicles.filter(v => v.status === 'zauzet').length;
  const offCount  = vehicles.filter(v => v.status === 'offline').length;

  // Vozač tab — pun ekran DriverPage unutar admin layouta
  if (tab === 'vozac') {
    return (
      <div className={styles.layout}>
        <div className={styles.topbar}>
          <button className={styles.backBtn} onClick={() => setTab('vozila')}>◀ Nazad na Panel</button>
          <h1 className={styles.heading}>📡 GPS Vozača</h1>
          <div />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <DriverPage vehicles={vehicles} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={onBack}>◀ Nazad na Mapu</button>
        <h1 className={styles.heading}>⚙️ Admin Panel</h1>
        {tab === 'vozila'
          ? <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ Dodaj Vozilo</button>
          : <div />
        }
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <StatCard value={vehicles.length} label="Ukupno"    color="var(--gold)"  />
        <StatCard value={freeCount}        label="Slobodna"  color="var(--green)" />
        <StatCard value={busyCount}        label="Zauzeta"   color="var(--red)"   />
        <StatCard value={offCount}         label="Offline"   color="var(--gray)"  />
        <StatCard value={orders.length}    label="Narudžbi"  color="var(--blue)"  />
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          ['vozila',   '🚖 Vozila'],
          ['narudzbe', '📋 Narudžbe'],
          ['vozac',    '📡 Ja sam Vozač'],
          ['info',     '📌 Uputstvo'],
        ].map(([k, l]) => (
          <button
            key={k}
            className={tab === k ? styles.tabActive : styles.tab}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className={styles.body}>

        {/* ── Vozila ── */}
        {tab === 'vozila' && (
          <table className={styles.table}>
            <thead>
              <tr><th>#</th><th>Vozilo</th><th>Vozač</th><th>Telefon</th><th>Status</th><th>GPS</th><th>Akcija</th></tr>
            </thead>
            <tbody>
              {vehicles.map((v, i) => (
                <tr key={v.id}>
                  <td className={styles.idx}>{i + 1}</td>
                  <td className={styles.bold}>{v.name}</td>
                  <td>{v.driver}</td>
                  <td>{v.phone}</td>
                  <td>
                    <select
                      className={`${styles.statusSel} status-badge ${v.status}`}
                      value={v.status}
                      onChange={e => handleStatus(v.id, e.target.value)}
                    >
                      <option value="slobodan">Slobodan</option>
                      <option value="zauzet">Zauzet</option>
                      <option value="offline">Offline</option>
                    </select>
                  </td>
                  <td className={styles.coords}>{v.lat.toFixed(4)}, {v.lng.toFixed(4)}</td>
                  <td><button className={styles.removeBtn} onClick={() => handleRemove(v.id)}>🗑 Ukloni</button></td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan={7} className={styles.empty}>Nema vozila.</td></tr>
              )}
            </tbody>
          </table>
        )}

        {/* ── Narudžbe ── */}
        {tab === 'narudzbe' && (
          orders.length === 0
            ? <p className={styles.emptyMsg}>Nema narudžbi.</p>
            : (
              <table className={styles.table}>
                <thead>
                  <tr><th>#</th><th>Ime</th><th>Telefon</th><th>Adresa</th><th>Vozač</th><th>ETA</th><th>Vreme</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.id}>
                      <td className={styles.idx}>{i + 1}</td>
                      <td className={styles.bold}>{o.name}</td>
                      <td>{o.phone}</td>
                      <td>{o.address}</td>
                      <td>{o.driver}</td>
                      <td>{o.eta}</td>
                      <td className={styles.coords}>{o.time}</td>
                      <td>
                        <span className={`status-badge ${o.status === 'Završena' ? 'offline' : 'slobodan'}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        )}

        {/* ── Info ── */}
        {tab === 'info' && <InfoTab />}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className={styles.overlay} onClick={() => setShowAdd(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>➕ Novo Vozilo</h2>
            <p  className={styles.modalSub}>Biće postavljeno u Smederevo zonu.</p>
            <div className="form-group">
              <label>Naziv vozila *</label>
              <input value={nv.name}   onChange={e => setNv({...nv, name: e.target.value})}   placeholder="npr. Toyota Camry #4" className={addErr && !nv.name ? 'error' : ''} />
            </div>
            <div className="form-group">
              <label>Ime vozača *</label>
              <input value={nv.driver} onChange={e => setNv({...nv, driver: e.target.value})} placeholder="Ime i prezime"        className={addErr && !nv.driver ? 'error' : ''} />
            </div>
            <div className="form-group">
              <label>Telefon *</label>
              <input value={nv.phone}  onChange={e => setNv({...nv, phone: e.target.value})}  placeholder="06x xxx xxxx"         className={addErr && !nv.phone ? 'error' : ''} />
            </div>
            {addErr && <p className={styles.err}>Sva polja su obavezna.</p>}
            <div className={styles.modalBtns}>
              <button className={styles.cancel}  onClick={() => { setShowAdd(false); setAddErr(false); }}>Otkaži</button>
              <button className={styles.confirm} onClick={handleAdd}>Dodaj Vozilo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div style={{ flex:1, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 10px', textAlign:'center' }}>
      <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:28, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:1, color:'var(--text3)', marginTop:4 }}>{label}</div>
    </div>
  );
}

function InfoTab() {
  return (
    <div style={{ maxWidth:760, lineHeight:1.8 }}>
      <Section title="1. Pokreni server">
        <pre>{`cd taxi-server\nnpm install\nnode server.js`}</pre>
      </Section>
      <Section title="2. Podesi .env">
        <pre>{`VITE_SERVER_URL=http://localhost:4000`}</pre>
        Za produkciju (Railway): <pre>{`VITE_SERVER_URL=https://tvoj-server.up.railway.app`}</pre>
      </Section>
      <Section title="3. Vozač šalje GPS">
        Klikni tab <strong style={{color:'var(--green)'}}>📡 Ja sam Vozač</strong> — unesi ID i ime, GPS se automatski šalje na server.
      </Section>
      <Section title="4. Desktop .exe (Electron)">
        <pre>{`npm i -D electron electron-builder\nnpm run build\nnpx electron-builder → .exe`}</pre>
      </Section>
      <div style={{background:'var(--bg2)',border:'1px solid var(--gold-dim)',borderRadius:'var(--radius)',padding:'12px 16px',marginTop:12,color:'var(--gold)',fontSize:13}}>
        <strong>Admin PIN:</strong> <code style={{background:'var(--bg3)',padding:'1px 8px',borderRadius:4}}>1234</code> — promeni u <code>src/constants/index.js</code>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:22 }}>
      <h3 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:15, fontWeight:700, letterSpacing:1, color:'var(--gold)', marginBottom:6 }}>{title}</h3>
      <div style={{ color:'var(--text2)', fontSize:13 }}>{children}</div>
    </div>
  );
}
