<!-- generated-by: gsd-doc-writer -->
# Deployment

## Deployment targets

Репозиторий подготовлен как Vite SPA плюс Vercel Function `/api/orders`. `vercel.json` исключает `/api/*` из SPA rewrite; остальные direct routes передаются React Router.

Канонический репозиторий — [godaylor/napoli-pizza](https://github.com/godaylor/napoli-pizza), production branch `master`. Существующий Vercel-проект — [maxeem/napoli-pizza](https://vercel.com/maxeem/napoli-pizza), домен — [napoli-pizza-tau.vercel.app](https://napoli-pizza-tau.vercel.app). При переносе меняется Git-подключение этого проекта; новый проект или домен не создаётся. `godaylor/napoli-pizza-archive` сохраняется без изменений.

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

Demo production не требует environment variables. Server mode требует `SUPABASE_URL`, `SUPABASE_SECRET_KEY` и client-safe `VITE_ORDER_API_MODE=server`; полный контракт — в [CONFIGURATION.md](CONFIGURATION.md).

## Server-side order persistence

1. Создайте Supabase project и выполните `supabase/migrations/202609110001_create_napoli_orders.sql` в SQL Editor.
2. В Vercel Production Environment добавьте `SUPABASE_URL` и отдельный новый-format `SUPABASE_SECRET_KEY`; оба значения server-only. Добавьте `VITE_ORDER_API_MODE=server`.
3. Redeploy `master`. `POST /api/orders` валидирует срок quote, арифметику integer minor units, fulfillment consistency, payload limits и idempotency; успешный snapshot зеркалируется в session/local sanitized history для прежнего reload UX.
4. Проверьте success и timeout-after-create recovery, затем убедитесь в Supabase, что один idempotency key создаёт ровно один `napoli_orders` row и confirmed event.

RLS включён на обеих таблицах; `anon` и `authenticated` не имеют grants. Secret key идёт только в `apikey` header от Vercel Function. API не логирует guest payload или key.

## GitHub → existing Vercel project publication

1. Целевой репозиторий владельца: `https://github.com/godaylor/napoli-pizza`. Восемь исходных master-изображений и их responsive-версии восстановлены из локальной предзаменной копии; история восстановления — в `ASSET-LICENSES.md`.
2. Пользователь разрешил commit и push готового worktree. Публикуем ветку `master`, сохраняя историю; force push не нужен. Не включать `node_modules/`, `dist/`, `artifacts/`, coverage и browser reports.
3. Дождаться зелёного GitHub Actions для опубликованного commit. Workflow использует `.nvmrc`, выполняет typecheck/lint/tests/build и Chromium/Firefox/WebKit.
4. В настройках Git существующего `maxeem/napoli-pizza` отключить архивный репозиторий и подключить канонический `godaylor/napoli-pizza`, production branch `master`, сохраняя домен и deployment history. Root directory — корень репозитория (не `06-napoli/`), framework Vite, build `npm run build`, output `dist`, Node `24.x`; lockfile определяет зависимости. Локальные проверки используют точный pin `24.20.0`; Vercel выбирает доступный patch в линии 24.x. `vercel.json` закрепляет framework/build/output и SPA rewrite. Переменные окружения приложению не нужны.
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
