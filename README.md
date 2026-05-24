# 🚖 SD Gogi Taxi — Live Dispatch & Tracking

React + Vite web aplikacija za praćenje taxi vozila u realnom vremenu.  
Dark gold tema. Socket.io live GPS. Leaflet mapa.

---

## 🚀 Pokretanje — korak po korak

### Korak 1 — Frontend (React app)

```bash
cd sd-gogi-taxi
npm install
npm run dev
# → http://localhost:3000
```

### Korak 2 — Backend (Socket.io server)

```bash
cd sd-gogi-taxi/taxi-server
npm install
node server.js
# → Server radi na http://localhost:4000
```

### Korak 3 — Podesi .env

U fajlu `.env` u root folderu promeni URL servera:

```env
VITE_SERVER_URL=http://localhost:4000
```

Za produkciju (Railway/Render):
```env
VITE_SERVER_URL=https://tvoj-server.up.railway.app
```

---

## 👥 Uloge i pristup

| Uloga      | Kako                    | Može                                      |
|------------|-------------------------|-------------------------------------------|
| Mušterija  | Klik "Naruči Taksi"     | Vidi vozila na mapi, naručuje             |
| Dispečer   | PIN: `1234`             | Sve + dodaj/ukloni vozila, menja status   |
| Vozač      | Klik "Ja sam Vozač"     | Šalje live GPS lokaciju na mapu           |

> ⚠️ PIN promeni u `src/constants/index.js` pre produkcije!

---

## 📡 URL shortcut za vozača

Vozač može direktno otvoriti svoju stranicu bez login ekrana:

```
http://localhost:3000?driver=true
```

Ovo je korisno ako vozaču pošalješ link na telefon — odmah se otvori GPS ekran.

---

## 🗺️ Kako GPS radi

```
Vozačev telefon
  → navigator.geolocation.watchPosition()
    → socket.emit('driver:location', { driverId, lat, lng })
      → taxi-server/server.js
        → io.emit('driver:updated', { driverId, lat, lng })
          → MapPage.jsx prima i pomera marker na mapi ✅
```

```
Mušterija otvori app
  → GPS dot (plavi krug) = njena lokacija
  → 🚖 markeri = live lokacije vozača
  → "Naruči" → pronalazi NAJBLIŽE slobodno vozilo od korisnika
```

---

## 🗂️ Struktura projekta

```
sd-gogi-taxi/
├── .env                        ← VITE_SERVER_URL (podesi ovo!)
├── .env.example
├── index.html
├── package.json                ← react, leaflet, socket.io-client, vite
├── vite.config.js
│
├── taxi-server/                ← Node.js backend
│   ├── server.js               ← Express + Socket.io
│   └── package.json            ← express, socket.io, cors
│
└── src/
    ├── main.jsx
    ├── App.jsx                 ← routing: login/map/admin/driver
    ├── styles/global.css
    ├── constants/index.js      ← seed data, PIN, tile URL
    ├── utils/geo.js            ← Haversine, nearestFreeVehicle, ETA
    │
    ├── pages/
    │   ├── LoginPage.jsx       ← 3 dugmeta: Mušterija / Dispečer / Vozač
    │   ├── MapPage.jsx         ← Leaflet + Socket.io live update
    │   ├── AdminPage.jsx       ← Upravljanje vozilima
    │   └── DriverPage.jsx      ← GPS ekran za vozača (šalje lokaciju)
    │
    └── components/
        ├── Sidebar.jsx
        ├── VehicleCard.jsx
        ├── OrderCard.jsx
        ├── OrderModal.jsx
        └── Notification.jsx
```

---

## 🌐 Hostovanje (besplatno)

### Frontend → Vercel / Netlify

```bash
npm run build
# Upload /dist folder na Vercel ili Netlify
```

### Backend → Railway.app

1. Napravi nalog na [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Baci `taxi-server/` folder na GitHub
4. Railway automatski detektuje Node.js i pokrene `node server.js`
5. Kopiraj Railway URL → stavi u `.env` kao `VITE_SERVER_URL`

---

## 🔒 Za produkciju — checklista

- [ ] Promeni `ADMIN_PIN` u `src/constants/index.js`
- [ ] Postavi `VITE_SERVER_URL` na pravi server URL
- [ ] U `taxi-server/server.js` promeni `cors origin: '*'` na svoju domenu
- [ ] Koristiti HTTPS (Railway/Vercel/Netlify daju automatski)
- [ ] Svaki vozač ima jedinstven `driverId`

---

## 📞 Kontakt

- 📞 060/60-50-450  
- 📞 061/60-52-519  
- 📍 Smederevo, Srbija
