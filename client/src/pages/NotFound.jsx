import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function NotFound() {
  const { t } = useTranslation();
  return (
    <section>
      <h1>{t('notFound.title')}</h1>
      <Link to="/">{t('notFound.backHome')}</Link>
    </section>
  );
}

export default NotFound;
