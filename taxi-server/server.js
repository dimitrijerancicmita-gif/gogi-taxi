/**
 * taxi-server/server.js
 *
 * Node.js + Socket.io backend za SD Gogi Taxi.
 *
 * Pokretanje:
 *   cd taxi-server
 *   npm install
 *   node server.js
 *
 * Events koji stižu OD klijenta:
 *   driver:join     { driverId, name }          — vozač se prijavljuje
 *   driver:location { driverId, lat, lng }       — vozač šalje GPS
 *   driver:status   { driverId, status }         — vozač menja status
 *   driver:leave    { driverId }                 — vozač se odjavljuje
 *
 * Events koje server ŠALJE klijentima:
 *   drivers:snapshot  [ ...driver ]              — ceo spisak vozača (pri konekciji)
 *   driver:updated    { driverId, lat, lng, ... }— jedan vozač se promenio
 *   driver:removed    { driverId }               — vozač se odjavio
 */

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',          // u produkciji stavi svoju domenu
    methods: ['GET', 'POST'],
  },
});

// ── In-memory store za aktivne vozače ────────────────────────
// { [driverId]: { driverId, name, lat, lng, status, socketId, lastSeen } }
const drivers = {};

// ── REST health-check endpoint ────────────────────────────────
app.use(cors());
app.get('/', (_req, res) => res.json({ status: 'ok', drivers: Object.keys(drivers).length }));

// ── Socket.io ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] konekcija: ${socket.id}`);

  // 1. Pošalji novom klijentu trenutni snimak svih vozača
  socket.emit('drivers:snapshot', Object.values(drivers));

  // 2. Vozač se prijavljuje
  socket.on('driver:join', ({ driverId, name }) => {
    drivers[driverId] = {
      driverId,
      name,
      lat:      null,
      lng:      null,
      status:   'slobodan',
      socketId: socket.id,
      lastSeen: Date.now(),
    };
    socket.driverId = driverId;
    console.log(`  vozač prijavljeni: ${name} (${driverId})`);

    // Obavesti sve klijente
    io.emit('driver:updated', drivers[driverId]);
  });

  // 3. Vozač šalje GPS lokaciju
  socket.on('driver:location', ({ driverId, lat, lng }) => {
    if (!drivers[driverId]) return;
    drivers[driverId].lat      = lat;
    drivers[driverId].lng      = lng;
    drivers[driverId].lastSeen = Date.now();

    // Broadcast svima (musteri i admini vide pomak)
    io.emit('driver:updated', drivers[driverId]);
  });

  // 4. Vozač menja status (slobodan / zauzet / offline)
  socket.on('driver:status', ({ driverId, status }) => {
    if (!drivers[driverId]) return;
    drivers[driverId].status = status;
    io.emit('driver:updated', drivers[driverId]);
  });

  // 5. Vozač se odjavljuje (ili izgubi konekciju)
  const removeDriver = () => {
    const id = socket.driverId;
    if (!id || !drivers[id]) return;
    console.log(`  vozač otišao: ${drivers[id].name}`);
    delete drivers[id];
    io.emit('driver:removed', { driverId: id });
  };

  socket.on('driver:leave',   removeDriver);
  socket.on('disconnect',     removeDriver);
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚖 SD Gogi Taxi server radi na portu ${PORT}`);
  console.log(`   http://localhost:${PORT}\n`);
});
