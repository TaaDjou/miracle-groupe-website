import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function TeachingHub() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/courses/mine').then((res) => setCourses(res.data)),
      api.get('/sessions/mine').then((res) => setSessions(res.data)),
    ])
      .catch(() => setError(t('teaching.couldNotLoadContent')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm(t('teaching.confirmDeleteCourse'))) return;
    try {
      await api.delete(`/courses/${courseId}`);
      load();
    } catch {
      setError(t('teaching.couldNotDeleteCourse'));
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      await api.put(`/courses/${course._id}`, { published: !course.published });
      load();
    } catch {
      setError(t('teaching.couldNotUpdateCourse'));
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm(t('teaching.confirmDeleteSession'))) return;
    try {
      await api.delete(`/sessions/${sessionId}`);
      load();
    } catch {
      setError(t('teaching.couldNotDeleteSession'));
    }
  };

  if (loading) return <p>{t('teaching.loadingContent')}</p>;

  return (
    <section className="text-left">
      <div className="dashboard-item__row">
        <h1>{t('teaching.title')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/instructor/sessions/new" className="btn-secondary">
            {t('teaching.newSession')}
          </Link>
          <Link to="/instructor/courses/new" className="btn">
            {t('teaching.newCourse')}
          </Link>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <h2 style={{ marginTop: 24 }}>{t('teaching.myCourses')}</h2>
      {courses.length === 0 && (
        <div className="empty-state" style={{ marginTop: 12 }}>
          <p>{t('teaching.noCoursesYet')}</p>
        </div>
      )}
      <div className="dashboard-list" style={{ marginTop: 12 }}>
        {courses.map((course) => (
          <div key={course._id} className="dashboard-item">
            <div className="dashboard-item__row">
              <h3>{course.title}</h3>
              <span className="badge" data-status={course.published ? 'published' : 'draft'}>
                {course.published ? t('common.published') : t('common.draft')}
              </span>
            </div>
            <p>{course.description}</p>
            <div className="dashboard-item__row">
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/courses/${course._id}`} className="btn btn-secondary">
                  {t('common.view')}
                </Link>
                <Link to={`/instructor/courses/${course._id}/edit`} className="btn btn-secondary">
                  {t('common.edit')}
                </Link>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => handleTogglePublish(course)}>
                  {course.published ? t('teaching.unpublish') : t('teaching.publish')}
                </button>
                <button type="button" className="btn-danger" onClick={() => handleDeleteCourse(course._id)}>
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}>{t('teaching.mySessions')}</h2>
      {sessions.length === 0 && (
        <div className="empty-state" style={{ marginTop: 12 }}>
          <p>{t('teaching.noSessionsYet')}</p>
        </div>
      )}
      <div className="dashboard-list" style={{ marginTop: 12 }}>
        {sessions.map((session) => (
          <div key={session._id} className="dashboard-item">
            <div className="dashboard-item__row">
              <h3>{session.title}</h3>
              <span className="badge" data-level={session.type === 'live' ? 'beginner' : undefined}>
                {session.type === 'live' ? t('sessions.online') : t('sessions.inPersonBadge')}
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {formatDateTime(session.scheduledAt)} &middot;{' '}
              {t('teaching.registered', {
                count: session.capacity ? `${session.registeredCount}/${session.capacity}` : session.registeredCount,
              })}
            </p>
            <div className="dashboard-item__row">
              <Link to={`/sessions/${session._id}`} className="btn btn-secondary">
                {t('common.view')}
              </Link>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/instructor/sessions/${session._id}/edit`} className="btn btn-secondary">
                  {t('common.edit')}
                </Link>
                <button type="button" className="btn-danger" onClick={() => handleDeleteSession(session._id)}>
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TeachingHub;
