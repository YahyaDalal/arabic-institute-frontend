import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, uploadAvatar } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', bio: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await getProfile();
      setForm({ username: data.username, bio: data.bio || '' });
      setAvatarUrl(data.avatar_url);
    } catch { setError('Failed to load profile.'); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    setLoading(true);
    try {
      await updateProfile(form);
      setMessage('Profile updated successfully.');
    } catch { setError('Failed to update profile.'); }
    finally { setLoading(false); }
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!avatarFile) return;
    setError(''); setMessage('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const { data } = await uploadAvatar(formData);
      setAvatarUrl(data.avatar_url);
      setMessage('Avatar uploaded successfully.');
    } catch { setError('Failed to upload avatar.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Profile</h1>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
      </div>

      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.card}>
        <h2>Avatar</h2>
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt="Avatar"
            style={styles.avatar}
          />
        )}
        <form onSubmit={handleAvatarUpload} style={styles.form}>
          <input
            type="file"
            accept="image/*"
            onChange={e => setAvatarFile(e.target.files[0])}
            style={styles.fileInput}
          />
          <button style={styles.button} type="submit" disabled={loading || !avatarFile}>
            {loading ? 'Uploading...' : 'Upload Avatar'}
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <h2>Edit Profile</h2>
        <form onSubmit={handleUpdateProfile} style={styles.form}>
          <label style={styles.label}>Username</label>
          <input style={styles.input} type="text" value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })} />
          <label style={styles.label}>Bio</label>
          <textarea style={{ ...styles.input, height: '80px' }} value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })} />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { margin: 0, color: '#1a1a2e' },
  backBtn: { padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  card: { backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', marginBottom: '16px' },
  avatar: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', display: 'block' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '13px', color: '#555', fontWeight: 'bold' },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
  fileInput: { fontSize: '14px' },
  button: { padding: '10px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  success: { color: 'green', marginBottom: '16px' },
  error: { color: 'red', marginBottom: '16px' },
};