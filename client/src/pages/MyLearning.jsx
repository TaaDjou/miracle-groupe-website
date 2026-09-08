import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import ProgressBar from '../components/ProgressBar';
import LearningCalendar from '../components/LearningCalendar';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function MyLearning() {
  const { t } = useTranslation();
  const [enrollments, setEnrollments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/enrollments/mine').then((res) => setEnrollments(res.data)),
      api.get('/sessions/mine/registrations').then((res) => setRegistrations(res.data)),
      api.get('/classroom-bookings/mine').then((res) => setBookings(res.data)),
      api.get('/course-purchases/mine').then((res) => setPurchases(res.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const calendarEvents = useMemo(
    () => [
      ...registrations
        .filter((r) => r.session?.scheduledAt)
        .map((r) => ({
          date: new Date(r.session.scheduledAt),
          title: r.session.title,
          type: r.session.type,
          href: `/sessions/${r.session._id}`,
        })),
      ...bookings
        .filter((b) => b.startTime)
        .map((b) => ({
          date: new Date(b.startTime),
          title: b.classroom?.name || t('myLearning.classroomFallback'),
          type: 'classroom',
        })),
    ],
    [registrations, bookings, t]
  );

  if (loading) return <p>{t('myLearning.loadingLearning')}</p>;

  return (
    <section className="text-left">
      <h1>{t('myLearning.title')}</h1>

      {calendarEvents.length > 0 && (
        <>
          <h2 style={{ marginTop: 24 }}>{t('myLearning.calendarTitle')}</h2>
          <div style={{ marginTop: 12 }}>
            <LearningCalendar events={calendarEvents} />
          </div>
        </>
      )}

      <h2 style={{ marginTop: 32 }}>{t('myLearning.enrolledCourses')}</h2>
      {enrollments.length === 0 && (
        <div className="empty-state" style={{ marginTop: 12 }}>
          <p>
            {t('myLearning.notEnrolled')} <Link to="/courses">{t('myLearning.browseCatalog')}</Link>.
          </p>
        </div>
      )}
      <div className="dashboard-list" style={{ marginTop: 12 }}>
        {enrollments.map((e) => (
          <div key={e._id} className="dashboard-item">
            <div className="dashboard-item__row">
              <h3>{e.course.title}</h3>
              {e.completed && (
                <span className="badge" data-status="completed">
                  {t('common.completed')}
                </span>
              )}
            </div>
            <ProgressBar value={e.progress} />
            <div className="dashboard-item__row">
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {t('myLearning.percentComplete', { percent: e.progress })}
              </span>
              <Link to={`/courses/${e.course._id}`} className="btn">
                {t('myLearning.continueButton')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {purchases.length > 0 && (
        <>
          <h2 style={{ marginTop: 32 }}>{t('myLearning.coursePurchases')}</h2>
          <div className="dashboard-list" style={{ marginTop: 12 }}>
            {purchases.map((p) => (
              <div key={p._id} className="dashboard-item">
                <div className="dashboard-item__row">
                  <h3>{p.course?.title}</h3>
                  <span className="badge" data-status={p.status === 'paid' ? 'approved' : p.status}>
                    {t(`common.${p.status}`, p.status)}
                  </span>
                </div>
                <p style={{ fontSize: 14 }}>{t('myLearning.amount', { amount: p.amount })}</p>
                {p.adminNote && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('myLearning.note', { note: p.adminNote })}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <h2 style={{ marginTop: 32 }}>{t('myLearning.mySessions')}</h2>
      {registrations.length === 0 && (
        <div className="empty-state" style={{ marginTop: 12 }}>
          <p>
            {t('myLearning.noSessions')} <Link to="/live-sessions">{t('sessions.eLearningTitle')}</Link> {t('myLearning.or')}{' '}
            <Link to="/in-person-sessions">{t('sessions.inPersonTitle')}</Link>.
          </p>
        </div>
      )}
      <div className="dashboard-list" style={{ marginTop: 12 }}>
        {registrations.map((r) => (
          <div key={r._id} className="dashboard-item">
            <div className="dashboard-item__row">
              <h3>{r.session.title}</h3>
              <span className="badge" data-level={r.session.type === 'live' ? 'beginner' : undefined}>
                {r.session.type === 'live' ? t('sessions.online') : t('sessions.inPersonBadge')}
              </span>
            </div>
            <div className="dashboard-item__row">
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {formatDateTime(r.session.scheduledAt)}
              </span>
              <Link to={`/sessions/${r.session._id}`} className="btn-secondary">
                {t('common.view')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}>{t('myLearning.classroomRequests')}</h2>
      {bookings.length === 0 && (
        <div className="empty-state" style={{ marginTop: 12 }}>
          <p>
            {t('myLearning.noBookingRequests')} <Link to="/classrooms">{t('myLearning.browseClassrooms')}</Link>.
          </p>
        </div>
      )}
      <div className="dashboard-list" style={{ marginTop: 12 }}>
        {bookings.map((b) => (
          <div key={b._id} className="dashboard-item">
            <div className="dashboard-item__row">
              <h3>{b.classroom?.name || t('myLearning.classroomFallback')}</h3>
              <span className="badge" data-status={b.status}>
                {t(`common.${b.status}`, b.status)}
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {formatDateTime(b.startTime)} &rarr; {formatDateTime(b.endTime)}
            </p>
            <p style={{ fontSize: 14 }}>{t('myLearning.estimatedPriceSimple', { price: b.estimatedPrice })}</p>
            {b.adminNote && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('myLearning.note', { note: b.adminNote })}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default MyLearning;
