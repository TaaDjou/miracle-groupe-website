import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function CourseCard({ course }) {
  const { t } = useTranslation();
  const lessonCount = course.sections?.reduce((total, s) => total + s.lessons.length, 0) || 0;

  const coverStyle = course.thumbnail
    ? { '--course-cover-image': `url(${JSON.stringify(course.thumbnail)})` }
    : undefined;

  return (
    <Link to={`/courses/${course._id}`} className="course-card">
      <div className="course-card__cover" style={coverStyle} />
      <div className="course-card__body">
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="course-card__meta">
          <span className="badge" data-level={course.level}>
            {t(`courses.${course.level}`, course.level)}
          </span>
          <span>{course.category}</span>
          <span>{t('courses.lessons', { count: lessonCount })}</span>
        </div>
        {course.instructor?.name && <small>{t('courses.by', { name: course.instructor.name })}</small>}
      </div>
    </Link>
  );
}

export default CourseCard;
