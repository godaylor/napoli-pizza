<!-- generated-by: gsd-doc-writer -->
# Deployment

## Deployment targets

Репозиторий подготовлен как static Vite SPA для Vercel. `vercel.json` содержит catch-all rewrite на `/index.html`, поэтому direct `/menu/...`, `/cart`, `/checkout`, `/orders` и `/order/...` передаются React Router.

## Build pipeline

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

Artifact — `dist/`. GitHub workflow выполняет quality/build/E2E, но deploy job в репозитории отсутствует; публикация остаётся отдельным hosting action.

## Environment setup

Production environment variables не нужны. См. [CONFIGURATION.md](CONFIGURATION.md).

## First GitHub → Vercel publication

1. Целевой репозиторий владельца: `https://github.com/godaylor/napoli-pizza`. Восемь исходных изображений заменены лицензированными Pexels-фото; авторы и источники — в `ASSET-LICENSES.md`.
2. Пользователь разрешил commit и push готового worktree. Публикуем ветку `master`, сохраняя историю; force push не нужен. Не включать `node_modules/`, `dist/`, `artifacts/`, coverage и browser reports.
3. Дождаться зелёного GitHub Actions для опубликованного commit. Workflow использует `.nvmrc`, выполняет typecheck/lint/tests/build и Chromium/Firefox/WebKit.
4. В Vercel импортировать `godaylor/napoli-pizza`, production branch `master`: root directory `.` (корень репозитория, не `06-napoli/`), framework Vite, install `npm ci`, build `npm run build`, output `dist`, Node `24.x`. Локальные проверки используют точный pin `24.20.0`; Vercel выбирает доступный patch в линии 24.x. `vercel.json` закрепляет framework/build/output и SPA rewrite. Environment variables пустые.
5. На полученном URL проверить `/menu/margherita-napoli`, `/cart`, `/checkout`, `/favorites`, `/orders`, неизвестный URL и reload. Проверить, что JS/CSS, `/favicon.svg` и `/THIRD-PARTY-NOTICES.txt` возвращают свои файлы, а не HTML.
6. Пройти заказ в том же браузере, открыть прямые confirmation/tracking URL и обновить страницу. В новой вкладке без активной session допустимо сообщение об отсутствии заказа: это честная граница локального demo, не поломка SPA rewrite.

Локальный preview: `http://127.0.0.1:32500`. Автоматические direct-route проверки используют `32501`; Vite preview не эмулирует правила CDN Vercel, поэтому проверка на фактическом hosting URL обязательна после первого deploy. Официальная схема: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## SPA rewrite smoke

Перед публикацией:

```bash
npm run build
npm run preview
```

Откройте прямые routes `/menu/margherita-napoli`, `/cart`, `/favorites` и `/orders`, выполните reload и проверьте отсутствие asset 404/browser-console errors. Hosting должен применять checked-in `vercel.json`.

## Release checklist

1. Использовать Node `24.20.0` и clean `npm ci`.
2. Выполнить команды из build pipeline, `npm run test:coverage`, `npm run test:e2e -- --workers=4` и `npm run test:performance`.
3. Проверить direct routes и production manifest `dist/.vite/manifest.json`.
4. Убедиться, что initial menu не загружает checkout/order/account chunks.
5. После hosting publish повторить direct-route reload и console/network smoke на выданном preview URL.

## Rollback procedure

Deploy automation и platform-specific rollback command в репозитории не заданы. При hosting regression восстановите предыдущий успешный deployment средствами выбранного provider, затем повторите direct-route и critical-flow smoke.

## Monitoring

Production monitoring SDK не установлен. Runtime resilience демонстрируется UI recovery states; эксплуатационный monitoring требует отдельного решения и не должен собирать raw guest PII.
