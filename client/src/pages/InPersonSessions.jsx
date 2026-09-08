import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import SessionCard from '../components/SessionCard';
import { sampleInPersonSessions } from '../data/sampleSessions';

function InPersonSessions() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/sessions', { params: { type: 'in_person' } })
      .then((res) => setSessions(res.data.length ? res.data : sampleInPersonSessions))
      // API unreachable (e.g. no DB connection in dev) - fall back to sample sessions so the
      // design can still be previewed populated. Remove this fallback once the backend is reliable.
      .catch(() => setSessions(sampleInPersonSessions))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <div className="page-header">
        <h1>{t('sessions.inPersonTitle')}</h1>
        <p>{t('sessions.inPersonIntro')}</p>
      </div>
      {loading && <p>{t('common.loading')}</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && sessions.length === 0 && <p>{t('sessions.noInPersonSessions')}</p>}
      <div className="course-grid">
        {sessions.map((s) => (
          <SessionCard key={s._id} session={s} />
        ))}
      </div>
    </section>
  );
}

export default InPersonSessions;
