# Original tutorial baseline audit

Дата среза: 27 августа 2026

Ветка: `master`

Режим аудита: read-only анализ исходников, production build, проверка dependency tree и текущего MockAPI. Реализация не выполнялась.

## Executive summary

Исходный проект сейчас — компактный учебный каталог, а не food-delivery продукт. Он умеет получить небольшой список пицц, применить категорию, сортировку, поиск и пагинацию, но пользовательский путь обрывается на кнопке «Добавить»: корзина, её суммы и действия статичны, checkout и order lifecycle отсутствуют.

Оценка production readiness: **1.5/10**.

Главный вывод аудита: проект не нужно «допиливать» горизонтальными слоями. Нужно сохранить репозиторий, базовые идеи Router/Redux и предметную область, но построить новые vertical slices вокруг собственной продуктовой модели, устойчивого data layer и самостоятельной визуальной идентичности.

### Сводная оценка

| Область | Оценка | Краткий вывод |
|---|---:|---|
| Product completeness | 1/10 | Нет работающего add-to-cart, checkout и orders |
| Architecture | 3/10 | База мала и понятна, но state размазан между URL, Redux, Context и local state |
| Data reliability | 2/10 | Один прямой Axios-запрос без error/cancel/cache contract |
| UI craft | 3/10 | Узнаваемый tutorial shell, статические данные и слабый responsive |
| Accessibility | 1/10 | Глобально отключён focus outline, controls в основном несемантичны |
| Testing | 0/10 | Тестовых файлов, E2E и CI нет |
| Performance readiness | 3/10 | Bundle небольшой, но нет image strategy, route splitting и server-state cache |
| Maintainability | 2/10 | Малый объём помогает, но Cart — 378 строк повторённой статической JSX-разметки |

## Что было проверено

- Все файлы `src`, `package.json`, `package-lock.json`, HTML shell и legacy-ассеты в `public`.
- Текущий dependency tree через `npm ls --depth=0`.
- Production build через `npm run build`.
- Advisory snapshot через `npm audit --json`.
- Доступность и фактическая схема endpoint, зашитого в `Home`.
- UI/UX, responsive и accessibility по фактической DOM/SCSS-разметке.
- Визуальное подключение к локальному приложению было предпринято, но заблокировано системным Windows sandbox/ACL. Поэтому в документе нет выводов, основанных на неподтверждённых скриншотах; визуальные выводы опираются на код и CSS.

Рабочее дерево до аудита было чистым. Диагностическая сборка создаёт только игнорируемую папку `build/`.

## Карта текущего приложения

```text
BrowserRouter
└── Redux Provider
    └── App
        ├── SearchContext
        ├── Header
        │   ├── Brand link
        │   ├── Search
        │   └── Static cart badge
        └── Routes
            ├── /      → Home
            ├── /cart  → static Cart markup
            └── *      → NotFound
```

Текущий data flow:

```text
URL query ──mount-only parse──▶ filterSlice
                                 │
Search local state ─▶ Context    ├──▶ Home effect ─▶ Axios ─▶ local items
                                 │
filterSlice ──effect─────────────┴──▶ URL query
```

Проблема схемы — у одного catalog concern пять владельцев: Router/URL, Redux, Context, local state Search и local state Home.

## Что уже можно сохранить

- React 18 root API используется корректно: `src/index.js:11-18`.
- Подключены Redux Toolkit и declarative routing без самописного boilerplate: `src/redux/store.js:1-7`, `src/App.js:21-24`.
- Категория, сортировка, страница и поиск уже влияют на API query: `src/pages/Home.jsx:58-69`.
- Поиск debounced: `src/components/Search/index.jsx:17-27`.
- Есть заготовка skeleton loading: `src/components/PizzaBlock/PizzaSkeleton.jsx:4-20`.
- Logo/cart/back navigation используют `Link`, а viewport не запрещает zoom.
- Кодовая база мала: миграцию можно сделать последовательно, без длительного coexistence двух архитектур.
- Git history сохранена и даёт ясный baseline tutorial → product transformation.

## Critical findings

