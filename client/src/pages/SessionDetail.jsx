import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

function SessionDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  const isOwner = isAuthenticated && session && (user.id === session.instructor?._id || user.role === 'admin');

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/sessions/${id}`)
      .then((res) => setSession(res.data))
      .catch(() => setError(t('sessions.notFound')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(load, [load]);

  const handleRegister = async () => {
    setWorking(true);
    try {
      await api.post(`/sessions/${id}/register`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('sessions.couldNotRegister'));
    } finally {
      setWorking(false);
    }
  };

  const handleUnregister = async () => {
    setWorking(true);
    try {
      await api.delete(`/sessions/${id}/register`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('sessions.couldNotUnregister'));
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <p>{t('sessions.loadingSession')}</p>;
  if (error && !session) return <p className="form-error">{error}</p>;
  if (!session) return null;

  const spotsLeft = session.capacity ? Math.max(session.capacity - session.registeredCount, 0) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const validInviteUrl = session.discordInviteUrl && /^https?:\/\//i.test(session.discordInviteUrl);

  return (
    <section className="text-left">
      <h1>{session.title}</h1>
      <div className="course-card__meta" style={{ marginBottom: 14 }}>
        <span className="badge" data-level={session.type === 'live' ? 'beginner' : undefined}>
          {session.type === 'live' ? t('sessions.onlineDiscord') : t('sessions.inPersonBadge')}
        </span>
        <span>{formatDateTime(session.scheduledAt)}</span>
        <span>{session.durationMinutes} min</span>
      </div>

      <p>{session.description}</p>
      {session.instructor?.name && (
        <p style={{ marginTop: 8 }}>{t('sessions.hostedBy', { name: session.instructor.name })}</p>
      )}
      {session.type === 'in_person' && session.location && (
        <p>{t('sessions.locationLabel', { location: session.location })}</p>
      )}
      {session.capacity && (
        <p style={{ color: 'var(--text-muted)' }}>
          {isFull ? t('sessions.sessionFull') : t('sessions.spotsLeft', { count: spotsLeft, capacity: session.capacity })}
        </p>
      )}

      {isOwner && (
        <p style={{ marginTop: 18 }}>
          <Link to={`/instructor/sessions/${session._id}/edit`} className="btn">
            {t('sessions.editSession')}
          </Link>
        </p>
      )}

      {isAuthenticated && !isOwner && (
        <div style={{ marginTop: 18 }}>
          {session.isRegistered ? (
            <>
              {session.type === 'live' && (
                <div className="quiz-result passed" style={{ marginBottom: 12 }}>
                  {validInviteUrl ? (
                    <p>
                      {t('sessions.registeredJoinCall')}{' '}
                      <a href={session.discordInviteUrl} target="_blank" rel="noreferrer">
                        {session.discordInviteUrl}
                      </a>
                    </p>
                  ) : (
                    <p>{t('sessions.registeredNoLink')}</p>
                  )}
                </div>
              )}
              <button type="button" className="btn-secondary" onClick={handleUnregister} disabled={working}>
                {working ? t('sessions.working') : t('sessions.unregister')}
              </button>
            </>
          ) : (
            <button type="button" onClick={handleRegister} disabled={working || isFull}>
              {isFull ? t('sessions.full') : working ? t('sessions.registering') : t('sessions.subscribe')}
            </button>
          )}
        </div>
      )}

      {!isAuthenticated && (
        <p style={{ marginTop: 18 }}>
          <Link to="/login">{t('sessions.loginToSubscribe')}</Link>
        </p>
      )}

      {error && (
        <p className="form-error" style={{ marginTop: 12, display: 'inline-block' }}>
          {error}
        </p>
      )}
    </section>
  );
}

export default SessionDetail;
