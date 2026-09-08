import { Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Header from './components/Header';
import MobileNavigation from './components/MobileNavigation';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { FavoritesPersistenceStatus } from './features/favorites/ui/FavoritesPersistenceStatus';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import { useLocale } from './shared/i18n/useLocale';
import { BRAND_NAME } from './shared/i18n/locale';
import {
  CartPage,
  CheckoutPage,
  FavoritesPage,
  OrderConfirmationPage,
  OrdersPage,
  OrderTrackingPage,
  ProductPage,
} from './routes/lazyRoutes';
import './scss/app.scss';

const RouteLoading = () => {
  const { t } = useLocale();
  return (
    <section className="container route-status" aria-busy="true">
      <span className="status-code">LOAD / NAP</span>
      <h1>{t('Открываем страницу', 'Opening the page')}</h1>
      <p>{t('Подготавливаем актуальные данные.', 'Preparing the latest data.')}</p>
    </section>
  );
};

function App() {
  const location = useLocation();
  const { locale, t } = useLocale();

  useEffect(() => {
    const pageName =
      location.pathname.startsWith('/order/')
        ? t('Заказ', 'Order')
        : location.pathname === '/checkout'
          ? t('Оформление', 'Checkout')
        : location.pathname === '/orders'
          ? t('История заказов', 'Order history')
        : location.pathname === '/favorites'
          ? t('Избранное', 'Favorites')
        : location.pathname === '/cart'
          ? t('Корзина', 'Cart')
        : location.pathname.startsWith('/menu/')
          ? t('Продукт', 'Product')
          : location.pathname === '/menu' || location.pathname === '/'
            ? t('Меню', 'Menu')
            : t('Страница не найдена', 'Page not found');

    document.title = `${pageName} — ${BRAND_NAME}`;
  }, [locale, location.pathname, t]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('К основному содержимому', 'Skip to main content')}
      </a>
      <FavoritesPersistenceStatus />
      <Header />
      <main id="main-content" className="content" tabIndex={-1}>
        <RouteErrorBoundary resetKey={`${location.pathname}${location.search}`}>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Navigate to="/menu" replace />} />
              <Route path="/menu" element={<Home />} />
              <Route path="/menu/:productSlug" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route
                path="/order/:orderId/confirmed"
                element={<OrderConfirmationPage />}
              />
              <Route
                path="/order/:orderId/track"
                element={<OrderTrackingPage />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </main>
      {location.pathname === '/checkout' || location.pathname.startsWith('/order/')
        ? null
        : <MobileNavigation />}
    </div>
  );
}

export default App;