### P0 — purchase journey является имитацией

- Кнопка «Добавить» не имеет handler, счётчик всегда равен `0`: `src/components/PizzaBlock/index.jsx:50-64`.
- Выбор теста и размера существует только как локальный индекс и не меняет цену: `src/components/PizzaBlock/index.jsx:13-15`, `26-49`.
- Redux store содержит только `filter`: `src/redux/store.js:4-7`.
- Header показывает захардкоженные `520 ₽` и `3`: `src/components/Header.jsx:19-52`.
- Cart содержит четыре повторённые строки по `770 ₽`, но итог говорит «3 шт.» и `900 ₽`: `src/pages/Cart.jsx:74-347`.
- Очистка, quantity, remove и payment визуально активны, но реализованы как `div` без поведения: `src/pages/Cart.jsx:37-71`, `87-137`, `368-370`.

Это сильнейший perceived-quality дефект: интерфейс обещает коммерческий сценарий и немедленно выдаёт fake UI.

### P0 — keyboard accessibility системно сломана

- Глобальный reset задаёт `outline: none` каждому элементу: `src/scss/libs/_normalize.scss:1-7`.
- В проекте нет компенсирующего `:focus-visible`.
- Категории, сортировка, dough/size selectors и clear-search построены на `li`, `span` и `svg` с `onClick`: `src/components/Categories.jsx:13-21`, `src/components/Sort.jsx:40-51`, `src/components/PizzaBlock/index.jsx:22-45`, `src/components/Search/index.jsx:51-59`.
- Большинство cart controls — несемантичные `div`.

Критический flow невозможно уверенно пройти с клавиатуры; screen reader не получает роли, имена и состояния controls.

### P0 — data failure выглядит как бесконечная загрузка

`Home` обрабатывает только `.then`; `catch`, `finally`, timeout, cancellation и retry отсутствуют: `src/pages/Home.jsx:58-73`. При ошибке `isLoading` остаётся `true` навсегда. При быстрых запросах старый response может заменить более новый.

## Architecture and state audit

### Routing

Есть только `/`, `/cart` и wildcard: `src/App.js:21-24`. Отсутствуют routes для:

- product details/configurator;
- checkout и fulfillment;
- confirmation и tracking;
- favorites, history и profile/auth.

Все routes импортируются eagerly: `src/App.js:6-9`.

### Redux Toolkit

Текущий `filterSlice` хранит category/page/sort: `src/redux/slices/filterSlice.js:3-29`. Для сегодняшнего объёма Redux избыточен, но для целевого продукта его следует сохранить под cart и fulfillment context. Checkout draft по умолчанию остаётся route-owned; Redux нужен ему только при доказанном multi-route lifecycle. Catalog query state из Redux нужно убрать, а не синхронизировать ещё сложнее.

### Search and URL state

- Search хранит input draft локально и committed value в глобальном Context: `src/App.js:11-18`, `src/components/Search/index.jsx:7-26`.
- URL читается через `window.location.search` только при mount: `src/pages/Home.jsx:28-40`.
- Search намеренно исключён из сериализации: `src/pages/Home.jsx:44-49`.
- Back/Forward после mount не является полноценным источником обновления UI.
- `list.find` может вернуть `undefined` для неизвестного `sortProperty`: `src/pages/Home.jsx:29-36`.
- Затем код без проверки обращается к `sort.sortProperty` и `sort.sortName`: `src/pages/Home.jsx:45`, `60`; `src/components/Sort.jsx:39-40`.
- `setFilters` превращает отсутствующие числа в `NaN`: `src/redux/slices/filterSlice.js:25-29`.
- Category/search/sort не сбрасывают page; валидная страница старого результата становится ложным empty state нового.
- В URL протекают внутренние имена `activeCategory` и numeric index вместо устойчивых slugs.
- `navigate` на каждое изменение по умолчанию плодит history entries: `src/pages/Home.jsx:42-56`.
- Подтверждённый regression: direct load `?sortProperty=-rating&activeCategory=0&currentPage=1` выставляет `isSearch=true`, пропускает первый fetch, оставляет primitive effect dependencies на defaults и больше не запускает effect — skeleton остаётся бесконечно (`src/pages/Home.jsx:28-40`, `76-82`).

