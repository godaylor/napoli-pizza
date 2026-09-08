import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import App from '../App';
import { setupStore } from '../redux/store';

const renderAt = (path: string) => {
  window.history.replaceState({}, '', path);
  return render(
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Provider store={setupStore()}>
        <App />
      </Provider>
    </BrowserRouter>,
  );
};

describe('M4A product details and basic cart handoff', () => {
  it('loads a product, changes variant, merges identical adds and returns to discovery URL', async () => {
    const user = userEvent.setup();
    renderAt('/menu?q=маргарита&category=pizza');

    await user.click(await screen.findByRole('link', { name: /Маргарита Napoli/ }));
    expect(await screen.findByRole('heading', { name: 'Маргарита Napoli', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Томаты пелати/)).toBeInTheDocument();
    expect(screen.getByText('глютен, молоко')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /30 см/ }));
    expect(screen.getByRole('status', { name: 'Текущая конфигурация и цена' })).toHaveTextContent('790 ₽');
    const addButton = screen.getByRole('button', { name: 'Добавить за 790 ₽' });
    await user.click(addButton);
    await user.click(addButton);

    expect(screen.getByRole('link', { name: 'Корзина, товаров: 2' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Открыть корзину' }));
    expect(await screen.findByRole('heading', { name: 'Корзина', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('30 см · Тонкое тесто · 510 г')).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('Сумма корзины')).getByText('1 580 ₽'),
    ).toBeInTheDocument();
    expect(screen.getByText('Количество').parentElement).toHaveTextContent('2');
    expect(screen.getByRole('link', { name: 'Продолжить выбор' })).toHaveAttribute(
      'href',
      '/menu?q=%D0%BC%D0%B0%D1%80%D0%B3%D0%B0%D1%80%D0%B8%D1%82%D0%B0&category=pizza',
    );
  });

  it('keeps different removal and modifier recipes as distinct cart lines', async () => {
    const user = userEvent.setup();
    renderAt('/menu/pepperoni-napoli');
    expect(await screen.findByRole('heading', { name: 'Пепперони Napoli' })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /30 см/ }));
    await user.click(screen.getByRole('checkbox', { name: /Убрать красный лук/ }));
    await user.click(screen.getByRole('radio', { name: /Дополнительный сыр/ }));
    expect(
      screen.getByRole('status', { name: 'Текущая конфигурация и цена' }),
    ).toHaveTextContent('Без красного лука');
    expect(
      screen.getByRole('status', { name: 'Текущая конфигурация и цена' }),
    ).toHaveTextContent('1 130 ₽');
    await user.click(screen.getByRole('button', { name: /Добавить за 1.130 ₽/ }));

    await user.click(screen.getByRole('checkbox', { name: /Убрать красный лук/ }));
    await user.click(screen.getByRole('radio', { name: /Обычный сыр/ }));
    await user.click(screen.getByRole('button', { name: 'Добавить за 990 ₽' }));
    expect(screen.getByRole('link', { name: 'Корзина, товаров: 2' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Открыть корзину' }));
    const cart = await screen.findByRole('list', { name: 'Позиции корзины' });
    expect(within(cart).getAllByRole('article', { name: 'Пепперони Napoli' })).toHaveLength(2);
    expect(within(cart).getByText('Без красного лука')).toBeInTheDocument();
    expect(within(cart).getByText('Дополнительный сыр')).toBeInTheDocument();
    expect(within(cart).getByText('Обычный сыр')).toBeInTheDocument();
    expect(screen.getByLabelText('Сумма корзины')).toHaveTextContent('2 120 ₽');
  });

  it('blocks an unavailable selected modifier and exposes a keyboard correction path', async () => {
    const user = userEvent.setup();
    renderAt('/menu/pepperoni-napoli');
    expect(await screen.findByRole('heading', { name: 'Пепперони Napoli' })).toBeInTheDocument();

    const extraCheese = screen.getByRole('radio', { name: /Дополнительный сыр/ });
    extraCheese.focus();
    await user.keyboard('[Space]');
    expect(extraCheese).toBeChecked();
    await user.click(screen.getByText('Проверить доступность добавок'));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Демо-сценарий' }),
      'extra-cheese-unavailable',
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Дополнительный сыр закончился');
    expect(within(alert).getByRole('link', { name: 'Перейти к выбору' })).toHaveAttribute(
      'href',
      '#modifier-group-cheese-style',
    );
    expect(screen.getByRole('button', { name: 'Добавить за 930 ₽' })).toBeDisabled();

    const standardCheese = screen.getByRole('radio', { name: /Обычный сыр/ });
    standardCheese.focus();
    await user.keyboard('[Space]');
    expect(standardCheese).toBeChecked();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добавить за 790 ₽' })).toBeEnabled();
  });
  it('renders loading and not-found states on a direct product route', async () => {
    renderAt('/menu/not-in-catalog');
    expect(await screen.findByRole('heading', { name: 'Открываем продукт' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Такого продукта нет' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Вернуться в меню' })).toHaveAttribute(
      'href',
      '/menu',
    );
  });

  it('explains unavailable product and impossible variant combinations', async () => {
    const user = userEvent.setup();
    renderAt('/menu/tonno-cipolla');
    expect(await screen.findByRole('heading', { name: 'Тонно и чиполла' })).toBeInTheDocument();
    expect(screen.getAllByText(/Тунец вернётся/)).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Добавить за 890 ₽' })).toBeDisabled();

    window.history.replaceState({}, '', '/menu/margherita-napoli');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(await screen.findByRole('heading', { name: 'Маргарита Napoli' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /35 см/ }));
    expect(screen.getByText(/не готовим/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выберите доступный вариант' })).toBeDisabled();
  });
});