import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { toggleFavorite } from '../features/favorites/model/favoritesSlice';
import { setupStore } from '../redux/store';
import Favorites from './Favorites';

const renderFavorites = (productIds: string[]) => {
  const store = setupStore();
  productIds.forEach((productId) => store.dispatch(toggleFavorite(productId)));
  render(
    <MemoryRouter initialEntries={['/favorites']}>
      <Provider store={store}><Favorites /></Provider>
    </MemoryRouter>,
  );
  return store;
};

describe('Favorites', () => {
  it('offers a useful guest-first empty state', () => {
    renderFavorites([]);
    expect(screen.getByRole('heading', { level: 1, name: 'Избранное пока пусто' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Выбрать из меню' })).toHaveAttribute('href', '/menu');
    expect(screen.queryByText(/аккаунт/i)).not.toBeInTheDocument();
  });

  it('shows current and removed items, then recovers to empty', async () => {
    const user = userEvent.setup();
    renderFavorites(['101', 'missing-product']);

    expect(await screen.findByRole('article', { name: 'Маргарита Napoli' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Позиция ушла из меню' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Убрать недоступную позицию' }));
    await user.click(screen.getByRole('button', { name: 'Убрать из избранного: Маргарита Napoli' }));
    expect(screen.getByRole('heading', { name: 'Избранное пока пусто' })).toBeInTheDocument();
  });
});
