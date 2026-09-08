import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function ClassroomCard({ classroom }) {
  const { t } = useTranslation();
  const coverStyle = classroom.thumbnail
    ? { '--course-cover-image': `url(${JSON.stringify(classroom.thumbnail)})` }
    : undefined;
  return (
    <Link to={`/classrooms/${classroom._id}`} className="course-card">
      <div className="course-card__cover" style={coverStyle} />
      <div className="course-card__body">
        <h3>{classroom.name}</h3>
        <p>{classroom.description}</p>
        <div className="course-card__meta">
          <span>{classroom.location}</span>
          <span>{t('classrooms.upToPeople', { count: classroom.capacity })}</span>
        </div>
        <div className="course-card__meta">
          {classroom.amenities?.slice(0, 3).map((a) => (
            <span key={a} className="badge">
              {a}
            </span>
          ))}
        </div>
        <small>{t('classrooms.perHour', { price: classroom.pricePerHour })}</small>
      </div>
    </Link>
  );
}

export default ClassroomCard;
