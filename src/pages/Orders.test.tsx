import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { setupStore } from '../redux/store';
import Orders from './Orders';

describe('Orders', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('labels seeded data, reviews current offer and merges only after confirmation', async () => {
    const user = userEvent.setup();
    const store = setupStore();
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <Provider store={store}><Orders /></Provider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Недавних заказов нет' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Показать demo-заказ' }));
    expect(screen.getByText('DEMO / НЕПЕРСОНАЛЬНЫЙ')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Повторить заказ' }));

    expect(await screen.findByRole('heading', { name: /Повторить nap_demo/ })).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: 'Добавить выбранное в корзину' });
    expect(confirm).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: /Я проверил текущие цены/ }));
    await user.click(confirm);

    expect(store.getState().cart.lines).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('В корзину добавлено позиций: 1');
  });
});
