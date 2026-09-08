<!-- generated-by: gsd-doc-writer -->
# Testing

## Test framework and setup

- Vitest `4.1.11`, Testing Library и MSW для unit/integration/adapter tests.
- Vitest ограничен четырьмя workers: массовая параллельная трансформация lazy routes при coverage вызывала таймауты загрузки. Не запускайте coverage и браузерную матрицу одновременно.
- Playwright `1.62.1` для production-preview journeys.
- `@axe-core/playwright` `4.13.0` для WCAG scans key routes.
- Lighthouse `13.4.1` + Puppeteer/Chrome Launcher для mobile lab metrics.

После `npm ci` установите browsers:

```bash
npx playwright install chromium firefox webkit
```

## Running tests

```bash
npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e -- --workers=4
npm run test:performance
```

Focused examples:

```bash
npx vitest run src/features/order/persistence/DemoOrderRepository.test.ts
npx playwright test release.spec.js --project=chromium-390 --workers=1
```

## Writing new tests

- Unit/integration: `src/**/*.test.ts` и `src/**/*.test.tsx` рядом с владельцем поведения.
- Browser: `e2e/*.spec.js`, queries по accessible role/name и user-visible state.
- Общая DOM setup находится в `src/test/setup.ts`.
- Long multi-width browser suites помечаются `test.slow()`; функциональные assertion timeouts не ослабляются.
- Playwright tests подменяют только optional Google Fonts stylesheet пустым успешным ответом, чтобы third-party network не влиял на app gate; Lighthouse запускается отдельно без этой подмены.

## Coverage requirements

Формальный coverage threshold не настроен. Текущий run от 2026-09-08: 31 файл / 131 тест; statements `88.09%`, branches `76.74%`, functions `86.92%`, lines `89.61%`. Он включает RU/EN-модули и не должен подменяться старыми цифрами до локализации.

## Browser projects

| Project | Viewport |
|---|---:|
| `chromium-390` | 390×844 |
| `chromium-1440` | 1440×900 |
| `firefox-1440` | 1440×900 |
| `webkit-390` | 390×844 |

Сами journeys дополнительно меняют viewport на `320`, `390`, `768`, `1024` и `1440` px, проверяют overflow и сохраняют targeted screenshots.

## CI integration

`.github/workflows/ci.yml` запускается на pull request и push в `master`: `npm ci`, typecheck, lint, unit/integration, build, установка трёх browser engines и полная Playwright matrix с четырьмя workers.