Текущий URL state shareable только частично и не имеет безопасного codec contract.

### Catalog fetching

`Home` одновременно парсит URL, сериализует URL, строит request, управляет loading и рендерит каталог: `src/pages/Home.jsx:28-95`.

Проблемы:

- API URL зашит в component: `src/pages/Home.jsx:68`.
- Query собирается конкатенацией строк.
- Нет cache, deduplication, stale-data UX и normalized error.
- Нет abort/out-of-order protection.
- `window.scrollTo(0, 0)` срабатывает и после каждого debounced search: `src/pages/Home.jsx:76-82`.
- API limit равен 4, skeletons отрисовываются в количестве 6: `src/pages/Home.jsx:68`, `85`.
- `pageCount={3}` захардкожен и не зависит от результата: `src/components/Pagination/index.jsx:20`.

### Product model

Текущая схема `types[]`, `sizes[]`, одна `price` не выражает:

- цену конкретного variant;
- несовместимые dough/size combinations;
- ingredient removal и modifier constraints;
- paid extras;
- combos;
- availability;
- allergens/dietary metadata;
- authoritative server quote.

Перед созданием UI-конфигуратора нужна новая typed domain model.

### Cart

Корзины как stateful subsystem нет. Отсутствуют:

- line identity/fingerprint;
- add/increment/decrement/remove/clear/edit actions;
- derived totals selectors;
- persistence и schema migration;
- empty state branch;
- reconciliation с актуальным catalog;
- checkout transition.

`src/pages/Cart.jsx` — hotspot: 378 строк статической и повторяющейся разметки, массово использующей `class` вместо `className` и SVG-атрибуты в HTML spelling.

## API audit

Текущий endpoint на момент среза отвечает `200` и содержит 10 записей. Фактические поля:

```text
id, imageUrl, title, types, sizes, price, category, rating
```

Endpoint не владеет необходимыми delivery-сущностями: descriptions, ingredients, variants, modifiers, combos, promos, stores, fulfillment quotes, orders и order events. Изображения hotlinked с Dodo CDN; права, SLA и долговечность URL неизвестны.

Другие риски:

- ownership, credentials, seed/reset path и SLA публичного MockAPI не документированы и не подтверждены;
- pagination total не является частью стабильного response contract;
- catalog data и UI domain coupling основаны на numeric arrays;
- нет runtime validation;
- нет documented seed/reset path.

Текущий MockAPI нельзя оставлять production-demo source.

## UI/UX audit

### Visual identity

- Tutorial brand прямо выведен в `src/components/Header.jsx:13`.
- Title и description остаются tutorial/CRA: `public/index.html:8`, `19`.
- Жёлтый фон, белый rounded sheet и orange `#fe5f1e` повторяют узнаваемую tutorial-композицию: `src/scss/app.scss:6-19`.
- Карточка не показывает composition, badges, availability, favorite, reason-to-buy или details route.
- В `public` лежат исходные HTML-макеты, скомпилированные CSS/JS и неиспользуемые шрифты — это усиливает ощущение незавершённого tutorial dump.

Нужны самостоятельные brand, content hierarchy, photography direction и design tokens; простого «освежить цвета» недостаточно.

### Responsive

- Search имеет фиксированные `400px` и `left: -120px` без media rules: `src/components/Search/Search.module.scss:1-13`.
- Header перестраивается только ниже `595px`: `src/scss/components/_header.scss:8-23`.
- На mobile search остаётся шире доступного container.
- Product card фиксирована на `280px`, а mobile media rule пуст: `src/scss/components/_pizza-block.scss:3-15`.
- Categories ниже `595px` превращаются в шесть вертикальных строк с фиксированной шириной `290px`: `src/scss/components/_categories.scss:24-38`.
- Cart flex-row layout и две CTA по `210px` не имеют mobile adaptations: `src/scss/app.scss:136-210`, `257-299`.
- Grid использует жёсткие viewport breakpoints вместо fluid `minmax/auto-fit`: `src/scss/app.scss:31-47`.

