import { useState } from 'react';
import styles from './OrderModal.module.css';

/**
 * OrderModal.jsx
 *
 * Customer order form. Collects:
 *   - name
 *   - phone
 *   - pickup address
 *
 * Shows count of free vehicles and warns if none are available.
 */
export default function OrderModal({ vehicles, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [err,  setErr]  = useState(false);

  const freeCount = vehicles.filter((v) => v.status === 'slobodan').length;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = () => {
    if (!form.name || !form.phone || !form.address) { setErr(true); return; }
    onSubmit(form);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🚖 Naruči Vozilo</h2>
        <p className={styles.sub}>
          Slobodnih vozila:&nbsp;
          <strong style={{ color: freeCount > 0 ? 'var(--green)' : 'var(--red)' }}>
            {freeCount}
          </strong>
          {freeCount === 0 && <span style={{ color: 'var(--red)' }}> — Sva zauzeta!</span>}
        </p>

        <div className="form-group">
          <label>Vaše ime *</label>
          <input
            value={form.name} onChange={update('name')}
            placeholder="Ime i prezime"
            className={err && !form.name ? 'error' : ''}
          />
        </div>
        <div className="form-group">
          <label>Broj telefona *</label>
          <input
            value={form.phone} onChange={update('phone')}
            placeholder="06x xxx xxxx" type="tel"
            className={err && !form.phone ? 'error' : ''}
          />
        </div>
        <div className="form-group">
          <label>Adresa polaska *</label>
          <input
            value={form.address} onChange={update('address')}
            placeholder="Ulica i broj, grad"
            className={err && !form.address ? 'error' : ''}
          />
        </div>

        {err && <p className={styles.errMsg}>Sva polja su obavezna.</p>}

        <div className={styles.btns}>
          <button className={styles.cancel}  onClick={onClose}>Otkaži</button>
          <button className={styles.confirm} onClick={handleSubmit}>
            Naruči 🚖
          </button>
        </div>
      </div>
    </div>
  );
}
