import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import QuizForm from '../components/QuizForm';
import { getEmbedUrl } from '../utils/video';

function flattenLessons(course) {
  const flat = [];
  for (const section of course.sections) {
    for (const lesson of section.lessons) {
      flat.push({ ...lesson, sectionTitle: section.title });
    }
  }
  return flat;
}

function LessonView() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState(false);

  const loadEnrollment = useCallback(() => {
    return api
      .get(`/enrollments/course/${courseId}`)
      .then((res) => setEnrollment(res.data))
      .catch(() => {
        setError(t('lesson.mustBeEnrolled'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/courses/${courseId}`).then((res) => setCourse(res.data)), loadEnrollment()]).finally(() =>
      setLoading(false)
    );
  }, [courseId, loadEnrollment]);

  const flatLessons = useMemo(() => (course ? flattenLessons(course) : []), [course]);
  const currentIndex = flatLessons.findIndex((l) => l._id === lessonId);
  const lesson = flatLessons[currentIndex];
  const prevLesson = flatLessons[currentIndex - 1];
  const nextLesson = flatLessons[currentIndex + 1];

  const completedIds = new Set((enrollment?.completedLessons || []).map(String));
  const isCompleted = lesson && completedIds.has(lesson._id);

  const handleMarkComplete = async () => {
    setMarking(true);
    try {
      const res = await api.patch(`/enrollments/${courseId}/lessons/${lessonId}/complete`);
      setEnrollment(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('lesson.couldNotUpdateProgress'));
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <p>{t('lesson.loadingLesson')}</p>;
  if (error && !course) return <p className="form-error">{error}</p>;
  if (!course) return null;
  if (!lesson) return <p>{t('lesson.notFound')}</p>;

  return (
    <div className="course-layout">
      <aside className="course-sidebar">
        <Link to={`/courses/${courseId}`}>&larr; {course.title}</Link>
        {course.sections.map((section) => (
          <div key={section._id}>
            <h3>{section.title}</h3>
            <ul className="lesson-list">
              {section.lessons.map((l) => (
                <li key={l._id}>
                  <Link to={`/courses/${courseId}/lessons/${l._id}`} className={l._id === lessonId ? 'active' : ''}>
                    <span>
                      {completedIds.has(l._id) ? '✓ ' : ''}
                      {l.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <main className="lesson-main">
        <h1>{lesson.title}</h1>
        {error && <p className="form-error">{error}</p>}

        {lesson.type === 'video' && (
          <>
            {(() => {
              const embedUrl = getEmbedUrl(lesson.videoUrl);
              if (embedUrl) {
                return (
                  <div className="video-embed">
                    <iframe
                      src={embedUrl}
                      title={lesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              }
              if (lesson.videoUrl && /^https?:\/\//i.test(lesson.videoUrl)) {
                return (
                  <p>
                    {t('lesson.videoLabel')}{' '}
                    <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
                      {lesson.videoUrl}
                    </a>
                  </p>
                );
              }
              return <p>{t('lesson.noVideoUrl')}</p>;
            })()}
            <p>{lesson.content}</p>
          </>
        )}

        {lesson.type === 'text' && <p style={{ whiteSpace: 'pre-wrap' }}>{lesson.content}</p>}

        {lesson.type === 'quiz' && (
          <QuizForm
            questions={lesson.quiz.questions}
            submitUrl={`/quizzes/${courseId}/lessons/${lesson._id}/attempts`}
            onPassed={loadEnrollment}
          />
        )}

        {lesson.type !== 'quiz' && (
          <button type="button" onClick={handleMarkComplete} disabled={marking || isCompleted}>
            {isCompleted ? t('lesson.completed') : marking ? t('courses.saving') : t('lesson.markComplete')}
          </button>
        )}

        <div className="dashboard-item__row" style={{ marginTop: 24 }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={!prevLesson}
            onClick={() => prevLesson && navigate(`/courses/${courseId}/lessons/${prevLesson._id}`)}
          >
            &larr; {t('lesson.previous')}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={!nextLesson}
            onClick={() => nextLesson && navigate(`/courses/${courseId}/lessons/${nextLesson._id}`)}
          >
            {t('lesson.next')} &rarr;
          </button>
        </div>
      </main>
    </div>
  );
}

export default LessonView;
