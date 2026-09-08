import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function AdminSessions() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/sessions')
      .then((res) => setSessions(res.data))
      .catch(() => setError(t('admin.couldNotLoadSessions')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!window.confirm(t('teaching.confirmDeleteSession'))) return;
    try {
      await api.delete(`/sessions/${id}`);
      load();
    } catch {
      setError(t('teaching.couldNotDeleteSession'));
    }
  };

  if (loading) return <p>{t('admin.loadingSessions')}</p>;

  return (
    <section className="text-left">
      <div className="dashboard-item__row">
        <h1>{t('admin.allSessionsTitle')}</h1>
        <Link to="/instructor/sessions/new" className="btn">
          {t('teaching.newSession')}
        </Link>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>{t('courseBuilder.title')}</th>
              <th>{t('courseBuilder.type')}</th>
              <th>{t('admin.instructor')}</th>
              <th>{t('admin.scheduled')}</th>
              <th>{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session._id}>
                <td className="wrap">
                  <Link to={`/sessions/${session._id}`}>{session.title}</Link>
                </td>
                <td>
                  <span className="badge" data-level={session.type === 'live' ? 'beginner' : undefined}>
                    {session.type === 'live' ? t('sessions.online') : t('sessions.inPersonBadge')}
                  </span>
                </td>
                <td>{session.instructor?.name}</td>
                <td>{formatDateTime(session.scheduledAt)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/instructor/sessions/${session._id}/edit`} className="btn btn-secondary">
                      {t('common.edit')}
                    </Link>
                    <button type="button" className="btn-danger" onClick={() => handleDelete(session._id)}>
                      {t('common.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminSessions;
