import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function SessionCard({ session }) {
  const { t } = useTranslation();
  const spotsLeft = session.capacity ? Math.max(session.capacity - (session.registeredCount || 0), 0) : null;
  const coverStyle = session.thumbnail
    ? { '--course-cover-image': `url(${JSON.stringify(session.thumbnail)})` }
    : undefined;

  return (
    <Link to={`/sessions/${session._id}`} className="course-card">
      <div className="course-card__cover" style={coverStyle} />
      <div className="course-card__body">
        <h3>{session.title}</h3>
        <p>{session.description}</p>
        <div className="course-card__meta">
          <span className="badge" data-level={session.type === 'live' ? 'beginner' : undefined}>
            {session.type === 'live' ? t('sessions.online') : t('sessions.inPersonBadge')}
          </span>
          <span>{formatDateTime(session.scheduledAt)}</span>
        </div>
        <div className="course-card__meta">
          {session.type === 'in_person' && session.location && <span>{session.location}</span>}
          {session.capacity && (
            <span>{spotsLeft > 0 ? t('sessions.spotsLeftShort', { count: spotsLeft }) : t('sessions.full')}</span>
          )}
        </div>
        {session.instructor?.name && <small>{t('sessions.hostedBy', { name: session.instructor.name })}</small>}
      </div>
    </Link>
  );
}

export default SessionCard;
