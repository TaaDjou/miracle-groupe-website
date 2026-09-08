import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

function VerifyCertificate() {
  const { enrollmentId } = useParams();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/certificates/${enrollmentId}/verify`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [enrollmentId]);

  if (loading) return <p>{t('certificate.checking')}</p>;

  return (
    <section className="text-left" style={{ maxWidth: 480 }}>
      <h1>{t('certificate.verifyTitle')}</h1>
      {data ? (
        <div className="quiz-result passed">
          <p style={{ fontWeight: 700 }}>{t('certificate.validCertificate')}</p>
          <p>{data.studentName}</p>
          <p>{data.courseTitle}</p>
          {data.instructorName && <p>{t('certificate.instructorLabel', { name: data.instructorName })}</p>}
          <p>{new Date(data.completedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
        </div>
      ) : (
        <div className="quiz-result failed">
          <p style={{ fontWeight: 700 }}>{t('certificate.notFound')}</p>
          <p>{t('certificate.notFoundText')}</p>
        </div>
      )}
    </section>
  );
}

export default VerifyCertificate;
