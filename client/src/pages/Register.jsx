import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.registerFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-form">
      <h1>{t('auth.registerTitle')}</h1>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          {t('auth.name')}
          <input type="text" name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          {t('auth.email')}
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          {t('auth.password')}
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />
        </label>
        <label>
          {t('auth.iAmA')}
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="student">{t('auth.student')}</option>
            <option value="instructor">{t('auth.instructor')}</option>
          </select>
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? t('auth.creatingAccount') : t('auth.registerButton')}
        </button>
      </form>
      <p>
        {t('auth.alreadyHaveAccount')} <Link to="/login">{t('nav.login')}</Link>
      </p>
    </section>
  );
}

export default Register;
