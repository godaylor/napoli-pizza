import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.emulateMedia({ colorScheme: 'light' });
});

const expectTheme = async (page, theme) => {
  // Native fields and browser scrollbars must follow the selected palette too.
  await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
};

const chooseDarkTheme = async (page) => {
  await page.getByRole('button', { name: 'Тема: Авто. Включить светлую тему' }).click();
  await page.getByRole('button', { name: 'Тема: Светлая. Включить тёмную тему' }).click();
  await expectTheme(page, 'dark');
};

const expectNoOverflow = async (page, label) => {
  const geometry = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    outside: [...document.querySelectorAll('body *')].filter((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && bounds.right > document.documentElement.clientWidth + 1;
    }).slice(0, 12).map((element) => ({
      tag: element.tagName, text: element.textContent?.slice(0, 60),
      right: element.getBoundingClientRect().right,
    })),
  }));
  expect(geometry.content, `${label}: ${JSON.stringify(geometry.outside)}`).toBeLessThanOrEqual(geometry.viewport);
};

const expectNoBlockingAxe = async (page, label) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = results.violations.filter(
    ({ impact }) => impact === 'critical' || impact === 'serious',
  );
  expect(blocking, `${label}: ${blocking.map(({ id, nodes }) => `${id} (${nodes.length})`).join(', ')}`)
    .toEqual([]);
};

test('theme follows the device in Auto and preserves explicit choices across reload and language changes', async ({ page }) => {
  await page.goto('/menu');
  await expect(page.getByRole('heading', { name: 'Меню', level: 1 })).toBeVisible();
  await expectTheme(page, 'light');

  await page.emulateMedia({ colorScheme: 'dark' });
  await expectTheme(page, 'dark');
  await expect(page.getByRole('button', { name: /^Тема: Авто\./ })).toBeVisible();

  await page.getByRole('button', { name: 'Тема: Авто. Включить светлую тему' }).click();
  await expectTheme(page, 'light');
  await page.reload();
  await expect(page.getByRole('button', { name: /^Тема: Светлая\./ })).toBeVisible();
  await expectTheme(page, 'light');

  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Menu', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Theme: Light. Use dark theme' })).toBeVisible();
  await expectTheme(page, 'light');
  await page.getByRole('button', { name: 'Theme: Light. Use dark theme' }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await expectTheme(page, 'dark');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Theme: Dark. Use device theme' })).toBeVisible();
  await expectTheme(page, 'dark');
});

