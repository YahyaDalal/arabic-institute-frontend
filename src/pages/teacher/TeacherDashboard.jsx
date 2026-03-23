import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCohorts } from '../../api/courses';
import { getCohortEnrolments, updateEnrolment } from '../../api/enrolments';
import { issueCertificate, getAllCertificates } from '../../api/certificates';

export default function TeacherDashboard() {
  const { user, logoutUser } = useAuth();
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [enrolments, setEnrolments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activeTab, setActiveTab] = useState('cohorts');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadCohorts();
    loadCertificates();
  }, []);

  const loadCohorts = async () => {
    try {
      const { data } = await getCohorts();
      setCohorts(data);
    } catch { setError('Failed to load cohorts.'); }
  };

  const loadCertificates = async () => {
    try {
      const { data } = await getAllCertificates();
      setCertificates(data);
    } catch { setError('Failed to load certificates.'); }
  };

  const loadEnrolments = async (cohortId) => {
    try {
      const { data } = await getCohortEnrolments(cohortId);
      setEnrolments(data);
      setSelectedCohort(cohortId);
      setActiveTab('enrolments');
    } catch { setError('Failed to load enrolments.'); }
  };

  const startEdit = (enrolment) => {
    setEditingId(enrolment.id);
    setEditForm({
      attendance_percentage: enrolment.attendance_percentage,
      final_grade: enrolment.final_grade ?? '',
      fees_paid: enrolment.fees_paid,
      teacher_approved: enrolment.teacher_approved,
    });
  };

  const handleUpdate = async (id) => {
    setError(''); setMessage('');
    try {
      await updateEnrolment(id, editForm);
      setMessage('Enrolment updated successfully.');
      setEditingId(null);
      loadEnrolments(selectedCohort);
    } catch { setError('Failed to update enrolment.'); }
  };

  const handleIssueCertificate = async (enrolmentId) => {
    setError(''); setMessage('');
    try {
      await issueCertificate(enrolmentId);
      setMessage('Certificate issued successfully.');
      loadEnrolments(selectedCohort);
      loadCertificates();
    } catch (err) {
      const data = err.response?.data;
      const messages = data ? Object.values(data).flat().join(' ') : 'Failed to issue certificate.';
      setError(messages);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Teacher Dashboard</h1>
        <div>
          <span style={styles.userInfo}>{user?.email}</span>
          <button onClick={logoutUser} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button style={activeTab === 'cohorts' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('cohorts')}>My Cohorts</button>
        <button style={activeTab === 'enrolments' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('enrolments')}>Enrolments</button>
        <button style={activeTab === 'certificates' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('certificates')}>Certificates</button>
      </div>

      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}

      {activeTab === 'cohorts' && (
        <div>
          <h2>All Cohorts</h2>
          {cohorts.map(cohort => (
            <div key={cohort.id} style={styles.card}>
              <div style={styles.cardRow}>
                <div>
                  <strong>{cohort.course_title}</strong>
                  <p style={styles.meta}>
                    {cohort.start_date} → {cohort.end_date} · 
                    Students: {cohort.current_enrolment_count}/{cohort.capacity}
                  </p>
                </div>
                <button style={styles.button} onClick={() => loadEnrolments(cohort.id)}>
                  View Enrolments
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'enrolments' && (
        <div>
          <h2>Cohort Enrolments</h2>
          {enrolments.length === 0 && <p>No enrolments in this cohort.</p>}
          {enrolments.map(enrolment => (
            <div key={enrolment.id} style={styles.card}>
              <div style={{ marginBottom: '8px' }}>
                <strong>{enrolment.student_email}</strong>
                <span style={styles.statusBadge}>{enrolment.status}</span>
              </div>

              {editingId === enrolment.id ? (
                <div style={styles.editForm}>
                  <label style={styles.label}>Attendance %</label>
                  <input style={styles.input} type="number" min="0" max="100"
                    value={editForm.attendance_percentage}
                    onChange={e => setEditForm({ ...editForm, attendance_percentage: e.target.value })} />
                  <label style={styles.label}>Final Grade</label>
                  <input style={styles.input} type="number" min="0" max="100"
                    value={editForm.final_grade}
                    onChange={e => setEditForm({ ...editForm, final_grade: e.target.value })} />
                  <label style={styles.checkLabel}>
                    <input type="checkbox" checked={editForm.fees_paid}
                      onChange={e => setEditForm({ ...editForm, fees_paid: e.target.checked })} />
                    {' '}Fees Paid
                  </label>
                  <label style={styles.checkLabel}>
                    <input type="checkbox" checked={editForm.teacher_approved}
                      onChange={e => setEditForm({ ...editForm, teacher_approved: e.target.checked })} />
                    {' '}Teacher Approved
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button style={styles.button} onClick={() => handleUpdate(enrolment.id)}>Save</button>
                    <button style={styles.secondaryBtn} onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={styles.meta}>
                    Attendance: {enrolment.attendance_percentage}% · 
                    Grade: {enrolment.final_grade ?? 'Not graded'} · 
                    Fees: {enrolment.fees_paid ? '✅' : '❌'} · 
                    Approved: {enrolment.teacher_approved ? '✅' : '❌'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button style={styles.editBtn} onClick={() => startEdit(enrolment)}>Edit</button>
                    {enrolment.can_issue_certificate && (
                      <button style={styles.certBtn} onClick={() => handleIssueCertificate(enrolment.id)}>
                        Issue Certificate
                      </button>
                    )}
                    {!enrolment.can_issue_certificate && (
                      <span style={styles.notEligible}>Not yet eligible for certificate</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'certificates' && (
        <div>
          <h2>Issued Certificates</h2>
          {certificates.length === 0 && <p>No certificates issued yet.</p>}
          {certificates.map(cert => (
            <div key={cert.id} style={styles.card}>
              <strong>{cert.student_email}</strong>
              <p style={styles.meta}>
                Course: {cert.course_title} · 
                Issued: {new Date(cert.issued_at).toLocaleDateString()}
              </p>
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
  statusBadge: { marginLeft: '8px', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', backgroundColor: '#e2e3e5' },
  button: { padding: '8px 16px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  secondaryBtn: { padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  editBtn: { padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  certBtn: { padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  notEligible: { fontSize: '13px', color: '#999', alignSelf: 'center' },
  editForm: { display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '300px' },
  input: { padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
  label: { fontSize: '13px', color: '#555' },
  checkLabel: { fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' },
  success: { color: 'green', marginBottom: '16px' },
  error: { color: 'red', marginBottom: '16px' },
};