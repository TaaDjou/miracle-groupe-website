import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

function AdminCourses() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/admin/courses')
      .then((res) => setCourses(res.data))
      .catch(() => setError(t('admin.couldNotLoadCourses')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleTogglePublish = async (course) => {
    try {
      await api.put(`/courses/${course._id}`, { published: !course.published });
      load();
    } catch {
      setError(t('teaching.couldNotUpdateCourse'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('teaching.confirmDeleteCourse'))) return;
    try {
      await api.delete(`/courses/${id}`);
      load();
    } catch {
      setError(t('teaching.couldNotDeleteCourse'));
    }
  };

  if (loading) return <p>{t('admin.loadingCourses')}</p>;

  return (
    <section className="text-left">
      <div className="dashboard-item__row">
        <h1>{t('admin.allCoursesTitle')}</h1>
        <Link to="/instructor/courses/new" className="btn">
          {t('teaching.newCourse')}
        </Link>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>{t('courseBuilder.title')}</th>
              <th>{t('admin.instructor')}</th>
              <th>{t('admin.status')}</th>
              <th>{t('admin.created')}</th>
              <th>{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course._id}>
                <td className="wrap">
                  <Link to={`/courses/${course._id}`}>{course.title}</Link>
                </td>
                <td>{course.instructor?.name}</td>
                <td>
                  <span className="badge" data-status={course.published ? 'published' : 'draft'}>
                    {course.published ? t('common.published') : t('common.draft')}
                  </span>
                </td>
                <td>{new Date(course.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/instructor/courses/${course._id}/edit`} className="btn btn-secondary">
                      {t('common.edit')}
                    </Link>
                    <button type="button" className="btn-secondary" onClick={() => handleTogglePublish(course)}>
                      {course.published ? t('teaching.unpublish') : t('teaching.publish')}
                    </button>
                    <button type="button" className="btn-danger" onClick={() => handleDelete(course._id)}>
                      {t('common.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminCourses;
