import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const updateForm = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await api.post('/contact', form);
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="auth-form" style={{ maxWidth: 520 }}>
      <h1>{t('contact.title')}</h1>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 20 }}>{t('contact.intro')}</p>

      {status === 'success' ? (
        <p className="quiz-result passed">{t('contact.success')}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            {t('contact.name')}
            <input name="name" value={form.name} onChange={updateForm} required />
          </label>
          <label>
            {t('contact.email')}
            <input type="email" name="email" value={form.email} onChange={updateForm} required />
          </label>
          <label>
            {t('contact.message')}
            <textarea name="message" value={form.message} onChange={updateForm} rows={5} required />
          </label>

          {status === 'error' && <p className="form-error">{t('contact.error')}</p>}

          <button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? t('contact.sending') : t('contact.send')}
          </button>
        </form>
      )}
    </section>
  );
}

export default Contact;
