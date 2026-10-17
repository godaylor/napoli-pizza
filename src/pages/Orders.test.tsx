import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getDemoOrderRepository,
  ORDER_HISTORY_STORAGE_KEY,
} from '../features/order/persistence/DemoOrderRepository';
import { setupStore } from '../redux/store';
import Orders from './Orders';

describe('Orders', () => {
  beforeEach(() => {
    getDemoOrderRepository().clearHistory();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('shows the saved status offline and catches up on reconnect without visiting tracking', async () => {
    let online = false;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
    localStorage.setItem(ORDER_HISTORY_STORAGE_KEY, JSON.stringify({
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      orders: [{
        id: 'nap_offlinehistory',
        source: 'order',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 120_000).toISOString(),
        tracking: { clockOffsetMs: 0, elapsedFloorMs: 0, scenario: 'default' },
        lines: [],
        subtotalMinor: 59000,
        discountMinor: 0,
        feeMinor: 19900,
        totalMinor: 78900,
        promoCode: null,
        fulfillmentMode: 'delivery',
        fulfillmentLabel: 'Доставка',
      }],
    }));
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <Provider store={setupStore()}><Orders /></Provider>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Заказ принят')).toBeInTheDocument();
    online = true;
    act(() => window.dispatchEvent(new Event('online')));
    expect(await screen.findByText('Доставлен')).toBeInTheDocument();
    expect(screen.queryByText('Заказ принят')).not.toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByText('DEMO / НЕПЕРСОНАЛЬНЫЙ')).toBeInTheDocument());
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