test('menu and product fit five responsive widths in both themes', async ({ page }) => {
  await page.goto('/menu');
  await expect(page.getByRole('article', { name: 'Пепперони Napoli', exact: true })).toBeVisible();

  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await chooseDarkTheme(page);
    for (const path of ['/menu', '/menu/margherita-napoli']) {
      await page.goto(path);
      await expect(page.getByRole('heading', {
        name: path === '/menu' ? 'Меню' : 'Маргарита Napoli', level: 1,
      })).toBeVisible();
      if (path === '/menu') {
        await expect(page.getByRole('article', { name: 'Пепперони Napoli', exact: true })).toBeVisible();
      }
      await expectTheme(page, theme);
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        await expectNoOverflow(page, `${theme} ${path} at ${width}px`);
        const themeControl = page.getByRole('button', { name: /^Тема:/ });
        await expect(themeControl).toBeVisible();
        const bounds = await themeControl.boundingBox();
        expect(bounds.width).toBeGreaterThanOrEqual(44);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
      }
    }
    await page.goto('/menu');
    await page.setViewportSize({ width: 320, height: 844 });
    await page.evaluate(() => {
      const root = document.documentElement;
      root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * 2}px`;
    });
    await expectNoOverflow(page, `${theme} menu with 200% text at 320px`);
    await expect(page.getByRole('article', { name: 'Пепперони Napoli', exact: true })).toBeVisible();
    await expectNoOverflow(page, `${theme} loaded menu with 200% text at 320px`);
    const heading = await page.getByRole('heading', { name: 'Меню', level: 1 }).boundingBox();
    const photo = await page.locator('main img:not([data-product-image])').boundingBox();
    expect(heading.y + heading.height <= photo.y || heading.x + heading.width <= photo.x).toBe(true);
    await page.getByText('Проверить состояния каталога', { exact: true }).click();
    await page.getByRole('combobox', { name: 'Демо-сценарий', exact: true }).selectOption('slow');
    await expect(page.getByRole('heading', { name: 'Загружаем меню' })).toBeVisible();
    await expectNoOverflow(page, `${theme} loading menu with 200% text at 320px`);
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.getByRole('combobox', { name: 'Демо-сценарий', exact: true }).selectOption('default');
  }
});

test('dark guest journey stays accessible and changing theme preserves checkout details', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/menu');
  await expect(page.getByRole('heading', { name: 'Меню', level: 1 })).toBeVisible();
  await chooseDarkTheme(page);
  await expectNoBlockingAxe(page, 'dark menu');

  await page.getByRole('article', { name: 'Вечер на двоих' })
    .getByRole('link', { name: /Вечер на двоих/ }).click();
  await expect(page.getByRole('heading', { name: 'Вечер на двоих', level: 1 })).toBeVisible();
  await expectNoBlockingAxe(page, 'dark product');
  await page.getByRole('button', { name: 'Добавить за 1 990 ₽' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await expect(page.getByRole('heading', { name: 'Корзина', level: 1 })).toBeVisible();
  await expectNoBlockingAxe(page, 'dark cart');
  await page.getByRole('link', { name: 'Оформить заказ' }).click();

  await expect(page.getByRole('heading', { name: 'Доставка', level: 1 })).toBeVisible();
  const name = page.getByRole('textbox', { name: 'Имя', exact: true });
  const street = page.getByRole('textbox', { name: 'Улица', exact: true });
  const house = page.getByRole('textbox', { name: 'Дом', exact: true });
  await name.fill('Гость для проверки');
  await street.fill('Петровка');
  await house.fill('23');

  await page.getByRole('button', { name: 'Тема: Тёмная. Использовать тему устройства' }).click();
  await expectTheme(page, 'light');
  await expect(name).toHaveValue('Гость для проверки');
  await expect(street).toHaveValue('Петровка');
  await expect(house).toHaveValue('23');
  await chooseDarkTheme(page);
  await expect(name).toHaveValue('Гость для проверки');
  await expect(street).toHaveValue('Петровка');
  await expect(house).toHaveValue('23');
  await expectNoBlockingAxe(page, 'dark checkout');

  await page.getByRole('button', { name: 'Проверить адрес' }).click();
  await expect(page.getByText('Адрес подтверждён')).toBeVisible();
  await page.getByRole('button', { name: 'Подтвердить итог' }).click();
  await expect(page.getByText('Финальный итог подтверждён')).toBeVisible();
  await page.getByRole('button', { name: /Оплатить .* и оформить/ }).click();
  await expect(page.getByRole('heading', { name: 'Заказ подтверждён', level: 1 })).toBeVisible();
  await expectTheme(page, 'dark');
  await expectNoBlockingAxe(page, 'dark confirmation');
  await page.getByRole('link', { name: 'Отследить заказ' }).click();
  await expect(page.getByRole('heading', { name: 'Заказ движется к вам', level: 1 })).toBeVisible();
  await expectNoBlockingAxe(page, 'dark tracking');
});

test('reduced motion keeps scrolled content and route navigation visible without substantive animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/menu');
  await expect(page.getByRole('heading', { name: 'Меню', level: 1 })).toBeVisible();

  const expectSettledContent = async (locator) => {
    await expect(locator).toBeVisible();
    expect(await locator.evaluate((element) => {
      for (let current = element; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (Number(style.opacity) < 1 || style.visibility === 'hidden') return false;
      }
      return true;
    })).toBe(true);
    expect(await page.evaluate(() => document.getAnimations().filter((animation) => {
      const duration = animation.effect?.getTiming().duration;
      return (animation.playState === 'running' || animation.pending)
        && typeof duration === 'number' && duration > 1;
    }).length)).toBe(0);
  };

  const bottomCard = page.getByRole('article', { name: 'Арраббьята', exact: true });
  await bottomCard.scrollIntoViewIfNeeded();
  await expectSettledContent(bottomCard);
  const pizza = page.getByRole('article', { name: 'Маргарита Napoli', exact: true });
  await pizza.scrollIntoViewIfNeeded();
  await expectSettledContent(pizza);
  await pizza.getByRole('link', { name: /Маргарита Napoli/ }).click();
  await expectSettledContent(page.getByRole('heading', { name: 'Маргарита Napoli', level: 1 }));
  await expect(page.getByRole('heading', { name: 'Маргарита Napoli', level: 1 })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Добавить за 590 ₽' })).toBeEnabled();
});
