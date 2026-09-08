import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import App from '../App';
import { createBaseConfiguration } from '../features/cart/model/cartSlice';
import type { DemoOrderInput } from '../features/order/model/order.types';
import { DemoOrderRepository } from '../features/order/persistence/DemoOrderRepository';
import { setupStore } from '../redux/store';

const orderInput = (): DemoOrderInput => ({
  quote: {
    id: 'quote-track',
    requestKey: 'request-track',
    lines: [{
      configuration: createBaseConfiguration('201', '201-base'),
      quantity: 1,
      name: 'Вечер на двоих',
      unitPriceMinor: 199000,
      totalMinor: 199000,
    }],
    subtotalMinor: 199000,
    discountMinor: 0,
    feeMinor: 19900,
    totalMinor: 218900,
    promo: null,
    fulfillmentMode: 'delivery',
    fulfillmentLabel: 'Тверская, 22',
    etaLabel: '35–45 мин',
    issues: [],
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
  },
  contact: {
    name: 'Анна',
    phone: '+7 900 111-22-33',
    email: 'anna@example.test',
  },
  note: '',
  fulfillment: {
    mode: 'delivery',
    label: 'Тверская, 22',
    address: {
      city: 'Москва',
      street: 'Тверская',
      house: '22',
      apartment: '',
      entrance: '',
      floor: '',
    },
    time: { kind: 'asap' },
  },
});

const renderTracking = () => render(
  <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
    <Provider store={setupStore()}>
      <App />
    </Provider>
  </BrowserRouter>,
);

describe('M9 order tracking route', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => true,
    });
  });

  it('announces the current step, persists progress and freezes while offline', async () => {
    const repository = new DemoOrderRepository(
      window.sessionStorage,
      window.localStorage,
      Date.now,
      () => 'nap_track000000001',
    );
    const order = repository.create(orderInput(), 'idem-track');
    window.history.replaceState({}, '', `/order/${order.id}/track`);
    const user = userEvent.setup();
    const first = renderTracking();

    expect(await screen.findByRole('heading', {
      name: 'Заказ движется к вам',
      level: 1,
    })).toBeInTheDocument();
    let current = document.querySelector('[aria-current="step"]');
    expect(current).not.toBeNull();
    expect(within(current as HTMLElement).getByText('Заказ принят')).toBeInTheDocument();

    await user.click(screen.getByText('Управлять demo-временем'));
    await user.click(screen.getByRole('button', { name: 'Следующий этап' }));
    await user.click(screen.getByRole('button', { name: 'Следующий этап' }));
    current = document.querySelector('[aria-current="step"]');
    expect(within(current as HTMLElement).getByText('В печи')).toBeInTheDocument();

    first.unmount();
    renderTracking();
    current = await screen.findByRole('heading', {
      name: 'В печи',
      level: 2,
    }).then(() => document.querySelector('[aria-current="step"]'));
    expect(within(current as HTMLElement).getByText('В печи')).toBeInTheDocument();

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => false,
    });
    window.dispatchEvent(new Event('offline'));
    expect(await screen.findByText(/Offline · показан последний сохранённый статус/))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Следующий этап' })).toBeDisabled();

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => true,
    });
    window.dispatchEvent(new Event('online'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Следующий этап' })).toBeEnabled(),
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Сценарий tracking' }),
      'delayed',
    );
    expect(screen.getByText('Кухне нужно больше времени')).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Сценарий tracking' }),
      'cancelled',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Demo-заказ отменён');
    expect(document.querySelector('[aria-current="step"]')).toHaveTextContent('Заказ отменён');
  });

  it('gives an expired or unknown tracking link a useful recovery action', async () => {
    window.history.replaceState({}, '', '/order/nap_missing0000000/track');
    renderTracking();
    expect(await screen.findByRole('heading', { name: 'Отслеживание недоступно' }))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Вернуться в меню' }))
      .toHaveAttribute('href', '/menu');
  });
});