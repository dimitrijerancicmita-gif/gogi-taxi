import { useState } from 'react';
import LoginPage  from './pages/LoginPage.jsx';
import MapPage    from './pages/MapPage.jsx';
import AdminPage  from './pages/AdminPage.jsx';
import DriverPage from './pages/DriverPage.jsx';
import { INIT_VEHICLES } from './constants/index.js';

/**
 * App.jsx — Root component
 *
 * Screens:
 *   'login'  → LoginPage    (odabir uloge)
 *   'map'    → MapPage      (mušterija ili admin — vidi mapu)
 *   'admin'  → AdminPage    (upravljanje vozilima)
 *   'driver' → DriverPage   (vozač — šalje GPS)
 *
 * URL shortcut za vozača:  ?driver=true
 * npr: http://localhost:3000?driver=true
 */

const isDriverURL = new URLSearchParams(window.location.search).get('driver') === 'true';

export default function App() {
  const [screen,   setScreen]   = useState(isDriverURL ? 'driver' : 'login');
  const [role,     setRole]     = useState(null);
  const [vehicles, setVehicles] = useState(INIT_VEHICLES);
  const [orders,   setOrders]   = useState([]);

  if (screen === 'driver')
    return <DriverPage onBack={() => setScreen('login')} />;

  if (screen === 'login')
    return (
      <LoginPage
        onLogin={(r)  => { setRole(r); setScreen('map'); }}
        onDriver={()  => setScreen('driver')}
      />
    );

  if (screen === 'admin')
    return (
      <AdminPage
        vehicles={vehicles}
        setVehicles={setVehicles}
        orders={orders}
        onBack={() => setScreen('map')}
      />
    );

  return (
    <MapPage
      role={role}
      vehicles={vehicles}
      setVehicles={setVehicles}
      orders={orders}
      setOrders={setOrders}
      onOpenAdmin={() => setScreen('admin')}
      onLogout={() => { setRole(null); setScreen('login'); }}
    />
  );
}
