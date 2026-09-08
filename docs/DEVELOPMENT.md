<!-- generated-by: gsd-doc-writer -->
# Development

## Local setup

```bash
git clone https://github.com/godaylor/napoli-pizza.git 06-napoli
cd 06-napoli
npm install
npm run dev
```

Runtime configuration и секреты не требуются. Owned fixtures и demo adapters находятся в `src/features/*/data` и `src/features/*/api`.

## Build commands

| Command | Description |
|---|---|
| `npm run dev` / `npm start` | Vite development server |
| `npm run build` | Production build в ignored `dist/` с manifest |
| `npm run preview` | Локальный production preview |
| `npm run typecheck` | Strict TypeScript check без emit |
| `npm run lint` | ESLint с `--max-warnings 0` |
| `npm run test` | Полный Vitest run |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest + V8 coverage report |
| `npm run test:e2e` | Build и полная Playwright matrix |
| `npm run test:performance` | Build, три Lighthouse mobile runs и Event Timing check |

## Code style

ESLint настроен в `eslint.config.js`; TypeScript — в `tsconfig.json`. Форматтер отдельно не добавлен. Используйте direct imports, feature-first модули, CSS Modules + Sass и pure domain modules для денег, configuration identity и order transitions.

## Branch conventions

Default branch — `master`. Отдельная naming convention для feature branches в репозитории не задокументирована.

## PR process

- Не включайте generated `dist/`, coverage или Playwright reports.
- Запускайте typecheck, zero-warning lint, tests и production build.
- Для изменения consumer flow добавляйте lowest-value unit/integration test и critical browser assertion.
- Проверяйте privacy boundary: никакого PAN/CVC и никакого guest PII в local history/logs.
- PR template и обязательный commit-message format в репозитории не заданы.
