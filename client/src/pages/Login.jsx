import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-form">
      <h1>{t('auth.loginTitle')}</h1>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          {t('auth.email')}
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          {t('auth.password')}
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? t('auth.loggingIn') : t('auth.loginButton')}
        </button>
      </form>
      <p>
        {t('auth.noAccount')} <Link to="/register">{t('nav.register')}</Link>
      </p>
    </section>
  );
}

export default Login;
