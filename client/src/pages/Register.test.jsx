import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Register from './Register';

function renderRegister(authOverrides = {}) {
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
        <Register />
      </MemoryRouter>
    </AuthContext.Provider>
  );
  return authValue;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Register', () => {
  it('renders name, email, password, and role fields', () => {
    renderRegister();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('defaults the role to student', () => {
    renderRegister();
    expect(screen.getByRole('combobox')).toHaveValue('student');
  });

  it('enforces a minimum password length via the input constraint', () => {
    renderRegister();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('minlength', '6');
  });

  it('submits the form data to the register function, including the chosen role', async () => {
    const register = vi.fn().mockResolvedValue({});
    renderRegister({ register });

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bob@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'instructor' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith('Bob', 'bob@test.com', 'password123', 'instructor')
    );
  });

  it('shows the server error message when registration fails', async () => {
    const register = vi.fn().mockRejectedValue({ response: { data: { message: 'Email already in use' } } });
    renderRegister({ register });

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bob@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Email already in use')).toBeInTheDocument();
  });
});
