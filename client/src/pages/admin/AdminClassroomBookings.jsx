import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function AdminClassroomBookings() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/classroom-bookings', { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setBookings(res.data))
      .catch(() => setError(t('admin.couldNotLoadBookingRequests')))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const handleDecision = async (id, status) => {
    setWorkingId(id);
    try {
      await api.patch(`/classroom-bookings/${id}/status`, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('admin.couldNotUpdateRequest'));
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <section className="text-left">
      <h1>{t('admin.classroomRequestsTitle')}</h1>

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
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <p>{t('admin.noRequests', { status: statusFilter ? t(`common.${statusFilter}`) : '' })}</p>
        </div>
      ) : (
        <div className="dashboard-list">
          {bookings.map((b) => (
            <div key={b._id} className="dashboard-item">
              <div className="dashboard-item__row">
                <h3>{b.classroom?.name}</h3>
                <span className="badge" data-status={b.status}>
                  {t(`common.${b.status}`, b.status)}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {b.requester?.name} ({b.requester?.email})
              </p>
              <p style={{ fontSize: 14 }}>
                {formatDateTime(b.startTime)} &rarr; {formatDateTime(b.endTime)} &middot;{' '}
                {t('admin.peopleCount', { count: b.headcount })} &middot; {t('admin.priceAmount', { price: b.estimatedPrice })}
              </p>
              {b.purpose && <p style={{ fontSize: 14 }}>{t('admin.purposeLabel', { purpose: b.purpose })}</p>}
              {b.status === 'pending' && (
                <div className="dashboard-item__row">
                  <button
                    type="button"
                    onClick={() => handleDecision(b._id, 'approved')}
                    disabled={workingId === b._id}
                  >
                    {t('admin.approve')}
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleDecision(b._id, 'rejected')}
                    disabled={workingId === b._id}
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

export default AdminClassroomBookings;
