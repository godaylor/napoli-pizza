import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
});


test('redirects root to the canonical owned menu and survives reload', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/menu$/);
  await expect(page.getByRole('heading', { name: 'Меню', level: 1 })).toBeVisible();
  await expect(page.getByText('Маргарита Napoli')).toBeVisible();
  await expect(page.locator('[data-product-card]')).toHaveCount(36);
  await expect(page).toHaveTitle('Меню — Napoli');

  await page.reload();
  await expect(page.getByText('Маргарита Napoli')).toBeVisible();
});

test('switches the complete menu surface to English and persists the locale', async ({ page }) => {
  await page.goto('/menu');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.getByRole('heading', { name: 'Меню', level: 1 })).toBeVisible();
  await expect(page.getByText('Маргарита Napoli')).toBeVisible();

  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Menu', level: 1 })).toBeVisible();
  await expect(page.getByText('Margherita Napoli')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pizza', exact: true })).toBeVisible();
  await expect(page).toHaveTitle('Menu — Napoli');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /urban pizzeria/i);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/site.en.webmanifest');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('napoli:locale:v1'))).toContain('"locale":"en"');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Menu', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'RU', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Меню', level: 1 })).toBeVisible();
});

test('browses every category at every required width without pagination or overflow', async ({ page, browserName }, testInfo) => {
  test.slow();
  const categories = [
    ['Пицца', 14],
    ['Комбо', 4],
    ['Закуски', 5],
    ['Напитки', 5],
    ['Десерты', 4],
    ['Соусы', 4],
  ];

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await page.goto('/menu');
    await expect(page.getByText('Маргарита Napoli')).toBeVisible();

    for (const [category, count] of categories) {
      await page.getByRole('button', { name: category, exact: true }).click();
      await expect(page.getByRole('heading', { name: category, level: 2 })).toBeVisible();
      await expect(page.locator('[data-product-card]')).toHaveCount(count);
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    }

    await page.getByRole('button', { name: 'Все' }).click();
    await expect(page.locator('[data-product-card]')).toHaveCount(36);
    await expect(page.locator('[class*="pagination"]')).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath(`m2b-menu-${width}.png`),
      fullPage: browserName !== 'webkit' && (width === 320 || width === 1440),
    });
  }
});

test('toggles slow, stale, empty, 500 and offline demo states and recovers', async ({ page }) => {
  await page.goto('/menu');
  await expect(page.getByText('Маргарита Napoli')).toBeVisible();
  await page.getByText('Проверить состояния каталога').click();
  const scenario = page.locator('#catalog-demo-scenario');

  await scenario.selectOption('slow');
  await expect(page.getByRole('heading', { name: 'Загружаем меню' })).toBeVisible();
  await expect(page.getByText('Маргарита Napoli')).toBeVisible({ timeout: 2_500 });

  await scenario.selectOption('stale');
  await expect(page.getByText('Обновляем меню, предыдущие позиции доступны')).toBeVisible();
  await expect(page.getByText('Маргарита Napoli')).toBeVisible();
  await expect(page.getByText('Обновляем меню, предыдущие позиции доступны')).toBeHidden({ timeout: 2_000 });

  await scenario.selectOption('empty');
  await expect(page.getByRole('heading', { name: 'В меню ничего не найдено' })).toBeVisible();

  await scenario.selectOption('error');
  await expect(page.getByRole('heading', { name: 'Не удалось загрузить каталог' })).toBeVisible();

  await scenario.selectOption('offline');
  await expect(page.getByRole('heading', { name: 'Нет соединения с интернетом' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Napoli — в меню' })).toBeVisible();

  await scenario.selectOption('default');
  await expect(page.getByText('Маргарита Napoli')).toBeVisible();
});

test('keeps real offline recovery inside the branded shell', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TEST_ONLINE__ = false;
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => window.__TEST_ONLINE__,
    });
  });
  await page.goto('/menu');
  await expect(page.getByRole('heading', { name: 'Нет соединения с интернетом' })).toBeVisible();

  await page.evaluate(() => {
    window.__TEST_ONLINE__ = true;
    window.dispatchEvent(new Event('online'));
  });
  await expect(page.getByText('Маргарита Napoli')).toBeVisible();
});

test('uses intrinsic responsive images, below-fold lazy loading and controlled fallback', async ({ page }) => {
  await page.goto('/menu');
  await expect(page.getByText('Маргарита Napoli')).toBeVisible();

  const images = page.locator('[data-product-image]');
  await expect(images).toHaveCount(36);
  await expect(images.first()).toHaveAttribute('width', '960');
  await expect(images.first()).toHaveAttribute('height', '960');
  await expect(images.first()).toHaveAttribute('loading', 'eager');
  expect(await images.filter({ has: page.locator('[loading="lazy"]') }).count()).toBe(0);
  expect(await page.locator('[data-product-image][loading="lazy"]').count()).toBeGreaterThan(20);
  await expect(page.locator('source[type="image/avif"]').first()).toHaveAttribute('srcset', /480\.avif.*960\.avif/);
  await expect(page.locator('source[type="image/webp"]').first()).toHaveAttribute('srcset', /480\.webp.*960\.webp/);
  await expect.poll(() => images.first().evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);

  const fallbackTarget = images.first();
  await fallbackTarget.evaluate((image) => {
    image.parentElement?.querySelectorAll('source').forEach((source) => source.remove());
    image.removeAttribute('srcset');
    image.src = '/menu/intentionally-missing.jpg';
  });
  await expect(page.getByRole('img', { name: /недоступно/ }).first()).toBeVisible();
});

test('makes no MockAPI or Dodo request and ships no eager future chunks', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto('/menu');
  await expect(page.locator('[data-product-card]')).toHaveCount(36);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(250);

  expect(requests.some((url) => /mockapi|dodopizza|dodo/i.test(url))).toBe(false);
  expect(requests.some((url) => /payment|account|checkout/i.test(url))).toBe(false);
  expect(requests.some((url) => /\/menu\/.*\.(avif|webp|jpg)/i.test(url))).toBe(true);
});

