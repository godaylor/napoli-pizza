import { lazy } from 'react';

const loadProductPage = () => import('../pages/Product');
const loadCartPage = () => import('../pages/Cart');
const loadCheckoutPage = () => import('../pages/Checkout');
const loadOrderConfirmationPage = () => import('../pages/OrderConfirmation');
const loadOrderTrackingPage = () => import('../pages/OrderTracking');
const loadFavoritesPage = () => import('../pages/Favorites');
const loadOrdersPage = () => import('../pages/Orders');

export const ProductPage = lazy(loadProductPage);
export const CartPage = lazy(loadCartPage);
export const CheckoutPage = lazy(loadCheckoutPage);
export const OrderConfirmationPage = lazy(loadOrderConfirmationPage);
export const OrderTrackingPage = lazy(loadOrderTrackingPage);
export const FavoritesPage = lazy(loadFavoritesPage);
export const OrdersPage = lazy(loadOrdersPage);

export const preloadProductPage = loadProductPage;
export const preloadCartPage = loadCartPage;
export const preloadCheckoutPage = loadCheckoutPage;
export const preloadOrderConfirmationPage = loadOrderConfirmationPage;
export const preloadOrderTrackingPage = loadOrderTrackingPage;
export const preloadFavoritesPage = loadFavoritesPage;
export const preloadOrdersPage = loadOrdersPage;

