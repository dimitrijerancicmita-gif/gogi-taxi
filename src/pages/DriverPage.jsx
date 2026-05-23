import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import styles from './DriverPage.module.css';

/**
 * DriverPage.jsx
 *
 * Ekran koji vozač otvara na svom telefonu/tabletu.
 * - Traži GPS dozvolu
 * - Šalje lokaciju na server svakih 5 sekundi
 * - Vozač može da menja status (Slobodan / Zauzet)
 *
 * URL za vozača: http://TVOJ_DOMEN/?driver=true
 * ili dodaj u App.jsx rutu /driver
 *
 * SERVER_URL: promeni na IP/domenu svog servera
 */

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
const GPS_INTERVAL_MS = 5_000; // šalje lokaciju svakih 5 sek

export default function DriverPage({ onBack }) {
  const socketRef   = useRef(null);
  const watchRef    = useRef(null);
  const intervalRef = useRef(null);
  const latestPos   = useRef(null); // poslednje koordinate

  const [driverId,   setDriverId]   = useState('');
  const [driverName, setDriverName] = useState('');
  const [joined,     setJoined]     = useState(false);
  const [status,     setStatus]     = useState('slobodan');
  const [gps,        setGps]        = useState(null);   // { lat, lng, accuracy }
  const [gpsErr,     setGpsErr]     = useState(null);
  const [connected,  setConnected]  = useState(false);
  const [sending,    setSending]    = useState(false);  // animacija pulsa
  const [lastSent,   setLastSent]   = useState(null);

  /* ── Poveži se na server ──────────────────────────────── */
  useEffect(() => {
    const socket = io(SERVER_URL, { autoConnect: false });
    socketRef.current = socket;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      if (intervalRef.current)       clearInterval(intervalRef.current);
    };
  }, []);

  /* ── Prijava vozača ───────────────────────────────────── */
  const handleJoin = () => {
    if (!driverId.trim() || !driverName.trim()) return;

    const socket = socketRef.current;
    socket.connect();
    socket.emit('driver:join', { driverId: driverId.trim(), name: driverName.trim() });
    setJoined(true);

    // Pokreni GPS praćenje
    startGPS(socket);
  };

  /* ── GPS ─────────────────────────────────────────────── */
  const startGPS = (socket) => {
    if (!navigator.geolocation) {
      setGpsErr('Geolocation nije podržan na ovom uređaju.');
      return;
    }

    // Kontinuirano praćenje — ažurira latestPos svaki put
    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude, accuracy: Math.round(coords.accuracy) };
        latestPos.current = pos;
        setGps(pos);
        setGpsErr(null);
      },
      (err) => setGpsErr(`GPS greška: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 3_000 }
    );

    // Šalje lokaciju serveru svakih GPS_INTERVAL_MS
    intervalRef.current = setInterval(() => {
      const pos    = latestPos.current;
      const socket = socketRef.current;
      if (!pos || !socket?.connected) return;

      socket.emit('driver:location', { driverId: driverId.trim(), lat: pos.lat, lng: pos.lng });
      setSending(true);
      setLastSent(new Date().toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTimeout(() => setSending(false), 600);
    }, GPS_INTERVAL_MS);
  };

  /* ── Promena statusa ──────────────────────────────────── */
  const changeStatus = (s) => {
    setStatus(s);
    socketRef.current?.emit('driver:status', { driverId: driverId.trim(), status: s });
  };

  /* ── Odjava ───────────────────────────────────────────── */
  const handleLeave = () => {
    socketRef.current?.emit('driver:leave', { driverId: driverId.trim() });
    socketRef.current?.disconnect();
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (intervalRef.current)       clearInterval(intervalRef.current);
    setJoined(false);
    setGps(null);
    setConnected(false);
  };

  /* ── UI ───────────────────────────────────────────────── */

  // Ekran za prijavu
  if (!joined) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.logo}>🚖</div>
          <h1 className={styles.title}>VOZAČ — PRIJAVA</h1>
          <p className={styles.sub}>Unesite vaše podatke za GPS praćenje</p>

          <div className="form-group">
            <label>ID vozača</label>
            <input
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              placeholder="npr. vozac_1"
            />
          </div>
          <div className="form-group">
            <label>Vaše ime</label>
            <input
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Ime i prezime"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>

          <button
            className={styles.joinBtn}
            onClick={handleJoin}
            disabled={!driverId.trim() || !driverName.trim()}
          >
            Aktiviraj GPS 📡
          </button>

          {onBack && (
            <button className={styles.backBtn} onClick={onBack}>
              ◀ Nazad
            </button>
          )}

          <p className={styles.note}>
            Server: <code>{SERVER_URL}</code><br />
            Promeni u <code>src/pages/DriverPage.jsx</code> ili postavi<br />
            <code>VITE_SERVER_URL</code> u <code>.env</code> fajlu.
          </p>
        </div>
      </div>
    );
  }

  // Ekran za aktivnog vozača
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.driverHeader}>
          <div>
            <div className={styles.driverName}>{driverName}</div>
            <div className={styles.driverId}>ID: {driverId}</div>
          </div>
          <div className={`${styles.connDot} ${connected ? styles.connOk : styles.connOff}`}>
            {connected ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>

        {/* GPS info */}
        <div className={`${styles.gpsBox} ${sending ? styles.gpsPulse : ''}`}>
          {gps ? (
            <>
              <div className={styles.gpsIcon}>📡</div>
              <div className={styles.gpsCoords}>
                <span>{gps.lat.toFixed(6)}</span>
                <span>{gps.lng.toFixed(6)}</span>
              </div>
              <div className={styles.gpsAcc}>Tačnost: ±{gps.accuracy}m</div>
              {lastSent && <div className={styles.gpsSent}>Poslednje slanje: {lastSent}</div>}
            </>
          ) : gpsErr ? (
            <div className={styles.gpsErr}>{gpsErr}</div>
          ) : (
            <div className={styles.gpsLoading}>⏳ Čekam GPS signal…</div>
          )}
        </div>

        {/* Status izbor */}
        <div className={styles.statusLabel}>Moj status:</div>
        <div className={styles.statusBtns}>
          {['slobodan', 'zauzet', 'offline'].map((s) => (
            <button
              key={s}
              className={`${styles.statusBtn} ${status === s ? styles[s] : ''}`}
              onClick={() => changeStatus(s)}
            >
              {{ slobodan: '✅ Slobodan', zauzet: '🔴 Zauzet', offline: '⚫ Offline' }[s]}
            </button>
          ))}
        </div>

        {/* Info */}
        <div className={styles.infoRow}>
          <span>📍 Lokacija se šalje svakih {GPS_INTERVAL_MS / 1000}s</span>
        </div>

        {/* Odjava */}
        <button className={styles.leaveBtn} onClick={handleLeave}>
          Završi smenu 🔒
        </button>
      </div>
    </div>
  );
}
