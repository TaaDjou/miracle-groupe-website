import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import CourseCard from '../components/CourseCard';
import sampleCourses from '../data/sampleCourses';

function CourseCatalog() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch the unfiltered category list once, so the dropdown options don't
  // shrink to just the currently-selected category after filtering.
  useEffect(() => {
    api
      .get('/courses')
      .then((res) => {
        const source = res.data.length ? res.data : sampleCourses;
        const categories = [...new Set(source.map((c) => c.category).filter(Boolean))].sort();
        setCategoryOptions(categories);
      })
      // API unreachable (e.g. no DB connection in dev) - fall back to sample categories so the
      // design can still be previewed populated. Remove this fallback once the backend is reliable.
      .catch(() => {
        const categories = [...new Set(sampleCourses.map((c) => c.category))].sort();
        setCategoryOptions(categories);
      });
  }, []);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (level) params.level = level;
    if (category) params.category = category;

    setLoading(true);
    api
      .get('/courses', { params })
      .then((res) => setCourses(res.data.length ? res.data : sampleCourses))
      // Same temporary preview fallback as above.
      .catch(() => setCourses(sampleCourses))
      .finally(() => setLoading(false));
  }, [search, level, category]);

  const visibleCourses = freeOnly ? courses.filter((c) => !c.price) : courses;

  return (
    <section>
      <div className="page-header">
        <h1>{t('courses.catalogTitle')}</h1>
        <p>{t('courses.catalogSubtitle')}</p>
      </div>
      <div className="form-row" style={{ maxWidth: 640, marginBottom: 20, alignItems: 'flex-end' }}>
        <input
          type="search"
          placeholder={t('courses.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">{t('courses.allLevels')}</option>
          <option value="beginner">{t('courses.beginner')}</option>
          <option value="intermediate">{t('courses.intermediate')}</option>
          <option value="advanced">{t('courses.advanced')}</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t('courses.allCategories')}</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />
          {t('courses.freeOnly')}
        </label>
      </div>

      {loading && <p>{t('courses.loadingCourses')}</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && visibleCourses.length === 0 && <p>{t('courses.noMatch')}</p>}
      <div className="course-grid">
        {visibleCourses.map((course) => (
          <CourseCard key={course._id} course={course} />
        ))}
      </div>
    </section>
  );
}

export default CourseCatalog;