### Semantics and accessibility

- `lang="en"` при русском UI: `public/index.html:2`.
- Нет `<header>`, `<main>`, `<nav>` и skip-link: `src/App.js:17-26`, `src/components/Header.jsx:7-8`.
- Heading hierarchy: brand `<h1>`, page `<h2>`, product `<h4>`: `src/components/Header.jsx:13`, `src/pages/Home.jsx:93`, `src/components/PizzaBlock/index.jsx:21`.
- Search input не имеет label/aria-label/name: `src/components/Search/index.jsx:43-50`.
- Sort trigger не имеет `aria-expanded`, Escape/outside-click/focus contract.
- Product selectors визуально похожи на radios, но не имеют `fieldset`, `legend` или `aria-pressed`.
- Product image использует generic `alt="Pizza"`, не имеет intrinsic dimensions, `loading` и fallback: `src/components/PizzaBlock/index.jsx:20`.
- Touch targets clear/quantity/selector меньше 44×44.
- `transition: all` используется в нескольких местах; `prefers-reduced-motion` отсутствует.
- Orange `#fe5f1e` с белым недостаточен для обычного мелкого текста; серые `#b6b6b6` и `#8d8d8d` также не достигают AA на белом.

### Loading, empty, error, offline

| Surface | Сейчас | Дефицит |
|---|---|---|
| Catalog loading | 6 SVG skeletons | Геометрия не совпадает с 4-item page; нет `aria-busy`/reduced motion |
| Catalog empty | Пустой grid + pagination | Нет причинно-зависимого сообщения и reset action |
| Catalog error | Вечный skeleton | Нет retry и last-known content |
| Offline | Нет | Нет banner/state и блокировки submit |
| Image failure | Нет | Нет fallback |
| Empty cart | Стили есть, React branch нет | Нужен реальный CTA в меню |
| Mutation feedback | Нет | Нужны optimistic local actions, undo/rollback где уместно |
| Async announcements | Нет | Нужен `aria-live` для cart/search/promo/payment |

## Testing and quality audit

- Тестовых `*.test.*`/`*.spec.*` файлов нет.
- Нет Vitest/Jest config вне скрытого CRA setup, Playwright/Cypress, MSW, axe и CI workflow.
- Testing Library установлена, но не используется: `package.json:7-9`.
- Нет scripts для `typecheck`, отдельного `lint`, E2E, coverage и format: `package.json:26-30`.
- Нет Error Boundary, contract tests, persistence migration tests и runtime fixtures.

Production build завершился успешно, bundle snapshot:

- JS: 95.52 kB gzip;
- CSS: 2.62 kB gzip.

Build выдал 4 ESLint warnings:

- debounce callback dependencies: `src/components/Search/index.jsx:17`;
- missing `dispatch`: `src/pages/Home.jsx:40`;
- missing `navigate`: `src/pages/Home.jsx:56`;
- missing `fetchPizzas`: `src/pages/Home.jsx:82`.

Размер bundle сейчас не является проблемой; функциональная глубина слишком мала, чтобы считать этот показатель успехом.

## Dependency and maintenance audit

Текущий stack:

- CRA / `react-scripts 5.0.1`;
- React 18.2;
- Redux Toolkit 1.9.5;
- React Router 6.10;
- JavaScript;
- Sass + смесь global SCSS и CSS Modules.

Advisory snapshot на 27.08.2026: **76 total — 4 critical, 37 high, 20 moderate, 15 low**. Значительная часть приходит транзитивно через старый CRA build/test chain и не равна 76 exploitable runtime vulnerabilities. Однако это убедительный сигнал заменить `react-scripts`, а не применять `npm audit fix --force` вслепую.

Отдельно:

- direct `axios@1.4.0` отмечен audit как high;
- direct unused `sort-by` отмечен moderate;
- `localforage`, `match-sorter`, `sort-by`, `web-vitals` не импортируются из `src`;
- все packages, включая toolchain/test, находятся в `dependencies`; `devDependencies` нет;
- `qs` нужен только текущей ручной URL-синхронизации;
- Axios не нужен после перехода на RTK Query `fetchBaseQuery`.

