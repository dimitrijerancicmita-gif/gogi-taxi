import { useState } from 'react';
import { ADMIN_PIN } from '../constants/index.js';
import styles from './LoginPage.module.css';

export default function LoginPage({ onLogin, onDriver }) {
  const [showPin, setShowPin] = useState(false);
  const [pin,     setPin]     = useState('');
  const [pinErr,  setPinErr]  = useState(false);

  const closePin = () => { setShowPin(false); setPin(''); setPinErr(false); };

  const tryAdmin = () => {
    if (pin === ADMIN_PIN) { onLogin('admin'); }
    else {
      setPinErr(true); setPin('');
      setTimeout(() => setPinErr(false), 2000);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.bgGlow} />
      <div className={styles.bgGrid} />

      <div className={styles.card}>
        <div className={styles.logoOuter}>
          <div className={styles.hex}>SD</div>
          <h1 className={styles.title}>GOGI TAXI</h1>
          <p  className={styles.city}>Smederevo · Srbija · 2026</p>
        </div>

        <p className={styles.tagline}>"Gde god da kreneš, ovaj broj okreneš"</p>

        <div className={styles.btns}>
          <button className={styles.btnCustomer} onClick={() => onLogin('customer')}>
            🚖&nbsp; Naruči Taksi
          </button>
          <button className={styles.btnAdmin} onClick={() => setShowPin(true)}>
            ⚙️&nbsp; Dispečer / Vozač
          </button>
        </div>

        <div className={styles.footer}>
          <span>📞 060/60-50-450</span>
          <span className={styles.dot}>·</span>
          <span>📞 061/60-52-519</span>
        </div>
      </div>

      {showPin && (
        <div className={styles.overlay} onClick={closePin}>
          <div className={styles.pinBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.pinTitle}>🔐 Pristup</h2>
            <p  className={styles.pinSub}>PIN kod za dispečer panel</p>
            <div className="form-group">
              <label>PIN</label>
              <input
                type="password" maxLength={4} value={pin}
                placeholder="• • • •" autoFocus
                style={{ textAlign:'center', fontSize:'22px', letterSpacing:'8px', fontFamily:'Rajdhani,sans-serif', fontWeight:700 }}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && tryAdmin()}
                className={pinErr ? 'error' : ''}
              />
              {pinErr && <p className={styles.pinError}>❌ Pogrešan PIN!</p>}
            </div>
            <div className={styles.pinBtns}>
              <button className={styles.cancel}  onClick={closePin}>Otkaži</button>
              <button className={styles.confirm} onClick={tryAdmin}>Prijava</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
