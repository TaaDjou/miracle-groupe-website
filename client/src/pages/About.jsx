import { useTranslation } from 'react-i18next';

function About() {
  const { t } = useTranslation();
  return (
    <section>
      <div className="page-header">
        <h1>{t('about.title')}</h1>
        <p>{t('about.intro')}</p>
      </div>
    </section>
  );
}

export default About;
