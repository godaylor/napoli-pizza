import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import App from '../App';
import { cartConfigurationFingerprint } from '../features/cart/model/cartConfiguration';
import type { CartConfiguration } from '../features/cart/model/cart.types';
import { saveCart, type StorageLike } from '../features/cart/persistence/cartPersistence';
import { setupStore } from '../redux/store';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const pizza: CartConfiguration = {
  productId: '101',
  variantId: '101-25-thin',
  removedIngredientIds: [],
  modifierSelections: [{ groupId: 'cheese-style', modifierIds: ['standard-cheese'] }],
};

const combo: CartConfiguration = {
  productId: '201',
  variantId: '201-base',
  removedIngredientIds: [],
  modifierSelections: [],
};

const renderCheckout = (
  withCart = true,
  configuration = pizza,
  quantity = 1,
) => {
  const storage = new MemoryStorage();
  if (withCart) {
    saveCart(storage, [{
      configuration,
      fingerprint: cartConfigurationFingerprint(configuration),
      quantity,
    }]);
  }
  window.history.replaceState({}, '', '/checkout');
  return {
    storage,
    ...render(
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Provider store={setupStore({ storage })}>
          <App />
        </Provider>
      </BrowserRouter>,
    ),
  };
};

describe('M6A guest delivery checkout', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('confirms fee/ETA as guest and marks the quote stale after address change', async () => {
    const user = userEvent.setup();
    renderCheckout();
    expect(await screen.findByRole('heading', { name: 'Доставка', level: 1 })).toBeInTheDocument();
    expect(screen.queryByText(/регистрац/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Проверить адрес' }));
    expect(await screen.findByText('Адрес подтверждён')).toBeInTheDocument();
    expect(screen.getByText('Тверская, 22 · 35–45 мин')).toBeInTheDocument();
    const summary = screen.getByLabelText('Предварительный итог');
    expect(within(summary).getByText('199 ₽')).toBeInTheDocument();
    expect(within(summary).getByText('789 ₽')).toBeInTheDocument();

    const house = screen.getByRole('textbox', { name: 'Дом' });
    await user.clear(house);
    await user.type(house, '23');
    expect(screen.getByText('Расчёт устарел')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повторить расчёт' })).toBeEnabled();
  });

  it('focuses the first invalid field and recovers from an out-of-zone quote', async () => {
    const user = userEvent.setup();
    renderCheckout();
    await screen.findByRole('heading', { name: 'Доставка', level: 1 });
    const name = screen.getByRole('textbox', { name: 'Имя' });
    await user.clear(name);
    await user.click(screen.getByRole('button', { name: 'Проверить адрес' }));
    expect(name).toHaveFocus();
    expect(screen.getByText('Введите имя.')).toBeInTheDocument();

    await user.type(name, 'Анна');
    await user.click(screen.getByText('Проверить delivery recovery'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Демо-сценарий' }), 'unserviceable');
    await user.click(screen.getByRole('button', { name: 'Проверить адрес' }));
    expect(await screen.findByText(/вне демо-зоны/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^Улица/ })).toHaveFocus();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Демо-сценарий' }), 'default');
    await user.click(screen.getByRole('button', { name: 'Повторить расчёт' }));
    expect(await screen.findByText('Адрес подтверждён')).toBeInTheDocument();
  });

  it('restores the active session draft and rejects an empty cart', async () => {
    const user = userEvent.setup();
    const first = renderCheckout();
    const street = await screen.findByRole('textbox', { name: 'Улица' });
    await user.clear(street);
    await user.type(street, 'Петровка');
    await new Promise((resolve) => window.setTimeout(resolve, 160));
    first.unmount();

    window.history.replaceState({}, '', '/checkout');
    render(
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Provider store={setupStore({ storage: first.storage })}>
          <App />
        </Provider>
      </BrowserRouter>,
    );
    expect(await screen.findByRole('textbox', { name: 'Улица' })).toHaveValue('Петровка');
  });

  it('never renders a misleading checkout for an empty cart', async () => {
    renderCheckout(false);
    expect(await screen.findByRole('heading', { name: 'Корзина не готова к оформлению' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Вернуться в корзину' })).toHaveAttribute('href', '/cart');
  });
});
describe('M6B pickup, scheduling and recovery', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('switches modes, schedules pickup and restores safe delivery draft fields', async () => {
    const user = userEvent.setup();
    const view = renderCheckout();
    await screen.findByRole('heading', { name: 'Доставка', level: 1 });
    const street = screen.getByRole('textbox', { name: 'Улица' });
    await user.clear(street);
    await user.type(street, 'Петровка');

    await user.click(screen.getByRole('radio', { name: 'Самовывоз' }));
    expect(screen.getByRole('heading', { name: 'Самовывоз', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Адрес доставки' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Улица' })).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Пиццерия' }),
      'store-kurskaya',
    );
    await user.click(screen.getByRole('button', { name: 'Проверить самовывоз' }));
    expect(await screen.findByText('Самовывоз подтверждён')).toBeInTheDocument();
    expect(screen.getAllByText(/Napoli · Курская/).length).toBeGreaterThan(0);
    expect(within(screen.getByLabelText('Предварительный итог')).getByText('Бесплатно')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /^Ко времени/ }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Доступное время' }),
      'today-2030',
    );
    expect(screen.getByText('Расчёт устарел')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Повторить расчёт' }));
    expect(await screen.findByText(/Сегодня, 20:30–21:00/)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Доставка' }));
    expect(screen.getByRole('textbox', { name: 'Улица' })).toHaveValue('Петровка');
    const localPayload = view.storage.values.get('napoli:commerce:v1') ?? '';
    expect(localPayload).not.toContain('Петровка');
  });

  it('offers concrete alternatives for closed store and unavailable slot', async () => {
    const user = userEvent.setup();
    renderCheckout();
    await screen.findByRole('heading', { name: 'Доставка', level: 1 });
    await user.click(screen.getByRole('radio', { name: 'Самовывоз' }));
    await user.click(screen.getByText('Проверить delivery recovery'));
    const scenario = screen.getByRole('combobox', { name: 'Демо-сценарий' });

    await user.selectOptions(scenario, 'closed-store');
    await user.click(screen.getByRole('button', { name: 'Проверить самовывоз' }));
    expect(await screen.findByText(/пиццерия сейчас закрыта/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Выбрать Napoli · Курская' }));
    expect(screen.getByRole('combobox', { name: 'Пиццерия' })).toHaveValue('store-kurskaya');
    await user.click(screen.getByRole('button', { name: 'Повторить расчёт' }));
    expect(await screen.findByText('Самовывоз подтверждён')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /^Ко времени/ }));
    await user.selectOptions(scenario, 'slot-unavailable');
    await user.click(screen.getByRole('button', { name: 'Повторить расчёт' }));
    expect(await screen.findByText(/время уже недоступно/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Выбрать ASAP' }));
    expect(screen.getByRole('radio', { name: /^Как можно скорее/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Повторить расчёт' }));
    expect((await screen.findAllByText(/Готово через 20–25 мин/)).length).toBeGreaterThan(0);
  });
});
describe('M7 promo codes and authoritative final quote', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('applies, stales, refreshes and authoritatively removes a valid promo', async () => {
    const user = userEvent.setup();
    renderCheckout(true, combo);
    await screen.findByRole('heading', { name: 'Доставка', level: 1 });
    await user.click(screen.getByRole('button', { name: 'Проверить адрес' }));
    await screen.findByText('Адрес подтверждён');

    const promo = screen.getByRole('textbox', { name: 'Промокод · необязательно' });
    await user.type(promo, ' napoli10 ');
    await user.click(screen.getByRole('button', { name: 'Применить промокод' }));
    expect(await screen.findByText('Финальный итог подтверждён')).toBeInTheDocument();
    const summary = screen.getByLabelText('Предварительный итог');
    expect(within(summary).getByText('Скидка · NAPOLI10')).toBeInTheDocument();
    expect(within(summary).getByText('−199 ₽')).toBeInTheDocument();
    expect(within(summary).getAllByText('1 990 ₽')).toHaveLength(3);
    expect(screen.getByText(/Итог принят/)).toBeInTheDocument();

    const house = screen.getByRole('textbox', { name: 'Дом' });
    await user.clear(house);
    await user.type(house, '23');
    expect(screen.getByText('Финальный расчёт устарел')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Повторить расчёт' }));
    await screen.findByText('Адрес подтверждён');
    await user.click(screen.getByRole('button', { name: 'Применить промокод' }));
    expect(await screen.findByText('Финальный итог подтверждён')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Удалить промокод' }));
    const acknowledgement = await screen.findByRole('checkbox', {
      name: 'Я проверил обновлённые итог и время',
    });
    expect(acknowledgement).not.toBeChecked();
    expect(screen.queryByText(/Итог принят/)).not.toBeInTheDocument();
    await user.click(acknowledgement);
    expect(screen.getByText(/Итог принят/)).toBeInTheDocument();
    expect(within(summary).queryByText(/Скидка/)).not.toBeInTheDocument();
    expect(within(summary).getByText('2 189 ₽')).toBeInTheDocument();
  });

  it('announces invalid, expired and minimum outcomes without changing totals', async () => {
    const user = userEvent.setup();
    renderCheckout();
    await screen.findByRole('heading', { name: 'Доставка', level: 1 });
    await user.click(screen.getByRole('button', { name: 'Проверить адрес' }));
    await screen.findByText('Адрес подтверждён');

    const promo = screen.getByRole('textbox', { name: 'Промокод · необязательно' });
    const cases = [
      ['UNKNOWN', /Такого промокода нет/],
      ['EXPIRED22', /Промокод EXPIRED22 истёк/],
      ['NAPOLI10', /действует от 1 000 ₽/],
    ];
    for (const [code, message] of cases) {
      await user.clear(promo);
      await user.type(promo, code as string);
      await user.click(screen.getByRole('button', { name: 'Применить промокод' }));
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(promo).toHaveFocus();
    }

    const summary = screen.getByLabelText('Предварительный итог');
    expect(within(summary).queryByText(/Скидка/)).not.toBeInTheDocument();
    expect(within(summary).getByText('789 ₽')).toBeInTheDocument();
  });

  it('retries a failed final quote without losing checkout fields', async () => {
    const user = userEvent.setup();
    renderCheckout();
    await screen.findByRole('heading', { name: 'Доставка', level: 1 });
    await user.click(screen.getByRole('button', { name: 'Проверить адрес' }));
    await screen.findByText('Адрес подтверждён');
    const street = screen.getByRole('textbox', { name: 'Улица' });

    await user.click(screen.getByText('Демо-коды и promo recovery'));
    const scenario = screen.getByRole('combobox', {
      name: 'Сценарий финального расчёта',
    });
    await user.selectOptions(scenario, 'error');
    await user.click(screen.getByRole('button', { name: 'Подтвердить итог' }));
    expect(await screen.findByText(/Не удалось подтвердить финальный итог/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Промокод · необязательно' })).toHaveFocus();
    expect(street).toHaveValue('Тверская');

    await user.selectOptions(scenario, 'default');
    await user.click(screen.getByRole('button', { name: 'Подтвердить итог' }));
    expect(await screen.findByText('Финальный итог подтверждён')).toBeInTheDocument();
  });
});
describe('M8 mock payment, order and confirmation', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('preserves the quote on decline, retries and reloads one confirmation', async () => {
    const user = userEvent.setup();
    const view = renderCheckout(true, combo);
    await screen.findByRole('heading', { name: 'Доставка', level: 1 });
    await user.click(screen.getByRole('button', { name: 'Проверить адрес' }));
    await screen.findByText('Адрес подтверждён');
    await user.click(screen.getByRole('button', { name: 'Подтвердить итог' }));
    await screen.findByText('Финальный итог подтверждён');

    const outcome = screen.getByRole('combobox', { name: 'Исход demo payment' });
    await user.selectOptions(outcome, 'decline');
    await user.click(screen.getByRole('button', {
      name: /Оплатить .* и оформить/,
    }));
    expect(await screen.findByText('Demo payment отклонён')).toBeInTheDocument();
    expect(screen.getByText('Финальный итог подтверждён')).toBeInTheDocument();

    await user.selectOptions(outcome, 'success');
    await user.click(screen.getByRole('button', {
      name: /Оплатить .* и оформить/,
    }));
    expect(await screen.findByRole('heading', {
      name: 'Заказ подтверждён',
      level: 1,
    })).toBeInTheDocument();
    const orderId = screen.getByRole('heading', {
      name: /^nap_/,
      level: 2,
    }).textContent ?? '';
    expect(orderId).toMatch(/^nap_[a-z0-9]{16}$/);

    const activeRaw = window.sessionStorage.getItem(
      'napoli:active-order:v1',
    ) ?? '';
    const historyRaw = window.localStorage.getItem(
      'napoli:order-history:v1',
    ) ?? '';
    expect(activeRaw).toContain('+7 900 000-22-22');
    expect(historyRaw).not.toContain('Гость Napoli');
    expect(historyRaw).not.toContain('demo@napoli.test');
    expect(historyRaw.toLowerCase()).not.toContain('cvc');
    expect(historyRaw.toLowerCase()).not.toContain('pan');
    expect(JSON.parse(historyRaw).orders).toHaveLength(1);

    view.unmount();
    window.history.replaceState({}, '', '/order/' + orderId + '/confirmed');
    render(
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Provider store={setupStore({ storage: view.storage })}>
          <App />
        </Provider>
      </BrowserRouter>,
    );
    expect(await screen.findByRole('heading', {
      name: 'Заказ подтверждён',
      level: 1,
    })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: orderId, level: 2 })).toBeInTheDocument();
  });

  it('shows a helpful state for an unknown or expired confirmation link', async () => {
    window.history.replaceState({}, '', '/order/nap_missing/confirmed');
    render(
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Provider store={setupStore()}>
          <App />
        </Provider>
      </BrowserRouter>,
    );
    expect(await screen.findByRole('heading', {
      name: 'Заказ не найден или истёк',
      level: 1,
    })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Вернуться в меню' })).toHaveAttribute(
      'href',
      '/menu',
    );
  });
});
