import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

function Certificate() {
  const { courseId } = useParams();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/enrollments/course/${courseId}/certificate`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || t('certificate.notAvailable')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  if (loading) return <p>{t('certificate.loading')}</p>;
  if (error) {
    return (
      <section className="text-left">
        <p className="form-error">{error}</p>
        <p>
          <Link to={`/courses/${courseId}`}>&larr; {t('certificate.backToCourse')}</Link>
        </p>
      </section>
    );
  }
  if (!data) return null;

  const verifyUrl = `${window.location.origin}/verify/${data.verificationId}`;

  return (
    <section className="text-left">
      <div className="no-print" style={{ marginBottom: 16 }}>
        <Link to={`/courses/${courseId}`}>&larr; {t('certificate.backToCourse')}</Link>
      </div>

      <div className="certificate">
        <p className="certificate__eyebrow">{t('certificate.eyebrow')}</p>
        <h1 className="certificate__name">{data.studentName}</h1>
        <p className="certificate__body">{t('certificate.completedText')}</p>
        <h2 className="certificate__course">{data.courseTitle}</h2>
        {data.instructorName && (
          <p className="certificate__body">{t('certificate.instructorLabel', { name: data.instructorName })}</p>
        )}
        <p className="certificate__date">{new Date(data.completedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
        <p className="certificate__id">{t('certificate.verificationIdLabel', { id: data.verificationId })}</p>
      </div>

      <div className="no-print" style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" onClick={() => window.print()}>
          {t('certificate.printButton')}
        </button>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          {t('certificate.verifyAt')} <Link to={`/verify/${data.verificationId}`}>{verifyUrl}</Link>
        </span>
      </div>
    </section>
  );
}

export default Certificate;
