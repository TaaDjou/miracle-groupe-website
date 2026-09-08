import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import QuizForm from '../components/QuizForm';

function FinalExam() {
  const { courseId } = useParams();
  const { t } = useTranslation();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEnrollment = useCallback(() => {
    return api
      .get(`/enrollments/course/${courseId}`)
      .then((res) => setEnrollment(res.data))
      .catch(() => setError(t('lesson.mustBeEnrolled')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/courses/${courseId}`).then((res) => setCourse(res.data)), loadEnrollment()]).finally(() =>
      setLoading(false)
    );
  }, [courseId, loadEnrollment]);

  if (loading) return <p>{t('lesson.loadingLesson')}</p>;
  if (error && !course) return <p className="form-error">{error}</p>;
  if (!course) return null;
  if (!course.finalExam) return <p>{t('finalExam.noExam')}</p>;

  return (
    <section className="text-left" style={{ maxWidth: 640 }}>
      <p>
        <Link to={`/courses/${courseId}`}>&larr; {course.title}</Link>
      </p>
      <h1>{t('finalExam.title')}</h1>

      {error && <p className="form-error">{error}</p>}

      {enrollment?.examPassed ? (
        <div className="quiz-result passed">
          <p>{t('finalExam.alreadyPassed')}</p>
          <p>
            <Link to={`/courses/${courseId}/certificate`}>{t('finalExam.viewCertificateLink')} &rarr;</Link>
          </p>
        </div>
      ) : (
        <QuizForm
          questions={course.finalExam.questions}
          submitUrl={`/courses/${courseId}/final-exam/attempts`}
          onPassed={loadEnrollment}
          passedMessage={t('finalExam.coursePassMessage')}
        />
      )}
    </section>
  );
}

export default FinalExam;
