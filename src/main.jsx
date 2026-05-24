import React from 'react';
import ReactDOM from 'react-dom/client';
import L from 'leaflet';
import App from './App.jsx';
import './styles/global.css';

/**
 * Leaflet u Vite-u ne može da nađe default marker slike automatski.
 * Ovo ih eksplicitno postavlja da nema broken image ikonice na mapi.
 */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
