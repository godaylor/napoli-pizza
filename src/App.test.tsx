import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import App from './App';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { setupStore } from './redux/store';
import { LocaleProvider } from './shared/i18n/LocaleProvider';

const renderAt = (path: string) => {
  window.history.replaceState({}, '', path);
  return render(
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <LocaleProvider>
        <Provider store={setupStore()}><App /></Provider>
      </LocaleProvider>
    </BrowserRouter>,
  );
};

describe('Napoli owned menu', () => {
  it('redirects the root to canonical /menu and renders every owned category', async () => {
    renderAt('/');
    expect(await screen.findByText('Маргарита Napoli')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/menu');
    for (const heading of ['Пицца', 'Комбо', 'Закуски', 'Напитки', 'Десерты', 'Соусы']) {
      expect(screen.getByRole('heading', { name: heading, level: 2 })).toBeInTheDocument();
    }
    expect(document.querySelectorAll('[data-product-card]')).toHaveLength(36);
  });

  it('uses the canonical URL as the only category, sort and search state', async () => {
    const user = userEvent.setup();
    renderAt('/menu');
    await screen.findByText('Маргарита Napoli');

    await user.click(screen.getByRole('button', { name: 'Комбо' }));
    await waitFor(() => expect(document.querySelectorAll('[data-product-card]')).toHaveLength(4));
    expect(window.location.search).toBe('?category=combo');
    expect(screen.queryByRole('heading', { name: 'Пицца', level: 2 })).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Сначала' }),
      'price-asc',
    );
    await waitFor(() =>
      expect(window.location.search).toBe('?category=combo&sort=price-asc'),
    );
    await user.click(screen.getByRole('button', { name: 'Все' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Поиск по меню' }),
      'тирамису',
    );
    await waitFor(() =>
      expect(new URLSearchParams(window.location.search).get('q')).toBe('тирамису'),
    );
    expect(await screen.findByText('Тирамису')).toBeInTheDocument();
    await waitFor(() =>
      expect(document.querySelectorAll('[data-product-card]')).toHaveLength(1),
    );
    expect(document.querySelector('[class*="pagination"]')).not.toBeInTheDocument();
  });

  it('intersects canonical filters, announces count and recovers from no results', async () => {
    const user = userEvent.setup();
    renderAt('/menu?category=drinks&spicy=1');

    expect(await screen.findByRole('heading', { name: 'Ничего не нашли' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Напитки' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('checkbox', { name: 'Острое' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Снять фильтр «Острое»' }));
    expect(await screen.findByText('Базиликовый лимонад')).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).toBe('?category=drinks'));
    expect(screen.getByRole('status')).toHaveTextContent('Найдено позиций: 5');
  });

  it('restores a shared multi-filter URL directly', async () => {
    renderAt(
      '/menu?q=трюфель&category=pizza&sort=price-asc&diet=vegetarian&availability=1',
    );

    expect(await screen.findByText('Фунги тартуфо')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-product-card]')).toHaveLength(1);
    expect(screen.getByRole('searchbox', { name: 'Поиск по меню' })).toHaveValue(
      'трюфель',
    );
    expect(screen.getByRole('button', { name: 'Пицца' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('combobox', { name: 'Сначала' })).toHaveValue(
      'price-asc',
    );
    expect(screen.getByRole('checkbox', { name: 'Без мяса' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Только доступное' })).toBeChecked();
  });

  it('shows first-load skeleton, empty and 500 states and recovers without reload', async () => {
    const user = userEvent.setup();
    renderAt('/menu');
    expect(screen.getByRole('heading', { name: 'Загружаем меню' })).toBeInTheDocument();
    await screen.findByText('Маргарита Napoli');

    await user.click(screen.getByText('Проверить состояния каталога'));
    const scenario = screen.getByRole('combobox', { name: 'Демо-сценарий' });
    await user.selectOptions(scenario, 'empty');
    expect(await screen.findByRole('heading', { name: 'В меню ничего не найдено' })).toBeInTheDocument();

    await user.selectOptions(scenario, 'error');
    expect(await screen.findByRole('heading', { name: 'Не удалось загрузить каталог' })).toBeInTheDocument();
    await user.selectOptions(scenario, 'default');
    expect(await screen.findByText('Маргарита Napoli')).toBeInTheDocument();
  });

  it('keeps stale products usable during a background refetch', async () => {
    const user = userEvent.setup();
    renderAt('/menu');
    await screen.findByText('Маргарита Napoli');
    await user.click(screen.getByText('Проверить состояния каталога'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Демо-сценарий' }), 'stale');

    expect(await screen.findByText('Обновляем меню, предыдущие позиции доступны')).toBeInTheDocument();
    expect(screen.getByText('Маргарита Napoli')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Обновляем меню, предыдущие позиции доступны')).not.toBeInTheDocument(), { timeout: 2_000 });
  });

  it('shows offline recovery while keeping Napoli navigation available', async () => {
    const user = userEvent.setup();
    renderAt('/menu');
    await screen.findByText('Маргарита Napoli');
    await user.click(screen.getByText('Проверить состояния каталога'));
    const scenario = screen.getByRole('combobox', { name: 'Демо-сценарий' });
    await user.selectOptions(scenario, 'offline');

    expect(await screen.findByRole('heading', { name: 'Нет соединения с интернетом' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Napoli — в меню' })).toBeInTheDocument();
    await user.selectOptions(scenario, 'default');
    expect(await screen.findByText('Маргарита Napoli')).toBeInTheDocument();
  });
});

describe('Napoli shell and routes remain green', () => {
  it('exposes brand landmarks, navigation, skip target and Russian metadata', async () => {
    renderAt('/menu');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('link', { name: 'К основному содержимому' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('navigation', { name: 'Основная навигация' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Мобильная навигация' })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Меню — Napoli'));
    expect(document.documentElement.lang).toBe('ru');
  });

  it('renders honest cart and not-found routes with canonical menu links', async () => {
    renderAt('/cart');
    expect(await screen.findByRole('heading', { name: 'Корзина пока пуста' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Открыть меню' })).toHaveAttribute('href', '/menu');
    act(() => {
      window.history.pushState({}, '', '/missing');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(await screen.findByRole('heading', { name: 'Такой страницы нет' })).toBeInTheDocument();
  });

  it('normalizes malformed legacy URL values without an endless skeleton', async () => {
    renderAt('/menu?category=broken&sort=unknown&diet=vegan&spicy=0&availability=0&q=one&q=two&activeCategory=99&currentPage=NaN&unexpected=x');
    expect(await screen.findByText('Маргарита Napoli')).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).toBe(''));
  });

  it('clears search with a named control and restores focus', async () => {
    const user = userEvent.setup();
    renderAt('/menu');
    const search = screen.getByRole('searchbox', { name: 'Поиск по меню' });
    await user.type(search, 'сыр');
    await user.click(screen.getByRole('button', { name: 'Очистить поиск' }));
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
  });

  it('recovers after a real online event', async () => {
    let isOnline = false;
    vi.spyOn(window.navigator, 'onLine', 'get').mockImplementation(() => isOnline);
    renderAt('/menu');
    expect(await screen.findByRole('heading', { name: 'Нет соединения с интернетом' })).toBeInTheDocument();
    isOnline = true;
    act(() => window.dispatchEvent(new Event('online')));
    expect(await screen.findByText('Маргарита Napoli')).toBeInTheDocument();
  });

  it('renders the route error boundary fallback', () => {
    const onError = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const preventUnhandledError = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener('error', preventUnhandledError);
    const BrokenRoute = () => { throw new Error('route render failed'); };

    render(<BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}><RouteErrorBoundary resetKey="/" onError={onError}><BrokenRoute /></RouteErrorBoundary></BrowserRouter>);
    expect(screen.getByRole('heading', { name: 'Не удалось открыть страницу' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'В меню' })).toHaveAttribute('href', '/menu');
    expect(onError).toHaveBeenCalledOnce();
    window.removeEventListener('error', preventUnhandledError);
  });
});
