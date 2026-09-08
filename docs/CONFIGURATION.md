<!-- generated-by: gsd-doc-writer -->
# Configuration

## Environment variables

Consumer application не читает environment variables и не требует `.env`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `CI` | No | unset / false | Используется только `playwright.config.js`: запрещает focused tests, включает retries и обычно задаётся CI runner автоматически. |

## Config file format

- `package.json` — scripts, dependencies и Node engine range.
- `.nvmrc` — exact local/CI Node pin `24.20.0`.
- `vite.config.ts` — React plugin, Vitest/jsdom/V8 coverage и production manifest.
- `playwright.config.js` — четыре browser projects и production-preview web server.
- `vercel.json` — SPA rewrite всех routes на `/index.html`.

Минимальная hosting configuration:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Required vs optional settings

Обязательных runtime settings нет. Отсутствие auth/backend/payment keys не мешает guest flow, потому что catalog, quote, payment и order adapters детерминированы локально.

## Defaults

- `npm run dev` и `npm run preview`: `127.0.0.1:32500`, `strictPort: true`. Запускайте один из них; занятый порт означает остановку, не переход на другой порт.
- Playwright preview: `127.0.0.1:32501`, чужой сервер не переиспользуется.
- Performance preview: `127.0.0.1:32502`; Chrome debugging: `32503`.
- Все дополнительные локальные порты — только `32500–32599`. Проверяйте занятость перед запуском; не завершайте чужие процессы.
- Demo state выбирается видимыми controls внутри приложения, а не скрытыми environment flags.

## Docker

Проект не использует и не требует Docker: в репозитории нет `Dockerfile`, Compose-конфигурации или локальных сервисов. Для development и release-проверок достаточно Node.js; production artifact — статическая Vite SPA.

## Per-environment overrides

Специальных development/staging/production `.env` нет. Production отличает только compiled Vite artifact и hosting SPA rewrite. Секреты добавлять не нужно.
