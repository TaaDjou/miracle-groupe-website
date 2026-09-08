import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import ClassroomCard from '../components/ClassroomCard';
import sampleClassrooms from '../data/sampleClassrooms';

function Classrooms() {
  const { t } = useTranslation();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', email: '', expertise: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  useEffect(() => {
    api
      .get('/classrooms')
      .then((res) => setClassrooms(res.data.length ? res.data : sampleClassrooms))
      // API unreachable (e.g. no DB connection in dev) - fall back to sample classrooms so the
      // design can still be previewed populated. Remove this fallback once the backend is reliable.
      .catch(() => setClassrooms(sampleClassrooms))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateForm = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleApply = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await api.post('/instructor-applications', form);
      setStatus('success');
      setForm({ name: '', email: '', expertise: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <section>
      <div className="page-header">
        <h1>{t('classrooms.title')}</h1>
        <p>{t('classrooms.intro')}</p>
      </div>
      {loading && <p>{t('classrooms.loadingClassrooms')}</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && classrooms.length === 0 && <p>{t('classrooms.noClassrooms')}</p>}
      <div className="course-grid">
        {classrooms.map((c) => (
          <ClassroomCard key={c._id} classroom={c} />
        ))}
      </div>

      <section className="cta-banner" style={{ marginTop: 48, textAlign: 'left' }}>
        <h2>{t('classrooms.becomeInstructorTitle')}</h2>
        <p style={{ margin: '0 0 24px' }}>{t('classrooms.becomeInstructorIntro')}</p>

        {status === 'success' ? (
          <p className="quiz-result passed">{t('classrooms.applicationSuccess')}</p>
        ) : (
          <form onSubmit={handleApply} style={{ maxWidth: 480 }}>
            <div className="form-row">
              <label>
                {t('contact.name')}
                <input name="name" value={form.name} onChange={updateForm} required />
              </label>
              <label>
                {t('contact.email')}
                <input type="email" name="email" value={form.email} onChange={updateForm} required />
              </label>
            </div>
            <label>
              {t('classrooms.expertiseLabel')}
              <input name="expertise" value={form.expertise} onChange={updateForm} />
            </label>
            <label>
              {t('classrooms.motivationLabel')}
              <textarea name="message" value={form.message} onChange={updateForm} rows={4} required />
            </label>

            {status === 'error' && <p className="form-error">{t('classrooms.applicationError')}</p>}

            <button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? t('contact.sending') : t('classrooms.applyButton')}
            </button>
          </form>
        )}
      </section>
    </section>
  );
}

export default Classrooms;
