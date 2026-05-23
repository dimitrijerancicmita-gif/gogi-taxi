import { useState } from 'react';
import LoginPage  from './pages/LoginPage.jsx';
import MapPage    from './pages/MapPage.jsx';
import AdminPage  from './pages/AdminPage.jsx';
import DriverPage from './pages/DriverPage.jsx';
import TestPage   from './pages/TestPage.jsx';
import { INIT_VEHICLES } from './constants/index.js';

const params      = new URLSearchParams(window.location.search);
const isDriverURL = params.get('driver') === 'true';
const isTestURL   = params.get('test')   === 'true';

export default function App() {
  const [screen,   setScreen]   = useState(
    isTestURL   ? 'test'   :
    isDriverURL ? 'driver' : 'login'
  );
  const [role,     setRole]     = useState(null);
  const [vehicles, setVehicles] = useState(INIT_VEHICLES);
  const [orders,   setOrders]   = useState([]);

  if (screen === 'test')
    return <TestPage onBack={() => setScreen('login')} />;

  if (screen === 'driver')
    return <DriverPage vehicles={vehicles} onBack={() => setScreen('login')} />;

  if (screen === 'login')
    return (
      <LoginPage
        onLogin={r => { setRole(r); setScreen('map'); }}
        onDriver={() => setScreen('driver')}
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
