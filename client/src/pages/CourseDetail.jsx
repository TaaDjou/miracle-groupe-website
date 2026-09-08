import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import ProgressBar from '../components/ProgressBar';
import StarRating from '../components/StarRating';

function CourseDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [purchase, setPurchase] = useState(null);
  const [reviewData, setReviewData] = useState({ averageRating: 0, count: 0, reviews: [] });
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  const isOwner = isAuthenticated && course && (user.id === course.instructor?._id || user.role === 'admin');
  const isPaidCourse = course && course.price > 0;

  const loadEnrollment = useCallback(() => {
    if (!isAuthenticated) return;
    api
      .get(`/enrollments/course/${id}`)
      .then((res) => setEnrollment(res.data))
      .catch(() => setEnrollment(null));
  }, [id, isAuthenticated]);

  const loadPurchase = useCallback(() => {
    if (!isAuthenticated) return;
    api
      .get('/course-purchases/mine')
      .then((res) => {
        const match = res.data.find((p) => p.course?._id === id);
        setPurchase(match || null);
      })
      .catch(() => setPurchase(null));
  }, [id, isAuthenticated]);

  const loadReviews = useCallback(() => {
    api
      .get(`/reviews/course/${id}`)
      .then((res) => {
        setReviewData(res.data);
        if (isAuthenticated) {
          const mine = res.data.reviews.find((r) => r.student?._id === user.id);
          if (mine) setReviewForm({ rating: mine.rating, comment: mine.comment });
        }
      })
      .catch(() => {});
  }, [id, isAuthenticated, user?.id]);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/courses/${id}`)
      .then((res) => setCourse(res.data))
      .catch(() => setError(t('courses.courseNotFound')))
      .finally(() => setLoading(false));
    loadEnrollment();
    loadPurchase();
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loadEnrollment, loadPurchase, loadReviews]);

  const handleEnroll = async () => {
    setWorking(true);
    try {
      await api.post('/enrollments', { courseId: id });
      loadEnrollment();
    } catch (err) {
      setError(err.response?.data?.message || t('courses.couldNotEnroll'));
    } finally {
      setWorking(false);
    }
  };

  const handleRequestPurchase = async () => {
    setWorking(true);
    try {
      await api.post('/course-purchases', { courseId: id });
      loadPurchase();
    } catch (err) {
      setError(err.response?.data?.message || t('courses.couldNotSubmitPurchase'));
    } finally {
      setWorking(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) {
      setError(t('courses.pleaseSelectRating'));
      return;
    }
    setWorking(true);
    try {
      await api.post('/reviews', { courseId: id, ...reviewForm });
      loadReviews();
    } catch (err) {
      setError(err.response?.data?.message || t('courses.couldNotSubmitReview'));
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <p>{t('courses.loadingCourse')}</p>;
  if (error && !course) return <p className="form-error">{error}</p>;
  if (!course) return null;

  const completedIds = new Set((enrollment?.completedLessons || []).map(String));

  return (
    <section className="text-left">
      {course.thumbnail && (
        <img src={course.thumbnail} alt="" className="course-detail__cover" />
      )}
      <h1>{course.title}</h1>
      <div className="course-card__meta" style={{ marginBottom: 14 }}>
        <span className="badge" data-level={course.level}>
          {t(`courses.${course.level}`, course.level)}
        </span>
        <span>{course.category}</span>
        <span className="badge" data-status={isPaidCourse ? undefined : 'published'}>
          {isPaidCourse ? `$${course.price}` : t('common.free')}
        </span>
        {!course.published && (
          <span className="badge" data-status="draft">
            {t('common.draft')}
          </span>
        )}
        {reviewData.count > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <StarRating value={reviewData.averageRating} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {reviewData.averageRating} ({reviewData.count})
            </span>
          </span>
        )}
      </div>
      <p>{course.description}</p>
      {course.instructor?.name && (
        <p style={{ marginTop: 8 }}>{t('courses.instructorLabel', { name: course.instructor.name })}</p>
      )}

      {isOwner && (
        <p style={{ marginTop: 18 }}>
          <Link to={`/instructor/courses/${course._id}/edit`} className="btn">
            {t('common.edit')}
          </Link>
        </p>
      )}

      {isAuthenticated && !isOwner && (
        <>
          {enrollment ? (
            <div style={{ margin: '20px 0', maxWidth: 420 }}>
              <div className="dashboard-item__row" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t('courses.yourProgress')}</span>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{enrollment.progress}%</span>
              </div>
              <ProgressBar value={enrollment.progress} />

              {enrollment.completed && enrollment.examRequired && !enrollment.examPassed && (
                <p style={{ marginTop: 10 }}>
                  <Link to={`/courses/${course._id}/final-exam`} className="btn">
                    {t('courses.takeFinalExam')}
                  </Link>
                </p>
              )}
              {enrollment.certificateEligible && (
                <p style={{ marginTop: 10 }}>
                  <Link to={`/courses/${course._id}/certificate`} className="btn">
                    {t('courses.viewCertificate')}
                  </Link>
                </p>
              )}
            </div>
          ) : isPaidCourse ? (
            <div style={{ marginTop: 18 }}>
              {!purchase && (
                <button type="button" onClick={handleRequestPurchase} disabled={working}>
                  {working ? t('courses.submitting') : t('courses.buyButton', { price: course.price })}
                </button>
              )}
              {purchase?.status === 'pending' && (
                <p className="badge" data-status="pending" style={{ display: 'inline-block' }}>
                  {t('courses.purchaseRequested')}
                </p>
              )}
              {purchase?.status === 'rejected' && (
                <>
                  <p className="badge" data-status="rejected" style={{ display: 'inline-block', marginBottom: 10 }}>
                    {t('courses.purchaseRejected')}
                  </p>
                  {purchase.adminNote && <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{purchase.adminNote}</p>}
                  <div>
                    <button type="button" onClick={handleRequestPurchase} disabled={working}>
                      {working ? t('courses.submitting') : t('courses.requestAgain')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 18 }}>
              <button type="button" onClick={handleEnroll} disabled={working}>
                {working ? t('courses.enrolling') : t('courses.enrollButton')}
              </button>
            </div>
          )}
        </>
      )}

      {!isAuthenticated && (
        <p style={{ marginTop: 18 }}>
          <Link to="/login">{t('nav.login')}</Link>{' '}
          {isPaidCourse ? t('courses.loginToPurchase') : t('courses.loginToEnroll')}
        </p>
      )}

      {error && (
        <p className="form-error" style={{ marginTop: 12, display: 'inline-block' }}>
          {error}
        </p>
      )}

      <h2 style={{ marginTop: 32 }}>{t('courses.content')}</h2>
      {course.sections.map((section) => (
        <div key={section._id} className="builder-section">
          <h3>{section.title}</h3>
          <ul className="lesson-list">
            {section.lessons.map((lesson) => (
              <li key={lesson._id}>
                {enrollment ? (
                  <Link to={`/courses/${course._id}/lessons/${lesson._id}`}>
                    <span>
                      {completedIds.has(lesson._id) ? '✓ ' : ''}
                      {lesson.title}
                    </span>
                    <span className="badge">{t(`courseBuilder.${lesson.type}`, lesson.type)}</span>
                  </Link>
                ) : (
                  <span>
                    <span>{lesson.title}</span>
                    <span className="badge">{t(`courseBuilder.${lesson.type}`, lesson.type)}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {course.finalExam && (
        <div className="builder-section">
          <h3>{t('courses.finalExamSection')}</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {t('courses.questionsRequired', { count: course.finalExam.questions.length })}
          </p>
        </div>
      )}

      <h2 style={{ marginTop: 32 }}>{t('courses.reviewsTitle')}</h2>
      {enrollment && !isOwner && (
        <form onSubmit={handleSubmitReview} className="builder-section" style={{ maxWidth: 480 }}>
          <label>
            {t('courses.yourRating')}
            <div style={{ marginTop: 4 }}>
              <StarRating
                readOnly={false}
                value={reviewForm.rating}
                onChange={(rating) => setReviewForm((f) => ({ ...f, rating }))}
              />
            </div>
          </label>
          <label>
            {t('courses.commentOptional')}
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              rows={3}
            />
          </label>
          <button type="submit" disabled={working} style={{ alignSelf: 'flex-start' }}>
            {working ? t('courses.saving') : t('courses.submitReview')}
          </button>
        </form>
      )}

      {reviewData.reviews.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('courses.noReviews')}</p>
      ) : (
        <div className="builder-section">
          {reviewData.reviews.map((r) => (
            <div key={r._id} className="review-item">
              <div className="dashboard-item__row">
                <strong>{r.student?.name}</strong>
                <StarRating value={r.rating} />
              </div>
              {r.comment && <p style={{ marginTop: 4 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CourseDetail;