test('keeps skip navigation, tablet geometry, reduced motion and 200 percent text zoom usable', async ({ page, browserName }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/menu');
  const skipLink = page.getByRole('link', { name: 'К основному содержимому' });
  if (browserName === 'webkit') {
    await skipLink.focus();
  } else {
    await page.keyboard.press('Tab');
  }
  await expect(skipLink).toBeVisible();
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  const searchBox = await page.getByRole('searchbox', { name: 'Поиск по меню' }).boundingBox();
  const navigation = await page.getByRole('navigation', { name: 'Основная навигация' }).boundingBox();
  expect(searchBox.y).toBeGreaterThanOrEqual(navigation.y + navigation.height);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => { document.documentElement.style.fontSize = '200%'; });
  const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByRole('heading', { name: 'Меню', level: 1, exact: true })).toBeVisible();
});

test('opens cart and unknown routes directly and returns to canonical menu', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Корзина пока пуста' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Открыть меню' })).toHaveAttribute('href', '/menu');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Корзина пока пуста' })).toBeVisible();

  await page.goto('/missing');
  await expect(page.getByRole('heading', { name: 'Такой страницы нет' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Вернуться в меню' })).toHaveAttribute('href', '/menu');
});

test('metadata assets resolve and browser console remains clean', async ({ page, request }) => {
  for (const path of ['/favicon.svg', '/site.webmanifest', '/app-icon.svg', '/menu/pizza-margherita-480.avif']) {
    expect((await request.get(path)).status()).toBe(200);
  }

  const messages = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') messages.push(message.text());
  });
  page.on('pageerror', (error) => messages.push(error.message));

  await page.goto('/menu');
  await expect(page.getByText('Маргарита Napoli')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#17191d');
  expect(messages).toEqual([]);
});

