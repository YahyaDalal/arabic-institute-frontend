import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { confirmPasswordReset } from '../../api/auth';

export default function ResetPasswordConfirmPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ password: '', password2: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(token, form.password);
      navigate('/login');
    } catch (err) {
      setError('Invalid or expired reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Arabic Institute</h1>
        <h2 style={styles.subtitle}>Set New Password</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} type="password" placeholder="New password"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <input style={styles.input} type="password" placeholder="Confirm new password"
            value={form.password2} onChange={e => setForm({ ...form, password2: e.target.value })} required />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p style={styles.links}><Link to="/login">Back to login</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' },
  card: { backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  title: { margin: '0 0 4px', color: '#1a1a2e' },
  subtitle: { margin: '0 0 24px', color: '#666', fontWeight: 'normal' },
  error: { color: 'red', marginBottom: '16px' },
  input: { display: 'block', width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' },
  links: { textAlign: 'center', marginTop: '16px' }
};