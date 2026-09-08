import { useTranslation } from 'react-i18next';

function StarRating({ value, onChange, readOnly = true }) {
  const { t } = useTranslation();
  const stars = [1, 2, 3, 4, 5];

  return (
    <span className="star-rating" role={readOnly ? undefined : 'radiogroup'} aria-label={t('courses.ratingAriaLabel')}>
      {stars.map((star) =>
        readOnly ? (
          <span key={star} className={`star ${star <= Math.round(value) ? 'filled' : ''}`}>
            &#9733;
          </span>
        ) : (
          <button
            key={star}
            type="button"
            className={`star star-input ${star <= value ? 'filled' : ''}`}
            onClick={() => onChange(star)}
            aria-label={t('courses.starCount', { count: star })}
          >
            &#9733;
          </button>
        )
      )}
    </span>
  );
}

export default StarRating;
