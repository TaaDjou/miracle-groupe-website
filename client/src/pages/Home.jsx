import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import CourseCard from '../components/CourseCard';
import StarRating from '../components/StarRating';
import sampleCourses from '../data/sampleCourses';

function Home() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [courses, setCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const trackRef = useRef(null);

  useEffect(() => {
    api
      .get('/courses')
      .then((res) => setCourses(res.data.length ? res.data.slice(0, 8) : sampleCourses))
      // API unreachable (e.g. no DB connection in dev) - fall back to sample courses so the
      // design can still be previewed populated. Remove this fallback once the backend is reliable.
      .catch(() => setCourses(sampleCourses));
    api
      .get('/reviews/featured')
      .then((res) => setReviews(res.data))
      .catch(() => {});
  }, []);

  const features = [
    { key: 1, icon: '🎓', title: t('home.feature1Title'), text: t('home.feature1Text') },
    { key: 2, icon: '🎙️', title: t('home.feature2Title'), text: t('home.feature2Text') },
    { key: 3, icon: '🏫', title: t('home.feature3Title'), text: t('home.feature3Text') },
    { key: 4, icon: '📜', title: t('home.feature4Title'), text: t('home.feature4Text') },
  ];

  const instructors = [
    ...new Map(
      courses.filter((c) => c.instructor?.name).map((c) => [c.instructor.name, c.instructor])
    ).values(),
  ];

  const faqs = [1, 2, 3, 4].map((n) => ({ q: t(`home.faq${n}Q`), a: t(`home.faq${n}A`) }));

  const scrollCarousel = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * (track.clientWidth * 0.85), behavior: 'smooth' });
  };

  return (
    <>
      <section className="hero">
        <h1>{t('home.title')}</h1>
        <p>{t('home.subtitle')}</p>
        <div className="hero-actions">
          <Link to="/courses" className="btn">
            {t('home.browseCourses')}
          </Link>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-secondary">
              {t('home.getStarted')}
            </Link>
          )}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__head">
          <h2>{t('home.differentiatorsTitle')}</h2>
          <p>{t('home.differentiatorsSubtitle')}</p>
        </div>
        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.key} className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {courses.length > 0 && (
        <section className="landing-section">
          <div className="landing-section__head">
            <h2>{t('home.coursesTitle')}</h2>
            <p>{t('home.coursesSubtitle')}</p>
          </div>
          <div className="carousel">
            <div className="carousel__track" ref={trackRef}>
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
            <div className="carousel__nav">
              <button
                type="button"
                className="carousel__nav-btn"
                onClick={() => scrollCarousel(-1)}
                aria-label={t('home.seeAllCourses')}
              >
                &larr;
              </button>
              <button type="button" className="carousel__nav-btn" onClick={() => scrollCarousel(1)}>
                &rarr;
              </button>
            </div>
          </div>
          <div className="landing-section__more">
            <Link to="/courses" className="btn btn-secondary">
              {t('home.seeAllCourses')}
            </Link>
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="landing-section">
          <div className="landing-section__head">
            <h2>{t('home.testimonialsTitle')}</h2>
          </div>
          <div className="testimonial-grid">
            {reviews.map((review) => (
              <div key={review._id} className="testimonial-card">
                <StarRating value={review.rating} />
                {review.comment && <p className="testimonial-card__quote">{review.comment}</p>}
                <div className="testimonial-card__author">
                  <span className="avatar">{review.student.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <strong>{review.student.name}</strong>
                    <small>{review.course.title}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {instructors.length > 0 && (
        <section className="landing-section">
          <div className="landing-section__head">
            <h2>{t('home.instructorsTitle')}</h2>
          </div>
          <div className="instructor-grid">
            {instructors.map((instructor) => (
              <div key={instructor.name} className="instructor-chip">
                <span className="avatar">{instructor.name.charAt(0).toUpperCase()}</span>
                <span>{instructor.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="landing-section">
        <div className="landing-section__head">
          <h2>{t('home.faqTitle')}</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.q} className="faq-item">
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <h2>{t('home.ctaTitle')}</h2>
        <p>{t('home.ctaSubtitle')}</p>
        <Link to="/contact" className="btn">
          {t('home.ctaButton')}
        </Link>
      </section>
    </>
  );
}

export default Home;
