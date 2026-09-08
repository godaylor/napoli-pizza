import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
});


const expectNoSeriousAxeViolations = async (page, routeName) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );
  expect(
    blocking,
    `${routeName}: ${blocking.map((violation) => `${violation.id} (${violation.nodes.length})`).join(', ')}`,
  ).toEqual([]);
};

const activateByKeyboard = async (page, locator) => {
  await locator.focus();
  await expect(locator).toBeFocused();
  await page.keyboard.press('Enter');
};

const tabTo = async (page, locator) => {
  await expect(locator).toBeVisible();
  for (let index = 0; index < 160; index += 1) {
    if (await locator.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Tab traversal did not reach the requested control.');
};


test('M12 has no critical or serious axe findings on key guest routes', async ({ page }) => {
  await page.goto('/menu');
  await expect(page.getByRole('heading', { name: 'Меню', level: 1 })).toBeVisible();
  await expectNoSeriousAxeViolations(page, 'menu');

  await page.goto('/menu/margherita-napoli');
  await expect(page.getByRole('heading', { name: 'Маргарита Napoli', level: 1 })).toBeVisible();
  await expectNoSeriousAxeViolations(page, 'product');

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Корзина пока пуста', level: 1 })).toBeVisible();
  await expectNoSeriousAxeViolations(page, 'empty cart');

  await page.goto('/favorites');
  await expect(page.getByRole('heading', { name: 'Избранное', level: 1 })).toBeVisible();
  await expectNoSeriousAxeViolations(page, 'favorites');

  await page.goto('/orders');
  await expect(page.getByRole('heading', { name: 'История заказов', level: 1 })).toBeVisible();
  await expectNoSeriousAxeViolations(page, 'orders');
});

test('M12 completes the critical guest path with keyboard activation only', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/menu');

  const productLink = page.getByRole('article', { name: 'Вечер на двоих' })
    .getByRole('link', { name: /Вечер на двоих/ });
  await activateByKeyboard(page, productLink);
  await expect(page.getByRole('heading', { name: 'Вечер на двоих', level: 1 })).toBeVisible();

  await activateByKeyboard(page, page.getByRole('button', { name: 'Добавить за 1 990 ₽' }));
  await activateByKeyboard(page, page.getByRole('link', { name: 'Открыть корзину' }));
  await expect(page.getByRole('heading', { name: 'Корзина', level: 1 })).toBeVisible();
  await activateByKeyboard(page, page.getByRole('link', { name: 'Оформить заказ' }));

  await expect(page.getByRole('heading', { name: 'Доставка', level: 1 })).toBeVisible();
  await expectNoSeriousAxeViolations(page, 'checkout');
  await activateByKeyboard(page, page.getByRole('button', { name: 'Проверить адрес' }));
  await expect(page.getByText('Адрес подтверждён')).toBeVisible();
  await activateByKeyboard(page, page.getByRole('button', { name: 'Подтвердить итог' }));
  await expect(page.getByText('Финальный итог подтверждён')).toBeVisible();
  await activateByKeyboard(page, page.getByRole('button', { name: /Оплатить .* и оформить/ }));

  await expect(page.getByRole('heading', { name: 'Заказ подтверждён', level: 1 })).toBeVisible();
  await expectNoSeriousAxeViolations(page, 'confirmation');
  await activateByKeyboard(page, page.getByRole('link', { name: 'Отследить заказ' }));
  await expect(page.getByRole('heading', { name: 'Заказ движется к вам', level: 1 })).toBeVisible();
  await expectNoSeriousAxeViolations(page, 'tracking');
});

test('M12 completes the critical path with Tab and Enter on Chromium mobile and desktop', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Raw Tab traversal is pinned to Chromium mobile/desktop; keyboard activation runs in every engine.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/menu');

  let target = page.getByRole('article', { name: 'Вечер на двоих' })
    .getByRole('link', { name: /Вечер на двоих/ });
  await tabTo(page, target);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Вечер на двоих', level: 1 })).toBeVisible();

  target = page.getByRole('button', { name: 'Добавить за 1 990 ₽' });
  await tabTo(page, target);
  await page.keyboard.press('Enter');
  target = page.getByRole('link', { name: 'Открыть корзину' });
  await tabTo(page, target);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Корзина', level: 1 })).toBeVisible();

  target = page.getByRole('link', { name: 'Оформить заказ' });
  await tabTo(page, target);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Доставка', level: 1 })).toBeVisible();

  for (const [name, result] of [
    ['Проверить адрес', 'Адрес подтверждён'],
    ['Подтвердить итог', 'Финальный итог подтверждён'],
  ]) {
    target = page.getByRole('button', { name });
    await tabTo(page, target);
    await page.keyboard.press('Enter');
    await expect(page.getByText(result)).toBeVisible();
  }

  target = page.getByRole('button', { name: /Оплатить .* и оформить/ });
  await tabTo(page, target);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Заказ подтверждён', level: 1 })).toBeVisible();

  target = page.getByRole('link', { name: 'Отследить заказ' });
  await tabTo(page, target);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Заказ движется к вам', level: 1 })).toBeVisible();
});