Legacy/dead assets:

- `public/cart.html`;
- `public/cart-empty.html`;
- `public/css/app.css`;
- `public/js/app.js`;
- неиспользуемые ProximaNova font files;
- часть SVG/PNG assets без ссылок из `src`.

Удалять их следует только в milestone с baseline coverage, не в рамках этого аудита.

## Performance baseline

Проблемы, которые станут заметны после расширения продукта:

- eager route imports;
- отсутствие server-state cache/deduplication;
- полный skeleton reset при каждом query change;
- изображения без responsive sources, dimensions и lazy loading;
- search request не отменяется;
- debounce не очищается при unmount;
- нет prefetch details по hover/focus;
- нет bundle budgets или Web Vitals gate.

Что **не** нужно добавлять:

- virtualization для обычного меню;
- массовый `React.memo` без profiling;
- SSR/Next.js только ради моды;
- service worker/PWA до появления доказанной offline-задачи;
- microfrontends, event bus или многослойную enterprise-архитектуру.

## Keep / replace / add

| Решение | Вердикт | Причина |
|---|---|---|
| Git history | Keep | Хорошая история трансформации для портфолио |
| React Router | Keep and modernize | Routes и URL state нужны; текущую ручную синхронизацию заменить |
| Redux Toolkit | Keep | Целевые cart/fulfillment оправдывают глобальный client state; checkout draft остаётся route-owned |
| Filter slice | Replace | URL должен быть единственным source of truth для catalog query |
| Search Context | Remove | Дублирует route state |
| CRA | Replace with Vite | Deprecated toolchain и основной источник dependency debt |
| JavaScript | Migrate to strict TypeScript | Нужны гарантии для pricing/cart/order contracts |
| Axios effects | Replace with RTK Query | Нужны cache, status, cancellation и typed endpoints |
| Current MockAPI | Replace | Ownership/SLA не подтверждены и нет нужной схемы |
| Sass | Keep, constrain | Достаточно для бренда; использовать CSS Modules + CSS custom-property tokens |
| `localforage` | Remove | Versioned localStorage достаточно для небольшой корзины |
| Pagination by 4 | Replace UX | Для delivery-menu лучше sections/sticky categories; pagination только при реальной необходимости |

## Основные риски трансформации

1. **Слишком ранний backend.** Supabase до готового guest flow может превратить frontend-портфолио в auth/RLS-проект.
2. **Конфигуратор без domain rules.** Визуальные controls без pricing/compatibility contract повторят текущий fake UI на новом уровне.
3. **Big-bang redesign.** Длинный период без сквозного working flow ухудшит проверяемость.
4. **Decorative auth/payment.** Форма логина или карты без продуктовой пользы снизит доверие.
5. **Чрезмерная motion/3D работа.** Wow-effect не должен вытеснить checkout, state coverage и accessibility.
6. **Недетерминированный demo backend.** Portfolio reviewer должен всегда пройти happy path и явно запустить failure scenarios.

## Неизвестные, которые нужно решить перед release

- Hosting target и SPA rewrite policy.
- Права на будущие product photos и brand assets.
- Нужен ли cross-device account experience или достаточно guest-first demo.
- Browser/runtime contract для transformation уже выбран в `ARCHITECTURE.md`; его нужно проверить на выбранном hosting target.
- География/валюта/правила delivery zone; baseline предполагает русский UI и RUB.
- Нужны ли реальные analytics/monitoring; vendor не следует выбирать до определения событий и privacy scope.

## Baseline conclusion

Существующий код достаточно мал, чтобы не тащить tutorial constraints дальше. Оптимальная стратегия — ранняя безопасная миграция toolchain и типов, затем последовательные product slices: меню → discovery → configurator → cart → checkout → order lifecycle → retention. Выбранное направление и целевая архитектура описаны в `PRODUCT_OPTIONS.md`, `TRANSFORMATION_SPEC.md` и `ARCHITECTURE.md`.
