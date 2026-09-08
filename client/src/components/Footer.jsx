import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <div className="site-footer__links">
        <Link to="/about">{t('nav.about')}</Link>
        <Link to="/contact">{t('nav.contact')}</Link>
        <Link to="/courses">{t('nav.courseCatalog')}</Link>
      </div>
      <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
    </footer>
  );
}

export default Footer;
