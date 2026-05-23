import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import styles from './DriverPage.module.css';

const SERVER_URL      = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
const GPS_INTERVAL_MS = 4_000;
const STORAGE_KEY     = 'gogi_driver_v';

/**
 * DriverPage — bez forme za prijavu.
 * Vozač bira samo svoje ime iz liste vozila i GPS kreće automatski.
 * Kad status → offline, GPS slanje prestaje.
 * Kad status → slobodan/zauzet, GPS se nastavlja.
 */
export default function DriverPage({ vehicles = [], onBack }) {
  const socketRef   = useRef(null);
  const watchRef    = useRef(null);
  const intervalRef = useRef(null);
  const latestPos   = useRef(null);
  const activeRef   = useRef(false); // da li treba slati GPS

  const savedId = localStorage.getItem(STORAGE_KEY) || '';

  const [selectedId, setSelectedId] = useState(savedId);
  const [started,    setStarted]    = useState(false);
  const [status,     setStatus]     = useState('slobodan');
  const [gps,        setGps]        = useState(null);
  const [gpsErr,     setGpsErr]     = useState(null);
  const [connected,  setConnected]  = useState(false);
  const [sending,    setSending]    = useState(false);
  const [lastSent,   setLastSent]   = useState(null);
  const [accuracy,   setAccuracy]   = useState(null);

  const selectedVehicle = vehicles.find(v => String(v.id) === String(selectedId));

  /* ── Socket setup (jednom) ──────────────────────────────── */
  useEffect(() => {
    const socket = io(SERVER_URL, { autoConnect: false });
    socketRef.current = socket;
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Auto-start ako postoji sačuvani ID i vozilo postoji
    if (savedId && vehicles.find(v => String(v.id) === String(savedId))) {
      startSession(socket, savedId);
    }

    return () => cleanup(socket);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Kad se status promeni — pauziraj/nastavi GPS ───────── */
  useEffect(() => {
    activeRef.current = (status !== 'offline');
    if (socketRef.current?.connected && selectedId) {
      socketRef.current.emit('driver:status', { driverId: String(selectedId), status });
    }
  }, [status, selectedId]);

  /* ── Start sesije ───────────────────────────────────────── */
  const startSession = (socket, id) => {
    const v = vehicles.find(v2 => String(v2.id) === String(id));
    if (!v) return;

    localStorage.setItem(STORAGE_KEY, String(id));
    activeRef.current = true;
    setStarted(true);

    socket.connect();
    socket.once('connect', () => {
      socket.emit('driver:join', { driverId: String(id), name: v.driver });
    });

    // GPS watchPosition — uvek prati, ali šalje samo kad active
    if (!navigator.geolocation) { setGpsErr('GPS nije podržan.'); return; }

    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        latestPos.current = pos;
        setGps(pos);
        setAccuracy(Math.round(coords.accuracy));
        setGpsErr(null);
      },
      err => setGpsErr(err.message),
      { enableHighAccuracy: true, maximumAge: 3_000 }
    );

    // Interval koji šalje lokaciju — preskače kad offline
    intervalRef.current = setInterval(() => {
      const pos = latestPos.current;
      if (!pos || !socket.connected || !activeRef.current) return;
      socket.emit('driver:location', { driverId: String(id), lat: pos.lat, lng: pos.lng });
      setSending(true);
      setLastSent(new Date().toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTimeout(() => setSending(false), 500);
    }, GPS_INTERVAL_MS);
  };

  const handleStart = () => {
    if (!selectedId) return;
    startSession(socketRef.current, selectedId);
  };

  /* ── Odjava ─────────────────────────────────────────────── */
  const handleStop = () => {
    cleanup(socketRef.current);
    localStorage.removeItem(STORAGE_KEY);
    setStarted(false);
    setGps(null);
    setConnected(false);
    setLastSent(null);
    activeRef.current = false;
  };

  const cleanup = (socket) => {
    if (socket?.connected) {
      socket.emit('driver:leave', { driverId: String(selectedId) });
      socket.disconnect();
    }
    if (watchRef.current    != null) navigator.geolocation.clearWatch(watchRef.current);
    if (intervalRef.current != null) clearInterval(intervalRef.current);
    watchRef.current    = null;
    intervalRef.current = null;
  };

  /* ── UI: biranje vozila ─────────────────────────────────── */
  if (!started) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.logo}>📡</div>
          <h2 className={styles.title}>Odaberi svoje vozilo</h2>
          <p  className={styles.sub}>GPS će krenuti automatski</p>

          <div className={styles.vehicleList}>
            {vehicles.filter(v => v.status !== 'offline').map(v => (
              <button
                key={v.id}
                className={`${styles.vehicleBtn} ${String(selectedId) === String(v.id) ? styles.vehicleSel : ''}`}
                onClick={() => setSelectedId(String(v.id))}
              >
                <span className={styles.vIcon}>🚖</span>
                <span className={styles.vName}>{v.driver}</span>
                <span className={styles.vCar}>{v.name}</span>
                <span className={`status-badge ${v.status}`} style={{marginLeft:'auto'}}>
                  {v.status === 'slobodan' ? 'Slobodan' : 'Zauzet'}
                </span>
              </button>
            ))}
            {vehicles.filter(v => v.status !== 'offline').length === 0 && (
              <p className={styles.noV}>Nema aktivnih vozila. Dodaj vozilo u panel.</p>
            )}
          </div>

          <button
            className={styles.startBtn}
            onClick={handleStart}
            disabled={!selectedId}
          >
            🚀 Pokreni GPS praćenje
          </button>

          {onBack && (
            <button className={styles.backBtn} onClick={onBack}>◀ Nazad</button>
          )}
        </div>
      </div>
    );
  }

  /* ── UI: aktivni GPS ────────────────────────────────────── */
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.driverHeader}>
          <div>
            <div className={styles.driverName}>{selectedVehicle?.driver || '—'}</div>
            <div className={styles.driverId}>{selectedVehicle?.name}</div>
          </div>
          <div className={`${styles.connDot} ${connected ? styles.connOk : styles.connOff}`}>
            {connected ? '🟢 Povezan' : '🔴 Offline'}
          </div>
        </div>

        {/* GPS box */}
        <div className={`${styles.gpsBox} ${sending ? styles.gpsPulse : ''} ${status === 'offline' ? styles.gpsOff : ''}`}>
          {status === 'offline' ? (
            <div className={styles.gpsLoading}>⏸ GPS pauziran — status je Offline</div>
          ) : gps ? (
            <>
              <div className={styles.gpsIcon}>📡</div>
              <div className={styles.gpsCoords}>
                <span>{gps.lat.toFixed(6)}</span>
                <span>{gps.lng.toFixed(6)}</span>
              </div>
              <div className={styles.gpsAcc}>Tačnost: ±{accuracy}m</div>
              {lastSent && <div className={styles.gpsSent}>⬆ Poslato: {lastSent}</div>}
            </>
          ) : gpsErr ? (
            <div className={styles.gpsErr}>⚠ {gpsErr}</div>
          ) : (
            <div className={styles.gpsLoading}>⏳ Čekam GPS signal…</div>
          )}
        </div>

        {/* Status */}
        <div className={styles.statusLabel}>Moj status:</div>
        <div className={styles.statusBtns}>
          {[
            { key: 'slobodan', label: '✅ Slobodan' },
            { key: 'zauzet',   label: '🔴 Zauzet'   },
            { key: 'offline',  label: '⏸ Offline'   },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.statusBtn} ${status === key ? styles[key] : ''}`}
              onClick={() => setStatus(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.infoRow}>
          {status !== 'offline'
            ? `📡 Lokacija se šalje svakih ${GPS_INTERVAL_MS / 1000}s`
            : '⏸ Slanje zaustavljeno dok si Offline'}
        </div>

        <button className={styles.stopBtn} onClick={handleStop}>
          Završi smenu 🔒
        </button>
      </div>
    </div>
  );
}
