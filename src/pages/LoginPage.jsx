import { useState } from 'react';
import { api } from '../api';
import { saveAuth } from '../auth';

// Screen 1: log in and register in one form (register only adds the "full name" field).
export default function LoginPage({ onLoggedIn }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // Both endpoints return the same AuthResponse: { token, expiresAt, fullName, email, role }.
      const auth = isRegister
        ? await api('/api/auth/register', { method: 'POST', body: form })
        : await api('/api/auth/login', { method: 'POST', body: { email: form.email, password: form.password } });

      saveAuth(auth);
      onLoggedIn(auth);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Fills the form with a demo user - handy when showing the project.
  const fillDemo = (email, password = 'Customer123!') => setForm({ ...form, email, password });

  return (
    <section className="login">
      <div className="login-side">
        <h1>{isRegister ? 'Save your first seat.' : 'Welcome back.'}</h1>
        <p>Log in to book a seat. Your seat is held for you the moment the server confirms it.</p>
        <div className="demo">
          <span>Try a demo user</span>
          <button type="button" onClick={() => fillDemo('dana@hallplaces.com')}>Dana</button>
          <button type="button" onClick={() => fillDemo('ron@hallplaces.com')}>Ron</button>
          <button type="button" onClick={() => fillDemo('admin@hallplaces.com', 'Admin123!')}>Admin</button>
        </div>
      </div>

      <form onSubmit={submit}>
        {isRegister && (
          <label>
            Full name
            <input value={form.fullName} onChange={update('fullName')} required minLength={2} />
          </label>
        )}
        <label>
          Email
          <input type="email" value={form.email} onChange={update('email')} required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={update('password')} required
                 minLength={isRegister ? 6 : undefined} />
        </label>

        {error && <p className="alert error">{error}</p>}

        <button className="primary" disabled={busy}>{isRegister ? 'Create account' : 'Log in'}</button>
        <button type="button" className="link" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
          {isRegister ? 'Already have an account? Log in' : 'New here? Create an account'}
        </button>
      </form>
    </section>
  );
}
