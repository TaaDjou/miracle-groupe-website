import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';

function AdminUserDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/admin/users/${id}`)
      .then((res) => setUser(res.data))
      .catch(() => setError(t('admin.couldNotLoadUser')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <p>{t('admin.loadingProfile')}</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!user) return null;

  return (
    <section className="text-left">
      <p>
        <Link to="/admin/users">&larr; {t('admin.backToStudents')}</Link>
      </p>
      <h1>{user.name}</h1>
      <div className="course-card__meta" style={{ marginBottom: 16 }}>
        <span className="badge">{user.role}</span>
        <span>{user.email}</span>
        <span>{t('admin.joinedOn', { date: new Date(user.createdAt).toLocaleDateString() })}</span>
      </div>

      <h2>{t('admin.courseEnrollments')}</h2>
      {user.enrollments.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.noEnrollments')}</p>
      ) : (
        <div className="dashboard-list" style={{ marginTop: 12 }}>
          {user.enrollments.map((e) => (
            <div key={e.courseId} className="dashboard-item">
              <div className="dashboard-item__row">
                <h3>{e.courseTitle}</h3>
                {e.completed && (
                  <span className="badge" data-status="completed">
                    {t('common.completed')}
                  </span>
                )}
              </div>
              <ProgressBar value={e.progress} />
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {t('myLearning.percentComplete', { percent: e.progress })}
              </span>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: 28 }}>{t('admin.sessionRegistrationsTitle')}</h2>
      {user.sessions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.noSessionRegs')}</p>
      ) : (
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>{t('courseBuilder.title')}</th>
                <th>{t('courseBuilder.type')}</th>
                <th>{t('admin.scheduled')}</th>
              </tr>
            </thead>
            <tbody>
              {user.sessions.map((s) => (
                <tr key={s.sessionId}>
                  <td>
                    <Link to={`/sessions/${s.sessionId}`}>{s.title}</Link>
                  </td>
                  <td>{s.type === 'live' ? t('sessions.online') : t('sessions.inPersonBadge')}</td>
                  <td>{new Date(s.scheduledAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AdminUserDetail;
