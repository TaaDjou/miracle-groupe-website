import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

function ClassroomDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({ startTime: '', endTime: '', purpose: '', headcount: 1 });

  useEffect(() => {
    api
      .get(`/classrooms/${id}`)
      .then((res) => setClassroom(res.data))
      .catch(() => setError(t('classrooms.notFound')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateForm = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const estimatedHours =
    form.startTime && form.endTime
      ? Math.max((new Date(form.endTime) - new Date(form.startTime)) / (1000 * 60 * 60), 0)
      : 0;
  const estimatedPrice = classroom ? Math.round(estimatedHours * classroom.pricePerHour * 100) / 100 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/classroom-bookings', {
        classroomId: id,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        purpose: form.purpose,
        headcount: Number(form.headcount),
      });
      setSuccess(t('classrooms.requestSubmitted'));
      setForm({ startTime: '', endTime: '', purpose: '', headcount: 1 });
    } catch (err) {
      setError(err.response?.data?.message || t('classrooms.couldNotSubmitRequest'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>{t('classrooms.loadingClassroom')}</p>;
  if (error && !classroom) return <p className="form-error">{error}</p>;
  if (!classroom) return null;

  return (
    <section className="text-left">
      <h1>{classroom.name}</h1>
      <div className="course-card__meta" style={{ marginBottom: 14 }}>
        <span>{classroom.location}</span>
        <span>{t('classrooms.upToPeople', { count: classroom.capacity })}</span>
        <span>{t('classrooms.perHour', { price: classroom.pricePerHour })}</span>
      </div>
      <p>{classroom.description}</p>
      {classroom.amenities?.length > 0 && (
        <div className="course-card__meta" style={{ marginTop: 10 }}>
          {classroom.amenities.map((a) => (
            <span key={a} className="badge">
              {a}
            </span>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: 28 }}>{t('classrooms.requestRoom')}</h2>

      {!isAuthenticated ? (
        <p>
          <Link to="/login">{t('classrooms.loginToRequest')}</Link>
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: 480, marginTop: 12 }}>
          <div className="form-row">
            <label>
              {t('classrooms.start')}
              <input type="datetime-local" name="startTime" value={form.startTime} onChange={updateForm} required />
            </label>
            <label>
              {t('classrooms.end')}
              <input type="datetime-local" name="endTime" value={form.endTime} onChange={updateForm} required />
            </label>
          </div>
          <label>
            {t('classrooms.purpose')}
            <textarea name="purpose" value={form.purpose} onChange={updateForm} rows={2} />
          </label>
          <label>
            {t('classrooms.headcount')}
            <input type="number" name="headcount" min={1} value={form.headcount} onChange={updateForm} />
          </label>

          {estimatedHours > 0 && (
            <p style={{ fontWeight: 600 }}>
              {t('classrooms.estimatedPrice', {
                price: estimatedPrice,
                hours: estimatedHours.toFixed(1),
                rate: classroom.pricePerHour,
              })}
            </p>
          )}

          {error && <p className="form-error">{error}</p>}
          {success && <p className="quiz-result passed">{success}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? t('courses.submitting') : t('classrooms.submitRequest')}
          </button>
        </form>
      )}
    </section>
  );
}

export default ClassroomDetail;
