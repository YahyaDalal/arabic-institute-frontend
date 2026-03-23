import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ProtectedRoute from '../components/ProtectedRoute';

// Mock the auth context
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children,
}));

// Mock the API calls
vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getProfile: vi.fn(),
}));

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import { useAuth } from '../context/AuthContext';
import { login, register } from '../api/auth';
import client from '../api/client';

describe('LoginPage', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      loginUser: vi.fn(),
      user: null,
      loading: false,
    });
  });

  it('renders login form correctly', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    login.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'wrong@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });
  });

  it('calls login API with correct credentials', async () => {
    login.mockResolvedValue({ data: { access: 'fake-token' } });
    client.get.mockResolvedValue({ data: { role: 'student', email: 'test@test.com' } });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Pass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'Pass123!',
      });
    });
  });
});

describe('RegisterPage', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      loginUser: vi.fn(),
      user: null,
      loading: false,
    });
  });

  it('renders register form correctly', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    register.mockRejectedValue({
      response: { data: { password: ['Passwords do not match.'] } },
    });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Pass123!' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'Wrong123!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });
  });

  it('redirects to login on successful registration', async () => {
    register.mockResolvedValue({ data: {} });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Pass123!' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'Pass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(expect.objectContaining({
        email: 'new@test.com',
        username: 'newuser',
      }));
    });
  });
});

describe('ProtectedRoute', () => {
  it('redirects to login when user is not authenticated', () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter initialEntries={['/student']}>
        <ProtectedRoute allowedRoles={['student']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user has correct role', () => {
    useAuth.mockReturnValue({
      user: { role: 'student', email: 'student@test.com' },
      loading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['student']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

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
});