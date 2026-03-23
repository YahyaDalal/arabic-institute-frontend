import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCourses, getCohorts } from '../../api/courses';
import { getMyEnrolments, enrol, withdrawEnrolment } from '../../api/enrolments';
import { getMyCertificates } from '../../api/certificates';

export default function StudentDashboard() {
  const { user, logoutUser } = useAuth();
  const [cohorts, setCohorts] = useState([]);
  const [enrolments, setEnrolments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activeTab, setActiveTab] = useState('enrolments');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cohortsRes, enrolmentsRes, certsRes] = await Promise.all([
        getCohorts(),
        getMyEnrolments(),
        getMyCertificates(),
      ]);
      setCohorts(cohortsRes.data);
      setEnrolments(enrolmentsRes.data);
      setCertificates(certsRes.data);
    } catch { setError('Failed to load data.'); }
  };

  const handleEnrol = async (cohortId) => {
    setError(''); setMessage('');
    try {
      await enrol(cohortId);
      setMessage('Successfully enrolled!');
      loadData();
    } catch (err) {
      const data = err.response?.data;
      const messages = data ? Object.values(data).flat().join(' ') : 'Enrolment failed.';
      setError(messages);
    }
  };

  const handleWithdraw = async (enrolmentId) => {
    if (!window.confirm('Withdraw from this course?')) return;
    setError(''); setMessage('');
    try {
      await withdrawEnrolment(enrolmentId);
      setMessage('Successfully withdrawn.');
      loadData();
    } catch { setError('Could not withdraw.'); }
  };

  const isEnrolled = (cohortId) => enrolments.some(e => e.cohort === cohortId);

  const statusColor = (status) => ({
    active: '#d4edda', completed: '#cce5ff',
    failed: '#f8d7da', withdrawn: '#e2e3e5', pending: '#fff3cd'
  }[status] || '#f0f0f0');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Student Dashboard</h1>
        <div>
          <span style={styles.userInfo}>{user?.email}</span>
          <button onClick={logoutUser} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button style={activeTab === 'enrolments' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('enrolments')}>My Enrolments</button>
        <button style={activeTab === 'browse' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('browse')}>Browse Courses</button>
        <button style={activeTab === 'certificates' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('certificates')}>Certificates</button>
      </div>

      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}

      {activeTab === 'enrolments' && (
        <div>
          <h2>My Enrolments</h2>
          {enrolments.length === 0 && <p>You are not enrolled in any courses yet.</p>}
          {enrolments.map(enrolment => (
            <div key={enrolment.id} style={{ ...styles.card, borderLeft: `4px solid ${statusColor(enrolment.status)}` }}>
              <div style={styles.cardRow}>
                <div>
                  <strong>{enrolment.course_title}</strong>
                  <span style={{ ...styles.badge, backgroundColor: statusColor(enrolment.status) }}>
                    {enrolment.status}
                  </span>
                  <p style={styles.meta}>
                    Attendance: {enrolment.attendance_percentage}% · 
                    Grade: {enrolment.final_grade ?? 'Not yet graded'}
                  </p>
                  {enrolment.can_issue_certificate && (
                    <p style={{ color: 'green', fontSize: '14px' }}>✅ Eligible for certificate</p>
                  )}
                </div>
                {enrolment.status === 'active' && (
                  <button style={styles.deleteBtn} onClick={() => handleWithdraw(enrolment.id)}>Withdraw</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'browse' && (
        <div>
          <h2>Available Cohorts</h2>
          {cohorts.length === 0 && <p>No cohorts available.</p>}
          {cohorts.map(cohort => (
            <div key={cohort.id} style={styles.card}>
              <div style={styles.cardRow}>
                <div>
                  <strong>{cohort.course_title}</strong>
                  <p style={styles.meta}>
                    {cohort.start_date} → {cohort.end_date} · 
                    Spaces: {cohort.capacity - cohort.current_enrolment_count}/{cohort.capacity}
                  </p>
                  {cohort.is_full && <p style={{ color: 'red', fontSize: '14px' }}>Full</p>}
                </div>
                {!isEnrolled(cohort.id) && !cohort.is_full && cohort.enrolment_open && (
                  <button style={styles.button} onClick={() => handleEnrol(cohort.id)}>Enrol</button>
                )}
                {isEnrolled(cohort.id) && <span style={{ color: 'green' }}>✅ Enrolled</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'certificates' && (
        <div>
          <h2>My Certificates</h2>
          {certificates.length === 0 && <p>No certificates yet.</p>}
          {certificates.map(cert => (
            <div key={cert.id} style={styles.card}>
              <strong>{cert.course_title}</strong>
              <p style={styles.meta}>Issued: {new Date(cert.issued_at).toLocaleDateString()}</p>
              {cert.file_url && <a href={cert.file_url} target="_blank" rel="noreferrer">View Certificate</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { margin: 0, color: '#1a1a2e' },
  userInfo: { marginRight: '12px', color: '#666' },
  logoutBtn: { padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px' },
  tab: { padding: '8px 16px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  activeTab: { padding: '8px 16px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  card: { backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', marginBottom: '12px' },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  meta: { margin: '4px 0 0', color: '#666', fontSize: '14px' },
  badge: { marginLeft: '8px', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' },
  button: { padding: '8px 16px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  success: { color: 'green', marginBottom: '16px' },
  error: { color: 'red', marginBottom: '16px' },
};