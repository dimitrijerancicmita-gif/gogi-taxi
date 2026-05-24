import { useState, useEffect } from 'react';

/**
 * TestPage.jsx
 * Otvori na: http://localhost:3000?test=true
 * Proverava: GPS korisnika, GPS vozača, konekciju na server
 */

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function TestPage({ onBack }) {
  const [gps,     setGps]     = useState(null);
  const [gpsErr,  setGpsErr]  = useState(null);
  const [gpsLoad, setGpsLoad] = useState(true);
  const [server,  setServer]  = useState(null); // null=checking, true=ok, false=fail
  const [drivers, setDrivers] = useState([]);

  /* Test 1 — GPS korisnika */
  useEffect(() => {
    if (!navigator.geolocation) { setGpsErr('Geolocation nije podržan u ovom browseru.'); setGpsLoad(false); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGps({ lat: coords.latitude, lng: coords.longitude, acc: Math.round(coords.accuracy) });
        setGpsLoad(false);
      },
      (err) => { setGpsErr(err.message); setGpsLoad(false); },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, []);

  /* Test 2 — server konekcija */
  useEffect(() => {
    fetch(SERVER_URL)
      .then(r => r.json())
      .then(d => { setServer(true); setDrivers(Object.values(d.drivers || {})); })
      .catch(() => setServer(false));
  }, []);

  const Row = ({ label, ok, value, detail }) => (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      background: ok === true ? 'rgba(22,163,74,0.08)' : ok === false ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${ok === true ? '#16a34a' : ok === false ? '#dc2626' : '#2a2f45'}`,
      borderRadius: 10, padding: '14px 16px', marginBottom: 10,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>
        {ok === true ? '✅' : ok === false ? '❌' : '⏳'}
      </span>
      <div>
        <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: 15, color: '#e2e8f0', letterSpacing: 0.5 }}>{label}</div>
        {value  && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>{value}</div>}
        {detail && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontStyle: 'italic' }}>{detail}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', padding: '32px 20px', fontFamily: 'Barlow,sans-serif' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 26, fontWeight: 700, color: '#f5a623', letterSpacing: 2, marginBottom: 6 }}>
          🔧 GPS & Server Test
        </h1>
        <p style={{ color: '#4a5568', fontSize: 13, marginBottom: 28 }}>
          URL: <code style={{ background: '#131722', padding: '2px 6px', borderRadius: 4, color: '#94a3b8' }}>?test=true</code>
        </p>

        {/* GPS */}
        <Row
          label="GPS lokacija (tvoj uređaj)"
          ok={gpsLoad ? null : gps ? true : false}
          value={gps ? `📍 ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}  ·  ±${gps.acc}m tačnost` : gpsErr || ''}
          detail={gps ? 'Tvoj browser ispravno daje GPS koordinate.' : 'Proveri da li si dao dozvolu za lokaciju u browseru.'}
        />

        {/* HTTPS */}
        <Row
          label="HTTPS / localhost"
          ok={location.protocol === 'https:' || location.hostname === 'localhost'}
          value={`${location.protocol}//${location.hostname}`}
          detail="GPS radi samo na https:// ili localhost. Na http:// je blokiran browserom."
        />

        {/* Server */}
        <Row
          label={`Server konekcija (${SERVER_URL})`}
          ok={server}
          value={server === true ? `✔ Server odgovara. Aktivnih vozača: ${drivers.length}` : server === false ? 'Server ne odgovara.' : 'Provera…'}
          detail={server === false ? 'Pokreni: cd taxi-server && node server.js' : ''}
        />

        {/* Active drivers */}
        {drivers.length > 0 && (
          <div style={{ background: '#131722', border: '1px solid #1e2538', borderRadius: 10, padding: 16, marginBottom: 10 }}>
            <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, color: '#22d160', fontSize: 14, marginBottom: 10 }}>
              📡 Aktivni vozači na serveru:
            </div>
            {drivers.map(d => (
              <div key={d.driverId} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
                <span>🚖 <strong style={{ color: '#e2e8f0' }}>{d.name}</strong></span>
                <span style={{ color: '#4a5568' }}>·</span>
                <span>{d.lat ? `${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}` : 'čeka GPS…'}</span>
                <span className={`status-badge ${d.status}`} style={{ marginLeft: 'auto', fontSize: 10 }}>{d.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* Uputstvo za test */}
        <div style={{ background: '#131722', border: '1px solid #1e2538', borderRadius: 10, padding: 16, marginTop: 20 }}>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, color: '#f5a623', fontSize: 14, marginBottom: 10 }}>
            🧪 Kako testirati lokalno:
          </div>
          {[
            ['Terminal 1', 'cd taxi-server && npm install && node server.js'],
            ['Terminal 2', 'npm run dev'],
            ['Tab 1 — Mušterija', 'http://localhost:3000  →  Naruči Taksi'],
            ['Tab 2 — Vozač',     'http://localhost:3000  →  Dispečer/Vozač (PIN 1234)  →  "Ja sam Vozač"'],
            ['Tab 3 — Test',      'http://localhost:3000?test=true'],
          ].map(([label, cmd]) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
              <code style={{ background: '#07090f', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: '#93c5fd', display: 'block' }}>{cmd}</code>
            </div>
          ))}
        </div>

        <button
          onClick={onBack}
          style={{
            marginTop: 20, width: '100%', padding: 12,
            background: '#131722', border: '1px solid #1e2538', borderRadius: 10,
            color: '#94a3b8', cursor: 'pointer', fontFamily: 'Barlow,sans-serif', fontSize: 14,
          }}
        >
          ◀ Nazad na app
        </button>
      </div>
    </div>
  );
}
