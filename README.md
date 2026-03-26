# Arabic Institute Enterprise Frontend

The React client application for the Arabic Institute Enterprise Learning & Certification Platform. This repository forms the presentation layer of a three-layer enterprise architecture.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Security](#security)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Technical Decisions](#technical-decisions)
- [AI Usage](#ai-usage)

---

## Architecture Overview

This frontend is the presentation layer only. It never contains business logic or direct database access — all of that lives in the Django API.
```
┌─────────────────────────────────────┐
│           React Frontend            │  ← THIS REPO
│   Presentation · User Interaction   │
│   API calls only · No business logic│
└──────────────┬──────────────────────┘
               │ HTTP/REST (JWT)
               ▼
┌─────────────────────────────────────┐
│        Django REST Framework        │
│   (arabic-institute-api repo)       │
└─────────────────────────────────────┘
```

**Key principle:** The React app is responsible for display and user interaction only. Every validation rule, permission check, and business decision is enforced by the Django API.

---

## Technology Stack

| Component | Technology |
|---|---|
| Framework | React 18 (Vite) |
| Routing | React Router v6 |
| HTTP Client | Axios |
| State Management | React Context API |
| Testing | Vitest + React Testing Library |
| Coverage | @vitest/coverage-v8 (90%+) |
| Deployment | Render (Static Site) |

---

## Features

### Role-Based Dashboards
Three completely separate dashboards depending on the authenticated user's role:

| Role | Dashboard Features |
|---|---|
| Student | Browse cohorts, enrol, view enrolments, view certificates, manage profile |
| Teacher | View cohort rosters, update grades and attendance, issue certificates |
| Admin | Full course CRUD, cohort management, system overview |

### Authentication Flow
- JWT login with automatic token attachment on every request
- Token stored in `localStorage`, cleared on logout
- Refresh token blacklisted on logout via API call
- Automatic redirect to `/login` on 401 response

### Protected Routes
Role-aware route protection — students cannot access teacher or admin routes even if they manually type the URL.

### Password Reset Flow
Full end-to-end email-based password reset:
1. User requests reset → email sent via SendGrid
2. User clicks link → lands on confirm page with token in URL
3. User sets new password → redirected to login

### Profile Management
Users can update their bio, username, and upload a profile avatar which is stored on Cloudinary.

---

## Security

### JWT Token Handling
Tokens are attached to every outgoing request via an Axios interceptor — this is a single, centralised place for auth rather than manually adding headers everywhere:
```javascript
// src/api/client.js
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Automatic 401 Handling
If the API returns 401 (expired or invalid token), the user is automatically logged out and redirected to login:
```javascript
// src/api/client.js
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

### Token Blacklisting on Logout
On logout, the refresh token is sent to the API to be blacklisted — preventing reuse even if someone extracts it from localStorage:
```javascript
// src/context/AuthContext.jsx
const logoutUser = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  try {
    if (refreshToken) {
      await client.post('/api/auth/logout/', { refresh: refreshToken });
    }
  } catch (err) {
    console.log('Logout error:', err);
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    window.location.href = '/login';
  }
};
```

### Protected Routes with Role Enforcement
A single reusable component handles all route protection. If a student tries to access `/admin`, they are redirected — not shown an error:
```jsx
// src/components/ProtectedRoute.jsx
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
```

Used in the router like this — clean, readable, and declarative:
```jsx
// src/App.jsx
<Route path="/admin" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

---

## Separation of Concerns

### No Business Logic in React
All validation and business rules live in the Django API. The frontend simply displays what the API returns. For example, when a student tries to enrol in a full cohort, the API returns a `400` with an error message — the frontend just displays it:
```javascript
// src/pages/student/StudentDashboard.jsx
const handleEnrol = async (cohortId) => {
  try {
    await enrol(cohortId);
    setMessage('Successfully enrolled!');
    loadData();
  } catch (err) {
    // Display the server's validation message — no frontend validation logic
    const data = err.response?.data;
    const messages = data ? Object.values(data).flat().join(' ') : 'Enrolment failed.';
    setError(messages);
  }
};
```

### Centralised API Layer
All API calls are in `src/api/` — the dashboards never construct URLs or handle HTTP directly:
```javascript
// src/api/enrolments.js
export const enrol = (cohortId) =>
  client.post('/api/enrolments/', { cohort: cohortId });

export const getMyEnrolments = () =>
  client.get('/api/enrolments/my/');

export const updateEnrolment = (id, data) =>
  client.patch(`/api/enrolments/${id}/`, data);
```

This means if the API URL changes, it only needs updating in one place.

### AuthContext — Single Source of Truth
User state is managed in one place and shared across the entire app via React Context:
```javascript
// src/context/AuthContext.jsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On app load, restore session from token if it exists
    const token = localStorage.getItem('access_token');
    if (token) {
      getProfile()
        .then((r) => setUser(r.data))
        .catch(() => localStorage.removeItem('access_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);
  // ...
}
```

---

## Project Structure
```
arabic-institute-frontend/
├── public/
│   └── _redirects          # Render routing config for React Router
├── src/
│   ├── api/                # All HTTP calls — one file per domain
│   │   ├── client.js       # Axios instance with JWT interceptors
│   │   ├── auth.js         # Auth endpoints
│   │   ├── courses.js      # Course and cohort endpoints
│   │   ├── enrolments.js   # Enrolment endpoints
│   │   └── certificates.js # Certificate endpoints
│   ├── context/
│   │   └── AuthContext.jsx # Global auth state
│   ├── components/
│   │   └── ProtectedRoute.jsx # Role-aware route guard
│   ├── pages/
│   │   ├── auth/           # Login, Register, Reset Password pages
│   │   ├── student/        # Student dashboard
│   │   ├── teacher/        # Teacher dashboard
│   │   ├── admin/          # Admin dashboard
│   │   └── profile/        # Profile management page
│   └── test/
│       ├── setup.js        # Vitest + Testing Library setup
│       └── auth.test.jsx   # Auth and protected route tests
├── .env.example            # Environment variable template
├── vite.config.js          # Vite + Vitest configuration
└── package.json
```

---

## Setup & Installation

### Prerequisites
- Node.js 20+
- The Django API running locally (see arabic-institute-api repo)

### Local Development
```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/arabic-institute-frontend.git
cd arabic-institute-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

Make sure the Django API is running at `http://127.0.0.1:8000` before using the app.

---

## Environment Variables

Create a `.env` file in the root directory. Never commit this file.
```env
VITE_API_URL=http://127.0.0.1:8000
```

For production, Render uses:
```env
VITE_API_URL=https://arabic-institute-api.onrender.com
```

A `.env.example` file is included in the repository.

---

## Running Tests
```bash
# Run all tests
npm test

# Run with coverage report
npm run test -- --coverage

# Watch mode during development
npm run test:watch
```

### Test Structure
```
src/test/
├── setup.js          # Global test setup
└── auth.test.jsx     # Auth flow and protected route tests
```

### What is tested

| Test | What it verifies |
|---|---|
| Login form renders | Email, password fields and submit button present |
| Failed login shows error | API rejection displays user-facing error message |
| Login calls API correctly | Correct credentials passed to auth endpoint |
| Register form renders | All registration fields present |
| Password mismatch shows error | Frontend displays API validation error |
| Successful registration redirects | register API called with correct data |
| Unauthenticated route redirects | No user → redirected to /login |
| Correct role renders children | Student with student role sees protected content |
| Wrong role denied | Student cannot access admin-only route |

**Coverage: 90%+**

### Example — Testing Protected Route role enforcement
```jsx
// src/test/auth.test.jsx
it('denies access when user has wrong role', () => {
  useAuth.mockReturnValue({
    user: { role: 'student', email: 'student@test.com' },
    loading: false,
  });

  render(
    <MemoryRouter>
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Admin Only Content</div>
      </ProtectedRoute>
    </MemoryRouter>
  );

  expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
});
```

---

## Deployment

### Live URL
**https://arabic-institute-frontend.onrender.com**

### Render Deployment

Deployed as a Static Site on Render:

| Setting | Value |
|---|---|
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Environment Variable | `VITE_API_URL=https://arabic-institute-api.onrender.com` |

The `public/_redirects` file ensures React Router works correctly on Render:
```
/*    /index.html   200
```

### Scalability Consideration
As a static site, the frontend scales effortlessly — Render serves it from a CDN. The only scaling concern is the Django API, which can be scaled independently without touching the frontend at all. This is a direct benefit of the three-layer architecture.

---

## Technical Decisions

### Why Vite instead of Create React App?
Create React App is deprecated. Vite is the modern standard, offering significantly faster builds and hot module replacement. It is widely used in enterprise React projects in 2025/2026.

### Why Axios instead of fetch?
Axios provides interceptors — this allows us to attach JWT tokens and handle 401 errors in one centralised place rather than in every API call. It also provides cleaner error handling and automatic JSON parsing.

### Why React Context instead of Redux?
Redux adds significant complexity. For an application of this scale, React Context with `useState` is sufficient and keeps the codebase clean and understandable. If the application grew significantly, migrating to Redux or Zustand would be straightforward.

### Why inline styles instead of a CSS framework?
Keeps the dependencies minimal and makes the styling immediately visible in the component file. For a larger application, a component library like shadcn/ui or Tailwind would be appropriate.

---

## AI Usage

This project was developed with the assistance of Claude (Anthropic) as a coding guide and pair programming tool. Claude was used to:
- Suggest React architecture patterns
- Generate component boilerplate which was reviewed and modified
- Debug CORS and routing issues
- Suggest test cases

All code has been reviewed and understood, and i AM responsible for all implementation decisions and can explain any part of the codebase.