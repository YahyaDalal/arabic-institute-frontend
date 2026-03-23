import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../api/auth';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setSent(true); // Show same message to avoid user enumeration
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Arabic Institute</h1>
        <h2 style={styles.subtitle}>Reset Password</h2>
        {sent ? (
          <div>
            <p style={{ color: 'green' }}>If that email exists, a reset link has been sent.</p>
            <p><Link to="/login">Back to login</Link></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input style={styles.input} type="email" placeholder="Your email address"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p style={styles.links}><Link to="/login">Back to login</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' },
  card: { backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  title: { margin: '0 0 4px', color: '#1a1a2e' },
  subtitle: { margin: '0 0 24px', color: '#666', fontWeight: 'normal' },
  input: { display: 'block', width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' },
  links: { textAlign: 'center', marginTop: '16px' }
};