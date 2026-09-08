import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function renderProtected({ authValue, roles, initialEntry = '/protected' }) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<ProtectedRoute roles={roles} />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  it('renders nothing while auth state is still loading', () => {
    const { container } = renderProtected({ authValue: { loading: true, isAuthenticated: false, user: null } });
    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to /login when the user is not authenticated', () => {
    renderProtected({ authValue: { loading: false, isAuthenticated: false, user: null } });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders the protected content when authenticated with no role restriction', () => {
    renderProtected({
      authValue: { loading: false, isAuthenticated: true, user: { id: '1', role: 'student' } },
    });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /dashboard when the user role is not in the allowed roles', () => {
    renderProtected({
      authValue: { loading: false, isAuthenticated: true, user: { id: '1', role: 'student' } },
      roles: ['admin', 'instructor'],
    });
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('renders the protected content when the user role is allowed', () => {
    renderProtected({
      authValue: { loading: false, isAuthenticated: true, user: { id: '1', role: 'admin' } },
      roles: ['admin', 'instructor'],
    });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
