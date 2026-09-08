import { Link } from 'react-router-dom';

import styles from './NotFoundBlock.module.scss';
import { useLocale } from '../../shared/i18n/useLocale';

const NotFoundBlock = () => {
  const { t } = useLocale();
  return (
    <div className={`${styles.root} container`}>
      <span className={styles.code}>404 / NAPOLI</span>
      <h1>{t('Такой страницы нет', 'Page not found')}</h1>
      <p>{t('Адрес мог измениться. Вернитесь в меню — кухня продолжает работать.', 'The address may have changed. Return to the menu — the kitchen is still open.')}</p>
      <Link className="primary-link" to="/menu">{t('Вернуться в меню', 'Back to menu')}</Link>
    </div>
  );
};

export default NotFoundBlock;
