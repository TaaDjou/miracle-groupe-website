import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function AdminInstructorApplications() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/instructor-applications', { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setApplications(res.data))
      .catch(() => setError(t('admin.couldNotLoadApplications')))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const handleDecision = async (id, status) => {
    setWorkingId(id);
    try {
      await api.patch(`/instructor-applications/${id}/status`, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('admin.couldNotUpdateRequest'));
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <section className="text-left">
      <h1>{t('admin.instructorApplicationsTitle')}</h1>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        {['pending', 'approved', 'rejected', ''].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            className={statusFilter === s ? 'btn' : 'btn-secondary'}
            onClick={() => setStatusFilter(s)}
          >
            {s ? t(`common.${s}`) : t('common.all')}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>{t('admin.loadingRequests')}</p>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <p>{t('admin.noRequests', { status: statusFilter ? t(`common.${statusFilter}`) : '' })}</p>
        </div>
      ) : (
        <div className="dashboard-list">
          {applications.map((a) => (
            <div key={a._id} className="dashboard-item">
              <div className="dashboard-item__row">
                <h3>{a.name}</h3>
                <span className="badge" data-status={a.status}>
                  {t(`common.${a.status}`, a.status)}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {a.email} &middot; {formatDate(a.createdAt)}
              </p>
              {a.expertise && (
                <p style={{ fontSize: 14 }}>
                  <strong>{t('classrooms.expertiseLabel')}</strong> {a.expertise}
                </p>
              )}
              <p style={{ fontSize: 14 }}>{a.message}</p>
              {a.status === 'pending' && (
                <div className="dashboard-item__row">
                  <button
                    type="button"
                    onClick={() => handleDecision(a._id, 'approved')}
                    disabled={workingId === a._id}
                  >
                    {t('admin.approve')}
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleDecision(a._id, 'rejected')}
                    disabled={workingId === a._id}
                  >
                    {t('admin.reject')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminInstructorApplications;
