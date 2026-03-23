import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCourses, createCourse, updateCourse, deleteCourse, getCohorts, createCohort } from '../../api/courses';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [activeTab, setActiveTab] = useState('courses');
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [courseForm, setCourseForm] = useState({ title: '', description: '', level: '', status: 'draft', pass_mark: 60 });
  const [cohortForm, setCohortForm] = useState({ course: '', start_date: '', end_date: '', capacity: 30, enrolment_open: true });
  const [editingCourse, setEditingCourse] = useState(null);

  useEffect(() => {
    loadCourses();
    loadCohorts();
  }, []);

  const loadCourses = async () => {
    try {
      const { data } = await getCourses();
      setCourses(data);
    } catch { setError('Failed to load courses.'); }
  };

  const loadCohorts = async () => {
    try {
      const { data } = await getCohorts();
      setCohorts(data);
    } catch { setError('Failed to load cohorts.'); }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await createCourse(courseForm);
      setCourseForm({ title: '', description: '', level: '', status: 'draft', pass_mark: 60 });
      loadCourses();
    } catch (err) {
      setError('Failed to create course.');
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      await updateCourse(editingCourse.id, editingCourse);
      setEditingCourse(null);
      loadCourses();
    } catch { setError('Failed to update course.'); }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await deleteCourse(id);
      loadCourses();
    } catch { setError('Failed to delete course.'); }
  };

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    try {
      await createCohort(cohortForm);
      setCohortForm({ course: '', start_date: '', end_date: '', capacity: 30, enrolment_open: true });
      loadCohorts();
    } catch (err) {
      setError('Failed to create cohort.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <div>
          <span style={styles.userInfo}>{user?.email}</span>
          <button onClick={() => navigate('/profile')} style={styles.profileBtn}>My Profile</button>
          <button onClick={logoutUser} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button style={activeTab === 'courses' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('courses')}>Courses</button>
        <button style={activeTab === 'cohorts' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('cohorts')}>Cohorts</button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {activeTab === 'courses' && (
        <div>
          <div style={styles.section}>
            <h2>Create Course</h2>
            <form onSubmit={handleCreateCourse} style={styles.form}>
              <input style={styles.input} placeholder="Title" value={courseForm.title}
                onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} required />
              <input style={styles.input} placeholder="Description" value={courseForm.description}
                onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} required />
              <input style={styles.input} placeholder="Level (e.g. A1)" value={courseForm.level}
                onChange={e => setCourseForm({ ...courseForm, level: e.target.value })} required />
              <select style={styles.input} value={courseForm.status}
                onChange={e => setCourseForm({ ...courseForm, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <input style={styles.input} type="number" placeholder="Pass mark" value={courseForm.pass_mark}
                onChange={e => setCourseForm({ ...courseForm, pass_mark: e.target.value })} required />
              <button style={styles.button} type="submit">Create Course</button>
            </form>
          </div>

          <div style={styles.section}>
            <h2>All Courses</h2>
            {courses.map(course => (
              <div key={course.id} style={styles.card}>
                {editingCourse?.id === course.id ? (
                  <form onSubmit={handleUpdateCourse}>
                    <input style={styles.input} value={editingCourse.title}
                      onChange={e => setEditingCourse({ ...editingCourse, title: e.target.value })} />
                    <input style={styles.input} value={editingCourse.description}
                      onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })} />
                    <select style={styles.input} value={editingCourse.status}
                      onChange={e => setEditingCourse({ ...editingCourse, status: e.target.value })}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button style={styles.button} type="submit">Save</button>
                    <button style={styles.secondaryBtn} type="button" onClick={() => setEditingCourse(null)}>Cancel</button>
                  </form>
                ) : (
                  <div style={styles.cardRow}>
                    <div>
                      <strong>{course.title}</strong>
                      <span style={styles.badge(course.status)}>{course.status}</span>
                      <p style={styles.meta}>Level: {course.level} · Pass mark: {course.pass_mark}%</p>
                    </div>
                    <div>
                      <button style={styles.editBtn} onClick={() => setEditingCourse(course)}>Edit</button>
                      <button style={styles.deleteBtn} onClick={() => handleDeleteCourse(course.id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'cohorts' && (
        <div>
          <div style={styles.section}>
            <h2>Create Cohort</h2>
            <form onSubmit={handleCreateCohort} style={styles.form}>
              <select style={styles.input} value={cohortForm.course}
                onChange={e => setCohortForm({ ...cohortForm, course: e.target.value })} required>
                <option value="">Select a course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input style={styles.input} type="date" placeholder="Start date" value={cohortForm.start_date}
                onChange={e => setCohortForm({ ...cohortForm, start_date: e.target.value })} required />
              <input style={styles.input} type="date" placeholder="End date" value={cohortForm.end_date}
                onChange={e => setCohortForm({ ...cohortForm, end_date: e.target.value })} required />
              <input style={styles.input} type="number" placeholder="Capacity" value={cohortForm.capacity}
                onChange={e => setCohortForm({ ...cohortForm, capacity: e.target.value })} required />
              <button style={styles.button} type="submit">Create Cohort</button>
            </form>
          </div>

          <div style={styles.section}>
            <h2>All Cohorts</h2>
            {cohorts.map(cohort => (
              <div key={cohort.id} style={styles.card}>
                <div style={styles.cardRow}>
                  <div>
                    <strong>{cohort.course_title}</strong>
                    <p style={styles.meta}>
                      {cohort.start_date} → {cohort.end_date} · 
                      Capacity: {cohort.current_enrolment_count}/{cohort.capacity} · 
                      {cohort.enrolment_open ? ' Open' : ' Closed'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
  profileBtn: { padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px' },
  tab: { padding: '8px 16px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  activeTab: { padding: '8px 16px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  section: { marginBottom: '32px' },
  form: { display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
  button: { padding: '10px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  secondaryBtn: { padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px' },
  editBtn: { padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  card: { backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', marginBottom: '12px' },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  meta: { margin: '4px 0 0', color: '#666', fontSize: '14px' },
  error: { color: 'red', marginBottom: '16px' },
  badge: (status) => ({
    marginLeft: '8px', padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
    backgroundColor: status === 'published' ? '#d4edda' : status === 'draft' ? '#fff3cd' : '#f8d7da',
    color: status === 'published' ? '#155724' : status === 'draft' ? '#856404' : '#721c24'
  }),
};