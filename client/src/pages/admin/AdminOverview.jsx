import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import StatCard from '../../components/StatCard';

function AdminOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError(t('admin.couldNotLoadStats')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p>{t('admin.loadingDashboard')}</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!stats) return null;

  return (
    <section className="text-left">
      <h1>{t('admin.overviewTitle')}</h1>

      <h2 style={{ marginTop: 24 }}>{t('admin.usersSection')}</h2>
      <div className="stat-grid" style={{ marginTop: 12 }}>
        <StatCard label={t('admin.totalUsers')} value={stats.users.total} />
        <StatCard label={t('admin.students')} value={stats.users.students} />
        <StatCard label={t('admin.instructors')} value={stats.users.instructors} />
        <StatCard label={t('admin.admins')} value={stats.users.admins} />
      </div>

      <h2 style={{ marginTop: 28 }}>{t('admin.coursesSection')}</h2>
      <div className="stat-grid" style={{ marginTop: 12 }}>
        <StatCard
          label={t('admin.totalCourses')}
          value={stats.courses.total}
          sublabel={t('admin.publishedSublabel', { count: stats.courses.published })}
        />
        <StatCard label={t('admin.draftCourses')} value={stats.courses.draft} />
        <StatCard
          label={t('admin.enrollments')}
          value={stats.enrollments.total}
          sublabel={t('admin.completedSublabel', { count: stats.enrollments.completed })}
        />
        <StatCard label={t('admin.avgProgress')} value={`${stats.enrollments.avgProgress}%`} />
        <StatCard
          label={t('admin.quizAttempts')}
          value={stats.quizzes.totalAttempts}
          sublabel={t('admin.passRateSublabel', { rate: stats.quizzes.passRate })}
        />
      </div>

      <h2 style={{ marginTop: 28 }}>{t('admin.sessionsSection')}</h2>
      <div className="stat-grid" style={{ marginTop: 12 }}>
        <StatCard
          label={t('admin.liveSessions')}
          value={stats.sessions.live}
          sublabel={t('admin.upcomingSublabel', { count: stats.sessions.upcomingLive })}
        />
        <StatCard
          label={t('admin.inPersonSessions')}
          value={stats.sessions.inPerson}
          sublabel={t('admin.upcomingSublabel', { count: stats.sessions.upcomingInPerson })}
        />
        <StatCard label={t('admin.sessionRegistrations')} value={stats.sessions.totalRegistrations} />
      </div>

      <h2 style={{ marginTop: 28 }}>{t('admin.classroomSection')}</h2>
      <div className="stat-grid" style={{ marginTop: 12 }}>
        <StatCard label={t('admin.bookingRequests')} value={stats.classroomBookings.total} />
        <StatCard label={t('admin.pendingReview')} value={stats.classroomBookings.pending} />
      </div>

      <h2 style={{ marginTop: 28 }}>{t('admin.recentSignups')}</h2>
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>{t('admin.name')}</th>
              <th>{t('admin.email')}</th>
              <th>{t('admin.role')}</th>
              <th>{t('admin.joined')}</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link to={`/admin/users/${u.id}`}>{u.name}</Link>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className="badge">{u.role}</span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminOverview;
