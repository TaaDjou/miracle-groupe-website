import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

function navClass({ isActive }) {
  return isActive ? 'sidebar__link active' : 'sidebar__link';
}

function NavSection({ label, children }) {
  return (
    <div className="sidebar__section">
      <div className="sidebar__section-label">{label}</div>
      {children}
    </div>
  );
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

function Sidebar({ open, onClose }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/');
  };

  const initial = user?.name?.trim()?.[0]?.toUpperCase() || '?';

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link to="/" className="sidebar__brand" onClick={onClose}>
          {t('nav.brand')}
        </Link>

        <nav className="sidebar__nav">
          <NavSection label={t('nav.sectionOverview')}>
            <NavLink to="/" end className={navClass} onClick={onClose}>
              {t('nav.home')}
            </NavLink>
          </NavSection>

          <NavSection label={t('nav.sectionOnlineCourses')}>
            <NavLink to="/live-sessions" className={navClass} onClick={onClose}>
              {t('nav.eLearning')}
            </NavLink>
            <NavLink to="/courses" className={navClass} onClick={onClose}>
              {t('nav.courseCatalog')}
            </NavLink>
          </NavSection>

          <NavSection label={t('nav.sectionInPerson')}>
            <NavLink to="/in-person-sessions" className={navClass} onClick={onClose}>
              {t('nav.upcomingSessions')}
            </NavLink>
          </NavSection>

          <NavSection label={t('nav.sectionClassroomRenting')}>
            <NavLink to="/classrooms" className={navClass} onClick={onClose}>
              {t('nav.browseAndRent')}
            </NavLink>
          </NavSection>

          {isAuthenticated && (
            <NavSection label={t('nav.sectionMyLearning')}>
              <NavLink to="/dashboard" className={navClass} onClick={onClose}>
                {t('nav.dashboard')}
              </NavLink>
            </NavSection>
          )}

          {isAuthenticated && (user.role === 'instructor' || user.role === 'admin') && (
            <NavSection label={t('nav.sectionTeaching')}>
              <NavLink to="/instructor" className={navClass} onClick={onClose}>
                {t('nav.teachingHub')}
              </NavLink>
            </NavSection>
          )}

          {isAuthenticated && user.role === 'admin' && (
            <NavSection label={t('nav.sectionAdmin')}>
              <NavLink to="/admin" end className={navClass} onClick={onClose}>
                {t('nav.adminOverview')}
              </NavLink>
              <NavLink to="/admin/courses" className={navClass} onClick={onClose}>
                {t('nav.adminCourses')}
              </NavLink>
              <NavLink to="/admin/sessions" className={navClass} onClick={onClose}>
                {t('nav.adminSessions')}
              </NavLink>
              <NavLink to="/admin/users" className={navClass} onClick={onClose}>
                {t('nav.adminStudents')}
              </NavLink>
              <NavLink to="/admin/course-purchases" className={navClass} onClick={onClose}>
                {t('nav.adminCoursePurchases')}
              </NavLink>
              <NavLink to="/admin/classroom-bookings" className={navClass} onClick={onClose}>
                {t('nav.adminClassroomRequests')}
              </NavLink>
              <NavLink to="/admin/classrooms" className={navClass} onClick={onClose}>
                {t('nav.adminClassrooms')}
              </NavLink>
              <NavLink to="/admin/instructor-applications" className={navClass} onClick={onClose}>
                {t('nav.adminInstructorApplications')}
              </NavLink>
            </NavSection>
          )}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__meta-links">
            <Link to="/about" onClick={onClose}>
              {t('nav.about')}
            </Link>
            <Link to="/contact" onClick={onClose}>
              {t('nav.contact')}
            </Link>
          </div>

          <select
            className="language-switcher"
            value={i18n.resolvedLanguage || i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            aria-label={t('nav.languageAriaLabel')}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>

          {isAuthenticated ? (
            <>
              <span className="sidebar__user">
                <span className="avatar">{initial}</span>
                {user.name}
              </span>
              <button type="button" className="btn-secondary" onClick={handleLogout}>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <div className="sidebar__auth-links">
              <Link to="/login" className="btn-secondary" onClick={onClose}>
                {t('nav.login')}
              </Link>
              <Link to="/register" className="btn" onClick={onClose}>
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
