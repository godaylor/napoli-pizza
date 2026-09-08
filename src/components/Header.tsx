import { Link, NavLink, useLocation } from 'react-router-dom';

import { selectCartCount } from '../features/cart/model/cartSelectors';
import { selectFavoriteCount } from '../features/favorites/model/favoritesSelectors';
import { useAppSelector } from '../redux/hooks';
import { preloadCartPage, preloadFavoritesPage, preloadOrdersPage } from '../routes/lazyRoutes';
import { useLocale } from '../shared/i18n/useLocale';
import { BRAND_NAME } from '../shared/i18n/locale';
import { LanguageSwitcher } from './LanguageSwitcher';
import Search from './Search';
import styles from './Header.module.scss';

const OvenMark = ({ label }: { label: string }) => (
  <svg className={styles.mark} viewBox="0 0 64 64" role="img" aria-label={label}>
    <circle className={styles.markBase} cx="32" cy="32" r="23" />
    <circle className={styles.markHeat} cx="32" cy="32" r="23" />
    <path className={styles.markTomato} d="M14 45a23 23 0 0 0 15 9" />
    <text x="32" y="39" textAnchor="middle">N</text>
  </svg>
);

const CartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6" />
    <circle cx="9" cy="19" r="1.5" />
    <circle cx="17" cy="19" r="1.5" />
  </svg>
);

const getReturnTo = (pathname: string, search: string, state: unknown) => {
  if (pathname === '/menu') {
    return `${pathname}${search}`;
  }

  const candidate = (state as { returnTo?: unknown } | null)?.returnTo;
  return typeof candidate === 'string' && /^\/menu(?:\?|$)/.test(candidate)
    ? candidate
    : '/menu';
};

function Header() {
  const location = useLocation();
  const { t } = useLocale();
  const cartCount = useAppSelector(selectCartCount);
  const favoriteCount = useAppSelector(selectFavoriteCount);
  const returnTo = getReturnTo(
    location.pathname,
    location.search,
    location.state,
  );

  return (
    <header className={styles.header}>
      <div className={styles.rail} aria-label={t('Статус кухни', 'Kitchen status')}>
        <div className={styles.railInner}>
          <span>NAPOLI / {t('МОСКВА', 'MOSCOW')}</span>
          <span className={styles.kitchenStatus}><span aria-hidden="true" />{t('Печи работают', 'Ovens are on')}</span>
          <LanguageSwitcher />
        </div>
      </div>
      <div className={`${styles.inner} container`}>
        <Link className={styles.brand} to="/menu" aria-label={`${BRAND_NAME} — ${t('в меню', 'to menu')}`}>
          <OvenMark label={t('Клеймо печи Napoli', 'Napoli oven mark')} />
          <span className={styles.brandCopy}><strong>{BRAND_NAME}</strong><span>{t('Городская пиццерия', 'Urban pizzeria')}</span></span>
        </Link>
        <div className={styles.fulfillment} aria-label={t('Условия доставки', 'Delivery estimate')}>
          <span>{t('Доставка', 'Delivery')}</span><strong>30–40 {t('мин', 'min')}</strong><small>{t('ориентировочно', 'estimated')}</small>
        </div>
        <div className={styles.searchSlot}><Search /></div>
        <nav className={styles.navigation} aria-label={t('Основная навигация', 'Primary navigation')}>
          <NavLink className={({ isActive }) => isActive ? styles.activeLink : undefined} to="/menu">{t('Меню', 'Menu')}</NavLink>
          <NavLink
            className={({ isActive }) => isActive ? styles.activeLink : undefined}
            to="/favorites"
            onFocus={() => void preloadFavoritesPage()}
            onMouseEnter={() => void preloadFavoritesPage()}>
            {t('Избранное', 'Favorites')}{favoriteCount > 0 ? ` · ${favoriteCount}` : ''}
          </NavLink>          <NavLink
            className={({ isActive }) => isActive ? styles.activeLink : undefined}
            to="/orders"
            onFocus={() => void preloadOrdersPage()}
            onMouseEnter={() => void preloadOrdersPage()}>
            {t('Заказы', 'Orders')}
          </NavLink>
          <NavLink
            className={({ isActive }) => `${styles.cartLink} ${isActive ? styles.activeLink : ''}`}
            to="/cart"
            state={{ returnTo }}
            aria-label={`${t('Корзина, товаров', 'Cart, items')}: ${cartCount}`}
            onFocus={() => void preloadCartPage()}
            onMouseEnter={() => void preloadCartPage()}>
            <CartIcon /><span>{t('Корзина', 'Cart')}</span><span className={styles.cartCount}>{cartCount}</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;

