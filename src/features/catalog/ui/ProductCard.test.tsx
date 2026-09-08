import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { setupStore } from '../../../redux/store';
import { CATALOG_PRODUCTS } from '../data/catalog.fixture';
import { ProductCard } from './ProductCard';

const renderCard = (product = CATALOG_PRODUCTS[0]) => {
  const store = setupStore();
  render(
    <BrowserRouter>
      <Provider store={store}>
        <ProductCard product={product} />
      </Provider>
    </BrowserRouter>,
  );
  return store;
};

describe('ProductCard', () => {
  it('exposes a real details link, product facts and responsive sources', () => {
    renderCard();

    expect(screen.getByRole('article', { name: 'Маргарита Napoli' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Маргарита Napoli/ })).toHaveAttribute(
      'href',
      '/menu/margherita-napoli',
    );
    expect(screen.getByText(/Томаты пелати/)).toBeInTheDocument();
    expect(screen.getByText('от 590 ₽')).toBeInTheDocument();
    expect(screen.getByText('глютен, молоко')).toBeInTheDocument();
    expect(screen.getByText('Хит')).toBeInTheDocument();
    expect(screen.getByText('Открыть')).toBeInTheDocument();

    const image = screen.getByRole('img', { name: /Пицца Маргарита/ });
    expect(image).toHaveAttribute('width', '960');
    expect(image).toHaveAttribute('height', '960');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(document.querySelector('source[type="image/avif"]')).toHaveAttribute('srcset', expect.stringContaining('480.avif'));
    expect(document.querySelector('source[type="image/webp"]')).toHaveAttribute('srcset', expect.stringContaining('960.webp'));
  });

  it('preserves geometry with an accessible fallback after image failure', () => {
    renderCard();
    fireEvent.error(screen.getByRole('img', { name: /Пицца Маргарита/ }));

    expect(screen.getByRole('img', { name: 'Изображение “Маргарита Napoli” недоступно' })).toBeInTheDocument();
    expect(screen.getByText('Фото скоро вернётся')).toBeInTheDocument();
  });

  it('links unavailable products to an explained details state', () => {
    const unavailable = CATALOG_PRODUCTS.find((product) => product.slug === 'tonno-cipolla');
    expect(unavailable).toBeDefined();
    renderCard(unavailable!);

    expect(screen.getByText('Временно закончилась')).toBeInTheDocument();
    expect(screen.getByText(/Тунец вернётся/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Тонно и чиполла/ })).toHaveAttribute(
      'href',
      '/menu/tonno-cipolla',
    );
    expect(screen.getByRole('button', { name: 'Добавить в избранное: Тонно и чиполла' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('prefetches only the product receiving user intent', async () => {
    const store = renderCard();
    expect(Object.keys(store.getState().catalogApi.queries)).toHaveLength(0);

    fireEvent.mouseEnter(screen.getByRole('link', { name: /Маргарита Napoli/ }));

    await waitFor(() =>
      expect(Object.keys(store.getState().catalogApi.queries)).toHaveLength(1),
    );
    expect(Object.keys(store.getState().catalogApi.queries)[0]).toContain(
      'margherita-napoli',
    );
  });
});
