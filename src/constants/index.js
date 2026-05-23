// ─── Map ────────────────────────────────────────────────────────────────────
/** Default map center: Smederevo, Serbia */
export const MAP_CENTER = [44.6641, 20.9278];
export const MAP_ZOOM   = 14;

// ─── Auth ────────────────────────────────────────────────────────────────────
/**
 * Hardcoded admin PIN.
 * In production replace with a real auth system (JWT, Firebase Auth, etc.)
 */
export const ADMIN_PIN = '1234';

// ─── Status metadata ─────────────────────────────────────────────────────────
export const STATUS_META = {
  slobodan: { label: 'Slobodan', color: '#22d160', dimBg: '#0a3a1a' },
  zauzet:   { label: 'Zauzet',   color: '#ef4444', dimBg: '#3a0a0a' },
  offline:  { label: 'Offline',  color: '#6b7280', dimBg: '#1a1a1a' },
};

// ─── Seed data ────────────────────────────────────────────────────────────────
export const INIT_VEHICLES = [
  {
    id: 1,
    name:   'KIA Ceed',
    driver: 'Gogi',
    phone:  '060/60-50-450',
    lat:    44.6641,
    lng:    20.9278,
    status: 'slobodan',
  },
  {
    id: 2,
    name:   'Renault Scenic',
    driver: 'Marko',
    phone:  '061/60-52-519',
    lat:    44.6720,
    lng:    20.9390,
    status: 'slobodan',
  },
  {
    id: 3,
    name:   'Audi A4',
    driver: 'Petar',
    phone:  '060/60-50-451',
    lat:    44.6560,
    lng:    20.9180,
    status: 'zauzet',
  },
];

// ─── Map tile layer ───────────────────────────────────────────────────────────
/** CartoDB dark tiles — perfect for the night-dispatch aesthetic */
export const TILE_URL        = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>';