test('M3 restores canonical discovery URL on reload and back-forward', async ({ page, context }) => {
  const sharedPath = '/menu?q=%D1%82%D1%80%D1%8E%D1%84%D0%B5%D0%BB%D1%8C&category=pizza&sort=price-asc&diet=vegetarian&availability=1';

  await page.goto(sharedPath);
  await expect(page.getByRole('searchbox', { name: 'Поиск по меню' })).toHaveValue('трюфель');
  await expect(page.getByRole('button', { name: 'Пицца' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Без мяса')).toBeChecked();
  await expect(page.getByLabel('Только доступное')).toBeChecked();
  await expect(page.getByRole('combobox', { name: 'Сначала' })).toHaveValue('price-asc');
  await expect(page.locator('[data-product-card]')).toHaveCount(1);
  await expect(page.getByText('Фунги тартуфо')).toBeVisible();

  await page.reload();
  await expect(page.locator('[data-product-card]')).toHaveCount(1);

  const sharedPage = await context.newPage();
  await sharedPage.goto(page.url());
  await expect(sharedPage.getByText('Фунги тартуфо')).toBeVisible();
  await expect(sharedPage.locator('[data-product-card]')).toHaveCount(1);
  await sharedPage.close();

  await page.getByRole('button', { name: 'Все' }).click();
  await expect(page).not.toHaveURL(/category=pizza/);
  await page.getByRole('combobox', { name: 'Сначала' }).selectOption('name');
  await expect(page).toHaveURL(/sort=name/);

  await page.goBack();
  await expect(page).not.toHaveURL(/category=pizza/);
  await expect(page.getByRole('combobox', { name: 'Сначала' })).toHaveValue('price-asc');
  await page.goBack();
  await expect(page).toHaveURL(/category=pizza/);
  await expect(page.getByRole('button', { name: 'Пицца' })).toHaveAttribute('aria-pressed', 'true');
  await page.goForward();
  await expect(page.getByRole('button', { name: 'Все' })).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/menu?q=a&q=b&activeCategory=2&sort=unknown&page=4');
  await expect(page).toHaveURL(/\/menu$/);
  await expect(page.locator('[data-product-card]')).toHaveCount(36);
});

test('M3 keeps the latest search and recovers by keyboard at every required width', async ({ page }, testInfo) => {
  test.slow();
  await page.goto('/menu');
  await expect(page.getByText('Маргарита Napoli')).toBeVisible();
  await page.getByText('Проверить состояния каталога').click();
  await page.locator('#catalog-demo-scenario').selectOption('slow');
  await expect(page.getByText('Маргарита Napoli')).toBeVisible({ timeout: 2_500 });

  const search = page.getByRole('searchbox', { name: 'Поиск по меню' });
  await search.fill('пепперони');
  await page.waitForTimeout(300);
  await search.fill('маргарита');
  await expect.poll(() => page.evaluate(() => new URLSearchParams(window.location.search).get('q'))).toBe('маргарита');
  await expect(page.locator('[data-product-card]')).toHaveCount(3, { timeout: 2_500 });
  await expect(page.getByText('Маргарита Napoli')).toBeVisible();
  await expect(page.getByText('Пепперони Форнари')).toHaveCount(0);

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await page.goto('/menu?category=drinks&spicy=1');
    await expect(page.getByRole('heading', { name: 'Ничего не нашли' })).toBeVisible();

    const spicyFilter = page.getByLabel('Острое');
    await spicyFilter.focus();
    await expect(spicyFilter).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page).toHaveURL(/\/menu\?category=drinks$/);
    await expect(page.locator('[data-product-card]')).toHaveCount(5);

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

    if (width === 390 || width === 1440) {
      await page.screenshot({ path: testInfo.outputPath(`m3-discovery-${width}.png`), fullPage: true });
    }
  }
});
test('M4A completes the lazy product-to-cart journey and preserves discovery state', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/menu?q=%D0%BC%D0%B0%D1%80%D0%B3%D0%B0%D1%80%D0%B8%D1%82%D0%B0&category=pizza');
  const productLink = page.getByRole('link', { name: /Маргарита Napoli/ });
  await expect(productLink).toBeVisible();
  expect(requests.some((url) => /\/assets\/Product-[^/]+\.js/.test(url))).toBe(false);
  expect(requests.some((url) => /\/assets\/Cart-[^/]+\.js/.test(url))).toBe(false);
  await productLink.hover();
  await expect.poll(() => requests.some((url) => /\/assets\/Product-[^/]+\.js/.test(url))).toBe(true);
  expect(requests.some((url) => /\/assets\/Cart-[^/]+\.js/.test(url))).toBe(false);
  await productLink.click();
  await expect(page.getByRole('heading', { name: 'Маргарита Napoli', level: 1 })).toBeVisible();
  await page.getByRole('radio', { name: /30 см/ }).check();
  await page.getByRole('radio', { name: /Традиционное/ }).check();
  await expect(page.getByRole('status', { name: 'Текущая конфигурация и цена' })).toContainText('790 ₽');
  const addButton = page.getByRole('button', { name: 'Добавить за 790 ₽' });
  await addButton.click();
  await addButton.click();
  await expect(page.getByText(/добавлена в корзину/)).toBeAttached();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await expect.poll(() => requests.some((url) => /\/assets\/Cart-[^/]+\.js/.test(url))).toBe(true);
  await expect(page.getByRole('heading', { name: 'Корзина', level: 1 })).toBeVisible();
  await expect(page.getByText('30 см · Традиционное тесто · 560 г')).toBeVisible();
  await expect(page.getByText('Количество').locator('..')).toContainText('2');
  await expect(page.getByLabel('Сумма корзины')).toContainText('1 580 ₽');
  await page.getByRole('link', { name: 'Продолжить выбор' }).click();
  await expect(page).toHaveURL(/\/menu\?q=%D0%BC%D0%B0%D1%80%D0%B3%D0%B0%D1%80%D0%B8%D1%82%D0%B0&category=pizza$/);
  await page.goto('/menu/margherita-napoli');
  await expect(page.getByRole('heading', { name: 'Маргарита Napoli' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Маргарита Napoli' })).toBeVisible();
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Корзина', level: 1 })).toBeVisible();
  await expect(page.getByLabel('Количество Маргарита Napoli').locator('output')).toHaveText('2');
  await page.reload();
  await expect(page.getByLabel('Количество Маргарита Napoli').locator('output')).toHaveText('2');
  await page.goto('/menu/tonno-cipolla');
  await expect(page.getByRole('button', { name: 'Добавить за 890 ₽' })).toBeDisabled();
  await expect(page.getByText(/Тунец вернётся/).last()).toBeVisible();
  await page.goto('/menu/not-in-catalog');
  await expect(page.getByRole('heading', { name: 'Такого продукта нет' })).toBeVisible();
});
test('M4A keeps keyboard controls and contextual CTA usable at required widths', async ({ page }, testInfo) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await page.goto('/menu/margherita-napoli', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Маргарита Napoli' })).toBeVisible();
    const size = page.getByRole('radio', { name: /30 см/ });
    await size.focus();
    await page.keyboard.press('Space');
    await expect(size).toBeChecked();
    const dough = page.getByRole('radio', { name: /Традиционное/ });
    await dough.focus();
    await page.keyboard.press('Space');
    await expect(dough).toBeChecked();
    await expect(page.getByRole('status', { name: 'Текущая конфигурация и цена' })).toContainText('790 ₽');
    const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    if (width === 320 || width === 390) {
      await expect(page.getByRole('navigation', { name: 'Мобильная навигация' })).toHaveCount(0);
      const sticky = await page.locator('[data-sticky-cta]').boundingBox();
      expect(sticky.y + sticky.height).toBeLessThanOrEqual(844);
    }
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: testInfo.outputPath(`m4a-product-${width}.png`), fullPage: true });
    }
  }
});
test('M4B keeps two configured recipes distinct with canonical prices and summaries', async ({ page }) => {
  await page.goto('/menu/pepperoni-napoli');
  await expect(page.getByRole('heading', { name: 'Пепперони Napoli' })).toBeVisible();
  await page.getByRole('radio', { name: /30 см/ }).check();
  await page.getByRole('checkbox', { name: /Убрать красный лук/ }).check();
  await page.getByRole('radio', { name: /Дополнительный сыр/ }).check();
  const summary = page.getByRole('status', { name: 'Текущая конфигурация и цена' });
  await expect(summary).toContainText('30 см');
  await expect(summary).toContainText('Без красного лука');
  await expect(summary).toContainText('Дополнительный сыр');
  await expect(summary).toContainText('1 130 ₽');
  await page.getByRole('button', { name: /Добавить за 1.130 ₽/ }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();

  let cart = page.getByRole('list', { name: 'Позиции корзины' });
  await expect(cart.getByRole('article', { name: 'Пепперони Napoli' })).toHaveCount(1);
  await expect(cart).toContainText('Без красного лука');
  await expect(cart).toContainText('Дополнительный сыр');
  await page.getByRole('link', { name: 'Продолжить выбор' }).click();
  await page.goto('/menu/pepperoni-napoli');

  await expect(page.getByRole('heading', { name: 'Пепперони Napoli' })).toBeVisible();
  await page.getByRole('radio', { name: /30 см/ }).check();
  await page.getByRole('checkbox', { name: /Убрать орегано/ }).check();
  await page.getByRole('button', { name: 'Добавить за 990 ₽' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();

  cart = page.getByRole('list', { name: 'Позиции корзины' });
  await expect(cart.getByRole('article', { name: 'Пепперони Napoli' })).toHaveCount(2);
  await expect(cart).toContainText('Без красного лука');
  await expect(cart).toContainText('Без орегано');
  await expect(cart).toContainText('Дополнительный сыр');
  await expect(cart).toContainText('Обычный сыр');
  await expect(page.getByLabel('Сумма корзины')).toContainText('2 120 ₽');
  await expect(cart).not.toContainText('red-onion');
  await expect(cart).not.toContainText('extra-cheese');
});
test('M4B supports keyboard constraints and unavailable-modifier correction at required widths', async ({ page }, testInfo) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await page.goto('/menu/pepperoni-napoli');
    await expect(page.getByRole('heading', { name: 'Пепперони Napoli' })).toBeVisible();

    for (const control of [
      page.getByRole('radio', { name: /30 см/ }),
      page.getByRole('checkbox', { name: /Убрать красный лук/ }),
      page.getByRole('radio', { name: /Дополнительный сыр/ }),
      page.getByRole('checkbox', { name: /Больше грибов/ }),
      page.getByRole('checkbox', { name: /^Халапеньо/ }),
    ]) {
      await control.focus();
      await page.keyboard.press('Space');
      await expect(control).toBeChecked();
    }
    await expect(page.getByRole('checkbox', { name: /Прошутто/ })).toBeDisabled();
    await expect(page.getByRole('status', { name: 'Текущая конфигурация и цена' })).toContainText('1 330 ₽');

    await page.getByText('Проверить доступность добавок').click();
    await page.getByRole('combobox', { name: 'Демо-сценарий' }).selectOption('extra-cheese-unavailable');
    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Дополнительный сыр закончился');
    await expect(alert.getByRole('link', { name: 'Перейти к выбору' })).toHaveAttribute('href', '#modifier-group-cheese-style');
    await expect(page.getByRole('button', { name: /Добавить за 1.330 ₽/ })).toBeDisabled();

    const correction = page.getByRole('radio', { name: /Обычный сыр/ });
    await correction.focus();
    await page.keyboard.press('Space');
    await expect(correction).toBeChecked();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Добавить за 1.190 ₽/ })).toBeEnabled();

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollX: window.scrollX,
      innerWidth: window.innerWidth,
      scrollContainers: [...document.querySelectorAll('body *')]
        .filter((element) => element.scrollWidth > element.clientWidth + 1)
        .map((element) => ({ tag: element.tagName, className: element.className, width: element.clientWidth, scrollWidth: element.scrollWidth, right: element.getBoundingClientRect().right + window.scrollX })),
      textOverflow: [...document.querySelectorAll('body *')]
        .flatMap((element) => [...element.childNodes]
          .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
          .map((node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            return { tag: element.tagName, className: element.className, text: node.textContent.trim(), right: range.getBoundingClientRect().right + window.scrollX };
          }))
        .filter((entry) => entry.right > document.documentElement.clientWidth + 0.5),
      overflowing: [...document.querySelectorAll('body *')]
        .filter((element) => element.getBoundingClientRect().right + window.scrollX > document.documentElement.clientWidth + 0.5)
        .slice(0, 8)
        .map((element) => ({ tag: element.tagName, className: element.className, right: Math.round(element.getBoundingClientRect().right + window.scrollX), text: element.textContent?.trim().slice(0, 80) })),
    }));
    expect(dimensions.overflowing, JSON.stringify(dimensions)).toEqual([]);
    expect(dimensions.scrollWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.clientWidth);
    if (width < 640) {
      const sticky = await page.locator('[data-sticky-cta]').boundingBox();
      expect(sticky.y + sticky.height).toBeLessThanOrEqual(844);
    }
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: testInfo.outputPath(`m4b-configurator-${width}.png`), fullPage: true });
    }
  }
});
test('M5A persists, edits and safely recovers the cart', async ({ page }) => {
  await page.goto('/menu/pepperoni-napoli');
  await expect(page.getByRole('heading', { name: 'Пепперони Napoli', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Добавить за 790 ₽' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await expect(page.getByRole('heading', { name: 'Корзина', level: 1 })).toBeVisible();

  await page.reload();
  let cart = page.getByRole('list', { name: 'Позиции корзины' });
  await expect(cart.getByRole('article', { name: 'Пепперони Napoli' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Увеличить количество Пепперони Napoli' }).click();
  await expect(page.getByLabel('Количество Пепперони Napoli').locator('output')).toHaveText('2');

  await page.getByRole('link', { name: 'Изменить конфигурацию' }).click();
  await expect(page.getByRole('radio', { name: /25 см/ })).toBeChecked();
  await page.getByRole('radio', { name: /30 см/ }).click();
  await page.getByRole('button', { name: 'Сохранить изменения за 990 ₽' }).click();
  await expect(page).toHaveURL(/\/cart#cart-line-cfg1-/);
  await expect(page.getByLabel('Количество Пепперони Napoli').locator('output')).toHaveText('2');
  await expect(page.getByText('30 см · Тонкое тесто · 510 г')).toBeVisible();

  await page.getByRole('button', { name: 'Удалить' }).click();
  await expect(page.getByRole('heading', { name: 'Корзина пока пуста' })).toBeVisible();
  await page.getByRole('button', { name: 'Отменить' }).click();
  await expect(page.getByRole('article', { name: 'Пепперони Napoli' })).toBeFocused();

  await page.getByRole('button', { name: 'Очистить корзину' }).click();
  await page.getByRole('button', { name: 'Отменить' }).click();
  await expect(page.getByRole('article', { name: 'Пепперони Napoli' })).toBeVisible();

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  await page.evaluate((key) => localStorage.setItem(key, '{corrupt'), 'napoli:commerce:v1');
  await page.reload();
  await expect(page.getByText(/безопасно сброшена/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Корзина пока пуста' })).toBeVisible();

  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('denied');
    };
  });
  await page.goto('/menu/margherita-napoli');
  await page.getByRole('button', { name: 'Добавить за 590 ₽' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await expect(page.getByText(/Не удалось сохранить изменения/)).toBeVisible();
  await expect(page.getByRole('article', { name: 'Маргарита Napoli' })).toBeVisible();
});
test('M5B adds one fixed combo and updates contextual recommendations', async ({ page }) => {
  await page.goto('/menu/evening-for-two');
  await expect(page.getByRole('heading', { name: 'Вечер на двоих', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Фиксированный состав' })).toBeVisible();
  await expect(page.getByText('Маргарита Napoli · 30 см')).toBeVisible();
  await expect(page.getByText('Пепперони Napoli · 30 см')).toBeVisible();
  await expect(page.getByText('Крафтовая кола · 1 л')).toBeVisible();
  await expect(page.getByText('Выгода').locator('..')).toContainText('180 ₽');

  await page.getByText('Проверить доступность состава').click();
  await page.getByRole('combobox', { name: 'Демо-сценарий' }).selectOption('cola-unavailable');
  await expect(page.getByRole('alert')).toContainText('Крафтовая кола · 1 л недоступен');
  await expect(page.getByRole('button', { name: 'Добавить за 1 990 ₽' })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Демо-сценарий' }).selectOption('default');

  const addCombo = page.getByRole('button', { name: 'Добавить за 1 990 ₽' });
  await addCombo.focus();
  await page.keyboard.press('Space');
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await page.reload();

  const cart = page.getByRole('list', { name: 'Позиции корзины' });
  await expect(cart.getByRole('article', { name: 'Вечер на двоих' })).toHaveCount(1);
  await expect(page.getByLabel('Количество Вечер на двоих').locator('output')).toHaveText('1');
  const recommendation = page.getByRole('heading', { name: 'К этому заказу' }).locator('..');
  await expect(recommendation).toContainText('Крафтовая кола');
  await recommendation.getByRole('button', { name: 'Добавить за 250 ₽' }).click();
  await expect(page.getByRole('heading', { name: 'К этому заказу' }).locator('..')).toContainText('Пармезановый');
  await expect(page.getByText(/Рекомендация обновлена/)).toBeAttached();

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
test('M6A completes guest delivery quote and preserves recovery draft', async ({ page }) => {
  await page.goto('/menu/evening-for-two');
  await page.getByRole('button', { name: 'Добавить за 1 990 ₽' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await page.getByRole('link', { name: 'Оформить заказ' }).click();

  await expect(page.getByRole('heading', { name: 'Доставка', level: 1 })).toBeVisible();
  await expect(page.getByText(/Регистрация не нужна/)).toBeVisible();
  const name = page.getByRole('textbox', { name: 'Имя' });
  await name.clear();
  await page.getByRole('button', { name: 'Проверить адрес' }).click();
  await expect(name).toBeFocused();
  await expect(page.getByText('Введите имя.')).toBeVisible();

  await name.fill('Анна');
  await page.getByText('Проверить delivery recovery').click();
  const scenario = page.getByRole('combobox', { name: 'Демо-сценарий' });
  await scenario.selectOption('unserviceable');
  await page.getByRole('button', { name: 'Проверить адрес' }).click();
  await expect(page.getByText(/вне демо-зоны/)).toBeVisible();
  await expect(page.getByRole('textbox', { name: /^Улица/ })).toBeFocused();

  await scenario.selectOption('default');
  await page.getByRole('button', { name: 'Повторить расчёт' }).click();
  await expect(page.getByText('Адрес подтверждён')).toBeVisible();
  await expect(page.getByText(/35–45 мин/).first()).toBeVisible();
  await expect(page.getByText('199 ₽')).toBeVisible();

  const note = page.getByRole('textbox', { name: 'Комментарий курьеру' });
  await note.fill('Домофон не работает');
  await page.waitForTimeout(180);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('textbox', { name: 'Имя' })).toHaveValue('Анна');
  await expect(page.getByRole('textbox', { name: 'Комментарий курьеру' })).toHaveValue('Домофон не работает');
  await expect(page.getByRole('article', { name: 'Вечер на двоих' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Ваш заказ' }).locator('..')).toContainText('Вечер на двоих');

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
test('M6B switches fulfillment, schedules and recovers stale quotes', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TEST_ONLINE__ = true;
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => window.__TEST_ONLINE__,
    });
  });

  await page.goto('/menu/evening-for-two');
  await page.getByRole('button', { name: 'Добавить за 1 990 ₽' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await page.getByRole('link', { name: 'Оформить заказ' }).click();

  await page.getByRole('button', { name: 'Проверить адрес' }).click();
  await expect(page.getByText('Адрес подтверждён')).toBeVisible();

  await page.getByRole('radio', { name: /^Ко времени/ }).click();
  await page.getByRole('combobox', { name: 'Доступное время' }).selectOption('today-2030');
  await expect(page.getByText('Расчёт устарел')).toBeVisible();
  await page.getByRole('button', { name: 'Повторить расчёт' }).click();
  await expect(page.getByText('Адрес подтверждён').locator('..')).toContainText('Сегодня, 20:30–21:00');

  await page.getByRole('radio', { name: 'Самовывоз' }).click();
  await expect(page.getByRole('heading', { name: 'Самовывоз', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Адрес доставки' })).toHaveCount(0);
  await page.getByRole('radio', { name: /^Как можно скорее/ }).click();
  await page.getByRole('button', { name: 'Повторить расчёт' }).click();
  await expect(page.getByText('Самовывоз подтверждён')).toBeVisible();
  await expect(page.getByText(/Готово через 20–25 мин/).first()).toBeVisible();

  await page.getByRole('radio', { name: /^Ко времени/ }).click();
  await page.getByRole('combobox', { name: 'Доступное время' }).selectOption('tomorrow-1300');
  await page.getByRole('button', { name: 'Повторить расчёт' }).click();
  await expect(page.getByText('Самовывоз подтверждён').locator('..')).toContainText('Завтра, 13:00–13:30');

  await page.getByText('Проверить delivery recovery').click();
  const scenario = page.getByRole('combobox', { name: 'Демо-сценарий' });
  await scenario.selectOption('closed-store');
  await page.getByRole('button', { name: 'Повторить расчёт' }).click();
  await expect(page.getByText(/пиццерия сейчас закрыта/i)).toBeVisible();
  await page.getByRole('button', { name: 'Выбрать Napoli · Курская' }).click();
  await page.getByRole('button', { name: 'Повторить расчёт' }).click();
  await expect(page.getByText('Самовывоз подтверждён')).toBeVisible();
  await expect(page.getByText(/Земляной Вал, 33/).first()).toBeVisible();

  await page.evaluate(() => {
    window.__TEST_ONLINE__ = false;
    window.dispatchEvent(new Event('offline'));
  });
  await expect(page.getByText('Расчёт устарел')).toBeVisible();
  await expect(page.getByText(/Подтверждённый ранее расчёт помечен устаревшим/)).toBeVisible();
  await page.getByRole('combobox', { name: 'Пиццерия' }).selectOption('store-tverskaya');
  await page.evaluate(() => {
    window.__TEST_ONLINE__ = true;
    window.dispatchEvent(new Event('online'));
  });
  await expect(page.getByText(/Соединение восстановлено/)).toBeVisible();
  await expect(page.getByText('Самовывоз подтверждён')).toBeVisible();
  await expect(page.getByText(/Тверская, 22/).first()).toBeVisible();

  await page.getByRole('radio', { name: 'Доставка' }).click();
  await expect(page.getByRole('textbox', { name: 'Улица' })).toHaveValue('Тверская');

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
test('M7 applies authoritative promo totals and requires refresh acknowledgement', async ({ page }) => {
  await page.goto('/menu/evening-for-two');
  await page.getByRole('button', { name: 'Добавить за 1 990 ₽' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await page.getByRole('link', { name: 'Оформить заказ' }).click();
  await page.getByRole('button', { name: 'Проверить адрес' }).click();
  await expect(page.getByText('Адрес подтверждён')).toBeVisible();

  const promo = page.getByRole('textbox', { name: 'Промокод · необязательно' });
  await promo.fill('UNKNOWN');
  await page.getByRole('button', { name: 'Применить промокод' }).click();
  await expect(page.getByText(/Такого промокода нет/)).toBeVisible();

  await promo.fill('EXPIRED22');
  await page.getByRole('button', { name: 'Применить промокод' }).click();
  await expect(page.getByText(/Промокод EXPIRED22 истёк/)).toBeVisible();

  await promo.fill('NAPOLI10');
  await page.getByText('Демо-коды и promo recovery').click();
  const finalScenario = page.getByRole('combobox', {
    name: 'Сценарий финального расчёта',
  });
  await finalScenario.selectOption('slow');
  await page.getByRole('button', { name: 'Применить промокод' }).click();
  await expect(page.getByRole('button', { name: 'Подтверждаем итог…' })).toBeDisabled();
  await expect(page.getByText('Финальный итог подтверждён')).toBeVisible();
  const summary = page.getByLabel('Предварительный итог');
  await expect(summary).toContainText('Скидка · NAPOLI10');
  await expect(summary).toContainText('−199 ₽');

  await page.getByRole('textbox', { name: 'Дом' }).fill('23');
  await expect(page.getByText('Финальный расчёт устарел')).toBeVisible();
  await page.getByRole('button', { name: 'Повторить расчёт' }).click();
  await expect(page.getByText('Адрес подтверждён')).toBeVisible();

  await finalScenario.selectOption('error');
  await page.getByRole('button', { name: 'Применить промокод' }).click();
  await expect(page.getByText(/Не удалось подтвердить финальный итог/)).toBeVisible();
  await expect(promo).toBeFocused();
  await expect(page.getByRole('textbox', { name: 'Улица' })).toHaveValue('Тверская');

  await finalScenario.selectOption('default');
  await page.getByRole('button', { name: 'Применить промокод' }).click();
  await expect(page.getByText('Финальный итог подтверждён')).toBeVisible();
  await page.getByRole('button', { name: 'Удалить промокод' }).click();
  const acknowledgement = page.getByRole('checkbox', {
    name: 'Я проверил обновлённые итог и время',
  });
  await expect(acknowledgement).toBeVisible();
  await expect(page.getByText(/Итог принят/)).toHaveCount(0);
  await acknowledgement.check();
  await expect(page.getByText(/Итог принят/)).toBeVisible();
  await expect(summary).not.toContainText('Скидка');
  await expect(summary).toContainText('2 189 ₽');

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expect(page.getByText('Промокод и финальный итог')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Проверить адрес' })).toBeVisible();
});

test('M7 keeps a minimum-failing promo from changing the total', async ({ page }) => {
  await page.goto('/menu/margherita-napoli');
  await page.getByRole('button', { name: 'Добавить за 590 ₽' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await page.getByRole('link', { name: 'Оформить заказ' }).click();
  await page.getByRole('button', { name: 'Проверить адрес' }).click();

  const promo = page.getByRole('textbox', { name: 'Промокод · необязательно' });
  await promo.fill('NAPOLI10');
  await page.getByRole('button', { name: 'Применить промокод' }).click();
  await expect(page.getByText(/NAPOLI10 действует от 1 000 ₽/)).toBeVisible();
  await expect(promo).toBeFocused();
  const summary = page.getByLabel('Предварительный итог');
  await expect(summary).not.toContainText('Скидка');
  await expect(summary).toContainText('789 ₽');
});
const prepareM8Order = async (page) => {
  await page.goto('/menu/evening-for-two');
  await page.getByRole('button', { name: 'Добавить за 1 990 ₽' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await page.getByRole('link', { name: 'Оформить заказ' }).click();
  await page.getByRole('button', { name: 'Проверить адрес' }).click();
  await expect(page.getByText('Адрес подтверждён')).toBeVisible();
  await page.getByRole('button', { name: 'Подтвердить итог' }).click();
  await expect(page.getByText('Финальный итог подтверждён')).toBeVisible();
};

test('M8 declines safely, retries once and reloads the private active confirmation', async ({ page }) => {
  await prepareM8Order(page);
  const phone = await page.getByRole('textbox', { name: 'Телефон' }).inputValue();
  const email = await page.getByRole('textbox', { name: 'Email · необязательно' }).inputValue();
  await page.getByRole('textbox', { name: 'Комментарий курьеру' }).fill('M8 private note');

  const outcome = page.getByRole('combobox', { name: 'Исход demo payment' });
  await outcome.selectOption('decline');
  await page.getByRole('button', { name: /Оплатить .* и оформить/ }).click();
  await expect(page.getByRole('alert')).toContainText('Demo payment отклонён');
  await expect(page.getByText('Финальный итог подтверждён')).toBeVisible();

  await outcome.selectOption('success');
  await page.getByRole('button', { name: /Оплатить .* и оформить/ }).click();
  await expect(page.getByRole('heading', { name: 'Заказ подтверждён', level: 1 })).toBeVisible();
  const orderHeading = page.getByRole('heading', { name: /^nap_/, level: 2 });
  const orderId = await orderHeading.textContent();
  expect(orderId).toMatch(/^nap_[a-z0-9]{16}$/);

  const storageEvidence = await page.evaluate(() => ({
    active: sessionStorage.getItem('napoli:active-order:v1') ?? '',
    checkout: sessionStorage.getItem('napoli:checkout:v1'),
    history: localStorage.getItem('napoli:order-history:v1') ?? '',
  }));
  expect(storageEvidence.active).toContain('M8 private note');
  expect(storageEvidence.checkout).toBeNull();
  expect(storageEvidence.history).not.toContain('M8 private note');
  expect(storageEvidence.history).not.toContain(phone);
  expect(storageEvidence.history).not.toContain(email);
  expect(storageEvidence.history.toLowerCase()).not.toContain('cvc');
  expect(storageEvidence.history.toLowerCase()).not.toContain('pan');
  expect(JSON.parse(storageEvidence.history).orders).toHaveLength(1);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Заказ подтверждён', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: orderId, level: 2 })).toBeVisible();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions, 'confirmation width ' + width).toEqual({
      clientWidth: width,
      scrollWidth: width,
    });
  }
});

test('M8 recovers timeout-after-create by idempotency key without a duplicate order', async ({ page }) => {
  await prepareM8Order(page);
  await page.getByRole('combobox', { name: 'Исход demo payment' }).selectOption('timeout-after-create');
  await page.getByRole('button', { name: /Оплатить .* и оформить/ }).click();
  await expect(page.getByRole('heading', { name: 'Заказ подтверждён', level: 1 })).toBeVisible();

  const result = await page.evaluate(() => {
    const history = JSON.parse(localStorage.getItem('napoli:order-history:v1') ?? '{}');
    const active = JSON.parse(sessionStorage.getItem('napoli:active-order:v1') ?? '{}');
    return {
      activeId: active.order?.id,
      historyIds: history.orders?.map((order) => order.id) ?? [],
    };
  });
  expect(result.historyIds).toEqual([result.activeId]);
});
const prepareM9PickupOrder = async (page) => {
  await page.goto('/menu/evening-for-two');
  await page.getByRole('button', { name: 'Добавить за 1 990 ₽' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await page.getByRole('link', { name: 'Оформить заказ' }).click();
  await page.getByRole('radio', { name: 'Самовывоз' }).click();
  await page.getByRole('button', { name: 'Проверить самовывоз' }).click();
  await expect(page.getByText('Самовывоз подтверждён')).toBeVisible();
  await page.getByRole('button', { name: 'Подтвердить итог' }).click();
  await expect(page.getByText('Финальный итог подтверждён')).toBeVisible();
  await page.getByRole('button', { name: /Оплатить .* и оформить/ }).click();
  await expect(page.getByRole('heading', { name: 'Заказ подтверждён', level: 1 })).toBeVisible();
};

test('M9 advances the full delivery timeline and never restarts after reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await prepareM8Order(page);
  await page.getByRole('button', { name: /Оплатить .* и оформить/ }).click();
  await expect(page.getByRole('heading', { name: 'Заказ подтверждён', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Отследить заказ' }).click();

  await expect(page.getByRole('heading', { name: 'Заказ движется к вам', level: 1 })).toBeVisible();
  await expect(page.locator('[aria-current="step"]')).toHaveCount(1);
  await expect(page.locator('[aria-current="step"]')).toContainText('Заказ принят');
  const ring = page.getByRole('img', { name: /Прогресс заказа/ });
  await expect(ring).toBeVisible();
  expect(await ring.evaluate((element) =>
    getComputedStyle(element, '::after').animationName,
  )).toBe('none');

  await page.getByText('Управлять demo-временем').click();
  await page.getByRole('button', { name: 'Следующий этап' }).click();
  await expect(page.getByRole('heading', { name: 'Начали готовить', level: 2 })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Начали готовить', level: 2 })).toBeVisible();
  await expect(page.locator('[aria-current="step"]')).toContainText('Начали готовить');

  await page.getByText('Управлять demo-временем').click();
  for (const status of ['В печи', 'Упаковываем', 'Курьер в пути', 'Доставлен']) {
    await page.getByRole('button', { name: 'Следующий этап' }).click();
    await expect(page.getByRole('heading', { name: status, level: 2 })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Следующий этап' })).toBeDisabled();
  await expect(ring).toHaveAccessibleName('Прогресс заказа: 100%');

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions, 'tracking width ' + width).toEqual({
      clientWidth: width,
      scrollWidth: width,
    });
  }
});

test('M9 keeps pickup-specific progress stale offline and resumes after reconnect', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TEST_ONLINE__ = true;
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => window.__TEST_ONLINE__,
    });
  });
  await prepareM9PickupOrder(page);
  await page.getByRole('link', { name: 'Отследить заказ' }).click();

  await expect(page.getByRole('heading', { name: 'Готовим к самовывозу', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Готов к выдаче', level: 3 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Курьер в пути' })).toHaveCount(0);
  await page.getByText('Управлять demo-временем').click();
  await page.getByRole('combobox', { name: 'Сценарий tracking' }).selectOption('delayed');
  await expect(page.getByText('Кухне нужно больше времени')).toBeVisible();

  await page.evaluate(() => {
    window.__TEST_ONLINE__ = false;
    window.dispatchEvent(new Event('offline'));
  });
  await expect(page.getByText(/Offline · показан последний сохранённый статус/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Следующий этап' })).toBeDisabled();
  await expect(page.locator('[aria-current="step"]')).toContainText('Заказ принят');

  await page.evaluate(() => {
    window.__TEST_ONLINE__ = true;
    window.dispatchEvent(new Event('online'));
  });
  await expect(page.getByRole('button', { name: 'Следующий этап' })).toBeEnabled();
  for (const status of ['Начали готовить', 'В печи', 'Упаковываем', 'Готов к выдаче', 'Получен']) {
    await page.getByRole('button', { name: 'Следующий этап' }).click();
    await expect(page.getByRole('heading', { name: status, level: 2 })).toBeVisible();
  }
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Получен', level: 2 })).toBeVisible();
  await expect(page.locator('[aria-current="step"]')).toContainText('Получен');
});
test('M10A keeps guest favorites synchronized, reload-safe and keyboard operable', async ({ page }) => {
  await page.goto('/menu');
  const card = page.getByRole('article', { name: 'Маргарита Napoli' });
  const addFavorite = card.getByRole('button', { name: 'Добавить в избранное: Маргарита Napoli' });
  await addFavorite.focus();
  await page.keyboard.press('Space');
  await expect(card.getByRole('button', { name: 'Убрать из избранного: Маргарита Napoli' })).toHaveAttribute('aria-pressed', 'true');

  await card.getByRole('link', { name: /Маргарита Napoli/ }).click();
  await expect(page.getByRole('button', { name: 'Убрать из избранного: Маргарита Napoli' })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Убрать из избранного: Маргарита Napoli' })).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/favorites');
  await expect(page).toHaveTitle('Избранное — Napoli');
  await expect(page.getByRole('heading', { name: 'Избранное', level: 1 })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Маргарита Napoli' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('article', { name: 'Маргарита Napoli' })).toBeVisible();
  await page.getByRole('button', { name: 'Убрать из избранного: Маргарита Napoli' }).click();
  await expect(page.getByRole('heading', { name: 'Избранное пока пусто' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Выбрать из меню' })).toHaveAttribute('href', '/menu');
});

test('M10A keeps temporarily unavailable favorites useful', async ({ page }) => {
  await page.goto('/menu/tonno-cipolla');
  await page.getByRole('button', { name: 'Добавить в избранное: Тонно и чиполла' }).click();
  await page.goto('/favorites');
  await expect(page.getByText('Не всё доступно прямо сейчас')).toBeVisible();
  await expect(page.getByText('Временно закончилась')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Убрать из избранного: Тонно и чиполла' })).toBeVisible();
  await expect(page.getByRole('link', { name: /аккаунт/i })).toHaveCount(0);
});


test('M10B completes history, reconciles repeat and clears without deleting active order', async ({ page }) => {
  await prepareM8Order(page);
  await page.getByRole('button', { name: /Оплатить .* и оформить/ }).click();
  await expect(page.getByRole('heading', { name: 'Заказ подтверждён', level: 1 })).toBeVisible();
  const orderId = await page.getByRole('heading', { name: /^nap_/, level: 2 }).textContent();
  await page.getByRole('link', { name: 'История заказов' }).click();

  await expect(page.getByRole('heading', { name: 'История заказов', level: 1 })).toBeVisible();
  await expect(page.getByText('Сохранено заказов: 1')).toBeVisible();
  await expect(page.getByRole('heading', { name: orderId, level: 2 })).toBeVisible();
  await expect(page.getByText('1 990 ₽ тогда')).toBeVisible();

  const raw = await page.evaluate(() => localStorage.getItem('napoli:order-history:v1') ?? '');
  expect(raw).not.toMatch(/phone|email|address|note|Тверская|Комментарий|M8 private/i);

  await page.getByRole('button', { name: 'Повторить заказ' }).click();
  const scenario = page.getByRole('combobox', { name: 'Demo-сценарий актуального меню' });
  await scenario.selectOption('price-change');
  await expect(page.getByText('Цена изменилась: в корзину попадёт текущая цена.')).toBeVisible();
  await expect(page.getByText('2 090 ₽')).toBeVisible();
  await page.getByRole('checkbox', { name: /Я проверил текущие цены/ }).check();
  await page.getByRole('button', { name: 'Добавить выбранное в корзину' }).click();
  await expect(page.getByRole('status')).toContainText('В корзину добавлено позиций: 1');

  await scenario.selectOption('unavailable');
  await expect(page.getByText('Позиция временно закончилась в demo-сценарии.')).toBeVisible();
  await expect(page.getByText('Пропущено строк: 1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Добавить выбранное в корзину' })).toBeDisabled();

  await page.reload();
  await expect(page.getByText('Сохранено заказов: 1')).toBeVisible();
  await page.getByRole('button', { name: 'Очистить историю' }).click();
  await expect(page.getByRole('heading', { name: 'Недавних заказов нет' })).toBeVisible();
  await page.goto(`/order/${orderId}/confirmed`);
  await expect(page.getByRole('heading', { name: 'Заказ подтверждён', level: 1 })).toBeVisible();

  await page.goto('/orders');
  await page.getByRole('button', { name: 'Показать demo-заказ' }).click();
  await expect(page.getByText('DEMO / НЕПЕРСОНАЛЬНЫЙ')).toBeVisible();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(dimensions, 'orders width ' + width).toEqual({ scrollWidth: width, innerWidth: width });
  }
});


