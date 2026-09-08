import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Login from './Login';

function renderLogin(authOverrides = {}) {
  const authValue = {
    user: null,
    loading: false,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...authOverrides,
  };
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );
  return authValue;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Login', () => {
  it('renders the email and password fields and a submit button', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('submits the entered credentials to the login function', async () => {
    const login = vi.fn().mockResolvedValue({});
    renderLogin({ login });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('alice@test.com', 'secret123'));
  });

  it('shows the server error message when login fails', async () => {
    const login = vi.fn().mockRejectedValue({ response: { data: { message: 'Invalid email or password' } } });
    renderLogin({ login });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('falls back to a generic translated error when the server gives no message', async () => {
    const login = vi.fn().mockRejectedValue(new Error('network down'));
    renderLogin({ login });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
  });
});
