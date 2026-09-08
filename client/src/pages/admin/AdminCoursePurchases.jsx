import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

function AdminCoursePurchases() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/course-purchases', { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setPurchases(res.data))
      .catch(() => setError(t('admin.couldNotLoadPurchaseRequests')))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const handleDecision = async (id, status) => {
    setWorkingId(id);
    try {
      await api.patch(`/course-purchases/${id}/status`, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('admin.couldNotUpdateRequest'));
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <section className="text-left">
      <h1>{t('admin.purchaseRequestsTitle')}</h1>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        {['pending', 'paid', 'rejected', ''].map((s) => (
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
      ) : purchases.length === 0 ? (
        <div className="empty-state">
          <p>{t('admin.noRequests', { status: statusFilter ? t(`common.${statusFilter}`) : '' })}</p>
        </div>
      ) : (
        <div className="dashboard-list">
          {purchases.map((p) => (
            <div key={p._id} className="dashboard-item">
              <div className="dashboard-item__row">
                <h3>{p.course?.title}</h3>
                <span className="badge" data-status={p.status === 'paid' ? 'approved' : p.status}>
                  {t(`common.${p.status}`, p.status)}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {p.student?.name} ({p.student?.email})
              </p>
              <p style={{ fontSize: 14 }}>{t('myLearning.amount', { amount: p.amount })}</p>
              {p.status === 'pending' && (
                <div className="dashboard-item__row">
                  <button type="button" onClick={() => handleDecision(p._id, 'paid')} disabled={workingId === p._id}>
                    {t('admin.markAsPaid')}
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleDecision(p._id, 'rejected')}
                    disabled={workingId === p._id}
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

export default AdminCoursePurchases;
