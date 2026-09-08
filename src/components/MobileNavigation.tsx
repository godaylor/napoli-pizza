import { Link, NavLink, useLocation } from 'react-router-dom';

import { selectCartCount } from '../features/cart/model/cartSelectors';
import { selectFavoriteCount } from '../features/favorites/model/favoritesSelectors';
import { useAppSelector } from '../redux/hooks';
import { preloadCartPage, preloadFavoritesPage, preloadOrdersPage } from '../routes/lazyRoutes';
import styles from './MobileNavigation.module.scss';
import { useLocale } from '../shared/i18n/useLocale';

const MenuIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>;
const FavoriteIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20 4.5 13A5.1 5.1 0 0 1 12 6a5.1 5.1 0 0 1 7.5 7Z" /></svg>;
const OrdersIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v16H7zM9.5 9h5M9.5 13h5M9.5 17h3" /></svg>;
const CartIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2 10h11l2-7H6" /><circle cx="9" cy="19" r="1" /><circle cx="17" cy="19" r="1" /></svg>;

function MobileNavigation() {
  const location = useLocation();
  const cartCount = useAppSelector(selectCartCount);
  const favoriteCount = useAppSelector(selectFavoriteCount);
  const { t } = useLocale();

  if (location.pathname.startsWith('/menu/')) {
    return null;
  }

  const returnTo = location.pathname === '/menu'
    ? `${location.pathname}${location.search}`
    : '/menu';

  return (
    <nav className={styles.navigation} aria-label={t('Мобильная навигация', 'Mobile navigation')}>
      <NavLink to="/menu"><MenuIcon /><span>{t('Меню', 'Menu')}</span></NavLink>
      <a href="#catalog-search"><SearchIcon /><span>{t('Поиск', 'Search')}</span></a>
      <NavLink to="/favorites" onFocus={() => void preloadFavoritesPage()}>
        <FavoriteIcon /><span>{t('Избранное', 'Favorites')}{favoriteCount > 0 ? ` · ${favoriteCount}` : ''}</span>
      </NavLink>      <NavLink to="/orders" onFocus={() => void preloadOrdersPage()}>
        <OrdersIcon /><span>{t('Заказы', 'Orders')}</span>
      </NavLink>
      <Link
        to="/cart"
        state={{ returnTo }}
        aria-label={`${t('Корзина, товаров', 'Cart, items')}: ${cartCount}`}
        onFocus={() => void preloadCartPage()}>
        <CartIcon /><span>{t('Корзина', 'Cart')} {cartCount > 0 ? `· ${cartCount}` : ''}</span>
      </Link>
    </nav>
  );
}

export default MobileNavigation;

