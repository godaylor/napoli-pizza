import { Link } from 'react-router-dom';

import { BRAND_NAME } from '../shared/i18n/locale';
import { useLocale } from '../shared/i18n/useLocale';
import styles from './SiteFooter.module.scss';

export function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} container`}>
        <div className={styles.identity}>
          <Link className={styles.brand} to="/menu" aria-label={`${BRAND_NAME} — ${t('к меню', 'back to menu')}`}>
            <span className={styles.ring} aria-hidden="true">N</span>
            <span translate="no">{BRAND_NAME}</span>
          </Link>
          <p>{t('Городская пиццерия', 'Urban pizzeria')}</p>
        </div>
        <nav className={styles.links} aria-label={t('Навигация внизу страницы', 'Footer navigation')}>
          <Link to="/menu">{t('Меню', 'Menu')} <span aria-hidden="true">↗</span></Link>
          <Link to="/orders">{t('Мои заказы', 'My orders')} <span aria-hidden="true">↗</span></Link>
        </nav>
        <p className={styles.note}>
          {t(
            'Демонстрационный проект. Заказы тестовые, оплата без списания.',
            'A demo project. Orders are for testing; no payment is taken.',
          )}
        </p>
      </div>
    </footer>
  );
}
