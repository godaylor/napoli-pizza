# Napoli product transformation plan

Napoli rebrand: GREEN. Package metadata is prepared for `06-napoli`; renaming the open repository root remains a separate manual step.

Статус: **Core plan complete: Milestones 1A–10B and 12 GREEN; Milestone 11 formally SKIPPED by ADR-001 (2026-08-28).**

Метод: компактные vertical milestones. Каждый milestone заканчивается отдельным проверяемым пользовательским результатом и не оставляет видимых dead controls.

Planning source of truth: `docs/TRANSFORMATION_SPEC.md` и `docs/ARCHITECTURE.md`.

## Execution rules

- Не начинать следующий milestone, пока текущий не проходит свой Definition of Done.
- Accessibility, responsive, loading/error/offline и route splitting реализуются вместе с owning surface, не в финальном polish.
- Один milestone не должен одновременно менять bundler, framework major, product domain и visual system.
- Core guest flow не зависит от Supabase/auth.
- Не переписывать git history. Commit/push — только по явному поручению пользователя.

### Optimistic UX policy

- Local cart mutations выполняются немедленно; remove/clear дают undo.
- Local favorites выполняются немедленно; remote favorite toggle оптимистичен только с rollback и error announcement.
- Promo, fulfillment quote, payment и order creation никогда не показывают optimistic success.
- Order mutation retries используют idempotency/status recovery, а не blind retry.

## Roadmap at a glance

| # | Milestone | User-visible checkpoint |
|---:|---|---|
| 1A | Vite behavior lock | Текущий продукт работает на прозрачном toolchain |
| 1B | Strict TypeScript + resilience | Invalid URL/API failure восстанавливаются безопасно |
| 2A | Napoli brand shell | Самостоятельная responsive оболочка |
| 2B | Owned menu | Полное меню без внешнего tutorial API |
| 3 | Discovery URL | Search/filter/sort survives share/reload/back |
| 4A | Product + variant → cart | Размер/тесто можно выбрать и добавить |
| 4B | Full pizza configuration | Removals/modifiers/add-ons дают точную line identity |
| 5A | Durable editable cart | Cart переживает reload и редактируется |
| 5B | Fixed combos + recommendations | Готовый набор и contextual add-ons работают |
| 6A | Guest delivery checkout | Адрес/контакт/ASAP дают delivery quote |
| 6B | Pickup, scheduling, recovery | Pickup/time и fulfillment failures обработаны |
| 7 | Promo + final quote | Скидка и итог объяснимы и authoritative |
| 8 | Mock payment + confirmation | Один order безопасно подтверждается |
| 9 | Live-looking tracking | Order проходит доступные стадии |
| 10A | Favorites | Favorite survives reload |
| 10B | History + repeat | Прошлый order можно безопасно повторить |
| 11 | Optional account + Supabase | Cross-device favorites/history после passwordless sign-in |
| 12 | Production release gate | Все построенные flows измерены и проверены |

---

## Milestone 1A — Vite behavior lock

### User-visible outcome

Текущий каталог, cart route и not-found открываются без регрессий, но приложение запускается и собирается через Vite.

### Scope

- Зафиксировать текущие routes и catalog smoke behavior тестами.
- CRA → Vite без одновременного React major upgrade и redesign.
- Current Active LTS pinned in `engines`, CI and one version file (Node 24.x at audit), plus explicit env contract and dev/build/preview/lint/test scripts.
- Минимальный permanent `:focus-visible` foundation; удалить global `outline: none`.
- Поднять initial CI для install, lint, test и build.

### Definition of Done

- `react-scripts` отсутствует; Vite dev/build/preview green.
- `/`, `/cart`, unknown route и direct reload работают.
- Current behavior smoke tests green.
- CI запускается из clean install.
- Native controls/links имеют видимый focus; это не temporary workaround.

### Tests

- App/router smoke.
- Existing category/sort/search happy-path regression.
- Build/preview smoke.

### Browser / E2E verification

- Direct open/reload `/`, `/cart`, `/missing` на preview server.
- Chromium smoke at 390 and 1440 px.
- Keyboard focus видим на существующих native links/buttons.

### Risks

- Bundler differences могут выглядеть как product regressions. Mitigation: не обновлять framework majors в этом slice.
- Current MockAPI нестабилен. Mitigation: smoke data controlled by MSW; production source меняется в 2B.

### Implementation evidence (2026-08-28) — GREEN

- CRA удалён: `react-scripts` отсутствует; React остался на 18.3.1; Vite 8.2.2 обслуживает `dev`, `build` и `preview`.
- Node закреплён как 24.20.0 в `.nvmrc`, `engines` и GitHub Actions; workflow выполняет clean install, typecheck, zero-warning lint, tests, build и Playwright.
- `npm ci`, `npm run build` и preview-backed `npm run test:e2e` завершились с exit code 0; stale legacy `public/cart.html` bundle удалён, поэтому `/cart` и hard reload разрешаются через React Router.
- Controlled behavior coverage сохраняет `/`, `/cart`, unknown route, category/sort/search; Playwright подтверждает direct open/reload и постоянный `:focus-visible` на 390 и 1440 px.
- Remote GitHub Actions в этой локальной итерации не запускался. Эквивалентный local gate прошёл; host Node 22.15.1 ниже project pin и сообщает `EBADENGINE`, что является ограничением окружения, а не application failure.

---

## Milestone 1B — Strict TypeScript and baseline resilience

### User-visible outcome

Malformed shared URL и catalog network error больше не дают crash/вечный skeleton; пользователь видит safe normalization или retry.

### Scope

- Полная JS/JSX → strict TS/TSX migration.
- Typed Redux hooks, current API types и targeted runtime validation.
- Safe URL defaults/unknown handling до полноценного URL codec в milestone 3.
- Route error boundary, catalog error/finally/retry and MSW scenarios.
- Remove unused direct packages and remediate any direct runtime advisory still present after CRA removal. Library majors land only with their owning feature; no unrelated React major is bundled into this milestone.
- Typecheck и zero-warning lint в CI.

### Definition of Done

- В application `src` нет необоснованных JS/JSX files.
- `strict: true`, typecheck and lint zero warnings.
- Invalid sort/page/query safely normalizes.
- API 500/offline ends loading and offers retry.
- Dependency audit triaged; нет нерассмотренных critical/high direct runtime findings.

### Tests

- Malformed/default URL cases.
- Regression for direct load `?sortProperty=-rating&activeCategory=0&currentPage=1`: no endless skeleton.
- Catalog loading/success/500/offline/retry integration.
- Route error boundary and NotFound.
- Typed store hooks compile contract.

### Browser / E2E verification

- Open malformed query directly; app remains usable.
- 500 → error → retry → products.
- Offline state preserves navigation and returns after reconnect.
- Console has no React/attribute/hook warnings.

### Risks

- Full TS conversion может превратиться в premature domain redesign. Mitigation: type current behavior only; product model starts in 2B/4A.
- Type migration can expose existing behavior defects. Mitigation: preserve baseline fixtures and separate behavior fixes into named tests.

### Implementation evidence (2026-08-28) — GREEN

- Application `src` полностью переведён на TS/TSX; `strict: true`, typed Redux hooks, current catalog contracts и runtime validation compile без ошибок.
- Malformed/default query normalization, exact shared URL regression, loading completion, invalid payload, HTTP 500, offline/online retry, NotFound и route error boundary покрыты 14 Vitest tests.
- Финальный clean-install gate: typecheck GREEN; ESLint `--max-warnings 0` GREEN; 14/14 tests GREEN; coverage 92.62% statements / 81.15% branches; Vite production build GREEN.
- Browser/E2E: 14/14 Playwright tests GREEN на 390 и 1440 px; `/`, `/cart`, `/missing`, malformed URL, 500 → retry, offline → reconnect, visible focus и browser console проверены.
- Unused direct dependencies удалены. `npm audit` содержит 0 critical/high и 2 рассмотренных moderate findings в React Router 6; доступный automatic fix требует major 7, SSR finding неприменим к этой SPA, а пользовательские redirect destinations отсутствуют. Major upgrade отложен до owning milestone.
- Boundary at this gate: Milestone 2A и redesign не были преждевременно включены в M1B.

---

## Milestone 2A — Napoli brand and responsive shell

### User-visible outcome

Пользователь видит самостоятельный Napoli app shell с responsive navigation, correct metadata и согласованной visual identity; tutorial branding исчезает.

### Scope

- Brand lockup, favicon/app icon, title/description/theme color and `lang="ru"`.
- Tokens: color, typography, spacing, radius, elevation, motion, focus.
- Semantic skip link/header/nav/main and responsive search/cart locations.
- App canvas and navigation at 320–1440 px.
- Font preload/display strategy and reduced-motion base.
- Existing catalog content временно рендерится внутри нового shell; data rewrite остаётся в 2B.

### Definition of Done

- Нет customer-facing React/CRA/tutorial copy.
- Shell не использует yellow tutorial sheet/dominant orange actions.
- Landmarks, page heading and skip link корректны.
- No horizontal scroll at 320/390/768/1024/1440.
- Focus token permanent and AA contrast.
- Metadata/icons работают без 404.

### Tests

- App shell landmarks/navigation.
- Skip-link target and focus.
- Metadata smoke where practical.
- Reduced-motion token/unit style assertions only where stable.

### Browser / E2E verification

- Visual smoke/screenshots at all required widths.
- Keyboard skip link → header → main.
- 200% zoom and reduced motion.
- Header search/cart do not overlap at tablet widths.

### Risks

- Brand work может разрастись в standalone design phase. Mitigation: один shell vertical; component library grows only with real features.
- Fonts/visual effects могут ухудшить LCP. Mitigation: measure shell asset budget now.

### Implementation evidence (2026-08-28) — GREEN

- Customer-facing shell полностью переведён на Napoli: porcelain/carbon canvas, cobalt action/focus, oven-ring mark, responsive operational rail, navigation, search and honest empty cart; framework/tutorial branding and yellow/orange shell absent.
- `lang="ru"`, title/description/theme color, SVG favicon/app icon and web manifest resolve successfully; every route exposes a meaningful `<h1>`, landmarks and a keyboard skip link.
- CSS tokens cover typography, spacing, radii, elevation, motion and permanent focus; `prefers-reduced-motion` and 200% text zoom are verified.
- Quality gate: typecheck GREEN; ESLint `--max-warnings 0` GREEN; 17/17 Vitest tests GREEN; coverage 94.92% statements / 87.58% branches / 92.85% functions / 95.12% lines; Vite production build GREEN.
- Browser/E2E: 22/22 Playwright tests GREEN. Chromium screenshots and overflow assertions cover 320/390/768/1024/1440 px; tablet search/navigation geometry, focus, routes, offline/retry recovery, metadata and console cleanliness verified.
- Playwright preview is isolated on strict port 4188 with `reuseExistingServer: false`, preventing accidental reuse of an unrelated local preview server.
- Built asset budget at the gate: CSS 17.33 kB (4.31 kB gzip), JavaScript 230.33 kB (76.04 kB gzip), metadata shell 1.58 kB (0.75 kB gzip).

## Milestone 2B — Owned full menu and data states

### User-visible outcome

Пользователь просматривает полноценное, правдоподобное меню Napoli по категориям; каталог не зависит от публичного tutorial API и ясно переживает loading, empty, error и offline.

### Scope

- Owned versioned catalog: 12–16 pizzas, 3–4 fixed combos, 4–6 snacks/drinks и 3–4 desserts/sauces.
- 12–16 master food images with controlled rights, consistent crop/light and responsive AVIF/WebP derivatives; 6–8 assets may be the first visual prototype set.
- Canonical `/menu` route (`/` redirects/aliases to it) plus typed demo API adapter and current stable Redux Toolkit/RTK Query endpoints for menu/product/availability; MSW reproduces latency, empty, 500, offline and stale-refetch.
- Semantic category sections and product cards. До 4A не показывать неработающие add/details controls.
- Skeletons preserve card geometry; image fallback preserves layout.
- Menu remains eager; payment/account code is absent from its initial chunk.

### Definition of Done

- Current MockAPI and Dodo hotlinks are absent from the catalog runtime.
- Every planned category has coherent products, descriptions, price-from, badges, allergens and availability.
- Loading, empty, first-load error, offline and background-refetch states are visually distinct; stale content remains usable during refetch.
- No pagination: the owned catalog is small enough for category/filter navigation.
- Card images have intrinsic geometry, responsive sources and below-fold lazy loading.

### Tests

- Catalog fixture/schema contract and unique slug/ID checks.
- RTK Query loading/success/empty/500/offline/stale integration tests.
- Product card semantics, availability and image fallback.
- Query cache keys include every current request argument.

### Browser / E2E verification

- Browse every category at 320, 390, 768, 1024 and 1440 px.
- Toggle deterministic slow/empty/500/offline demo scenarios and recover without reload where applicable.
- Confirm previous products remain visible and marked stale during background refetch.
- Network trace shows no MockAPI/Dodo requests and no eager payment/account chunks.

### Risks

- Content/photography can dominate the schedule. Mitigation: lock the content budget and art direction before producing derivatives.
- A long menu can hurt rendering. Mitigation: measure first; no virtualization or broad memoization without evidence.

### Implementation evidence (2026-08-28) — GREEN

- Canonical `/menu` is live and `/` redirects to it. The versioned owned fixture contains 36 coherent products: 14 pizzas, 4 fixed combos, 5 snacks, 5 drinks, 4 desserts and 4 sauces; IDs/slugs, descriptions, minor-unit price-from, badges, allergens and availability are contract-tested.
- Redux Toolkit store owns the existing temporary filter bridge; RTK Query owns menu/product/availability server state, includes every request argument in cache keys and keeps stale data usable during the explicit background-refetch scenario.
- Deterministic owned demo adapter and visible test controls cover normal, slow, empty, HTTP 500, offline and stale-refetch states. First-load errors and background failures remain visually distinct and recover without reload.
- Eight project-owned master food images form the approved prototype set; 48 local 480/960 px AVIF/WebP/JPEG derivatives provide `<picture>` sources, intrinsic 960×960 geometry, eager above-fold loading, below-fold lazy loading and an accessible controlled fallback.
- MockAPI/Dodo URLs and pagination are absent from the runtime and production network trace. Legacy API/Pagination/PizzaBlock modules and `react-paginate`, `react-content-loader`, `@types/react-paginate` were removed after replacement coverage.
- Quality gate: typecheck GREEN; ESLint `--max-warnings 0` GREEN; 29/29 Vitest tests GREEN; coverage 94.94% statements / 91.01% branches / 94.49% functions / 95.63% lines; Vite production build GREEN.
- Browser/E2E: 18/18 Playwright tests GREEN on Chromium 390/1440 projects. Every category is browsed at 320/390/768/1024/1440 px; no overflow, demo recovery, stale usability, image fallback, canonical routes, reduced motion, 200% zoom, metadata and clean console are verified.
- Built app shell/catalog budget at the gate: CSS 20.44 kB (4.87 kB gzip), JavaScript 283.30 kB (90.98 kB gzip). No payment/account/checkout chunks or requests exist.
- `npm audit --omit=dev` remains at the previously reviewed two moderate React Router 6 advisories; the available fix is breaking major 7, the SSR item is inapplicable to this SPA, and all navigation destinations are internal.
- Boundary at this gate: M3 discovery URL/state не был преждевременно включён в M2B.

---

## Milestone 3 — Search, sort, filters and shareable URL

### User-visible outcome

Пользователь может искать, сортировать и фильтровать меню, делиться ссылкой и получать то же состояние после reload и Back/Forward.

### Scope

- One typed URL codec owned by React Router.
- Canonical params: `q`, `category=<slug>`, `sort=<key>`, `diet=vegetarian`, `spicy=1`, `availability=1`; defaults and false values are omitted.
- Search covers product names, descriptions, ingredient names and explicit aliases; input updates use replace/debounce policy without losing committed navigation history.
- Stable sort keys and product category slugs; unknown/duplicate params normalize deterministically.
- Result count, no-results recovery and clear-all action.
- No filter Redux slice, Search Context, page or cursor.

### Definition of Done

- URL is the sole source of catalog query state.
- Copy/paste, direct load, reload and Back/Forward reproduce the same normalized result.
- Changing a control never creates a false empty state from stale pagination.
- Search race/cancellation cannot replace a newer result with an older one.
- Filter controls are keyboard-operable and announce the updated result count.

### Tests

- URL parse/serialize/normalize round trips, defaults, unknowns and Unicode search.
- Search aliases, category/filter intersections and every sort key.
- Debounce/race/cancellation integration.
- No-results → clear one filter → recover.

### Browser / E2E verification

- Build a multi-filter URL, copy it into a new tab, reload, then use Back/Forward.
- Search quickly under throttled network and verify latest-query wins.
- Keyboard-only open/change/clear controls on mobile and desktop.
- A shared URL with unknown legacy params normalizes without crash or endless skeleton.

### Risks

- Mirrored state can reappear through convenience hooks. Mitigation: components read/write only the URL codec.
- Query history can become noisy. Mitigation: replace while typing; push only intentional navigation changes.
### Implementation evidence (2026-08-28) — GREEN

- React Router URL codec is the sole discovery source for canonical `q/category/sort/diet/spicy/availability`; defaults, duplicates, unknown and legacy params normalize deterministically, and the temporary filter slice/Search Context were removed.
- Owned catalog search covers aliases/composition/badges/allergens; category, dietary, spicy and availability intersections plus all stable sorts run through one RTK Query adapter. Result count, clear-all and one-condition recovery are functional.
- Quality gate: typecheck GREEN; ESLint `--max-warnings 0` GREEN; 28/28 focused Vitest tests GREEN; Vite production build GREEN.
- Browser/E2E: 2/2 focused Chromium journeys GREEN. Shared URL/new tab/reload/Back/Forward, latest-query-wins under the slow scenario, keyboard recovery, unknown legacy normalization and no overflow at 320/390/768/1024/1440 px are verified.

---

## Milestone 4A — Product details, variants and basic add-to-cart

### User-visible outcome

Пользователь открывает пиццу, изучает состав/allergens, выбирает размер и тесто, видит новую цену и добавляет выбранный variant в работающую корзину.

### Scope

- Current stable Router route config plus lazy `/menu/:productSlug` with responsive details layout, unavailable/not-found states and intent prefetch from cards.
- Typed `ProductVariant` model for valid size/dough combinations, weight and `basePriceMinor`.
- Pure variant availability and base-price preview rules using integer minor units.
- Minimal `cartSlice` and lazy `/cart`: show product, variant, quantity and derived subtotal.
- Card/details controls become real links/actions; mobile details uses one contextual sticky CTA.
- Product metadata includes description, ingredients, allergens and optional nutrition.

### Definition of Done

- Invalid/unavailable variant combinations cannot be submitted and have an explained state.
- CTA copy includes the current derived price; no floating-point money logic exists in components.
- Added variant appears in header count and cart; identical base configurations merge by quantity.
- Product and cart route chunks are separate and verified.
- Returning from cart preserves the catalog URL.

### Tests

- Variant matrix, availability and money calculation unit tests.
- Details loading/not-found/unavailable and add-to-cart integration.
- Basic cart merge/count/subtotal selectors.
- Route prefetch does not fetch every product eagerly.

### Browser / E2E verification

- Menu → details → change size/dough → add → cart → back to exact discovery state.
- Reload product and cart direct routes on preview server.
- Keyboard/screen-reader control names, price announcement and sticky CTA at 320/390 px.
- Network trace proves details/cart lazy chunks and intent prefetch.

### Risks

- Variant UX can imply impossible combinations. Mitigation: catalog owns an explicit valid matrix, not independent arbitrary arrays.
- Sticky mobile CTA can obscure content/focus. Mitigation: safe-area spacing and zoom/keyboard checks.
### Implementation evidence (2026-08-28) — GREEN

- Lazy `/menu/:productSlug` and `/cart` routes, selected-product intent prefetch, explicit pizza variant matrices, integer price preview, loading/not-found/unavailable states and exact discovery return state are implemented.
- Minimal non-persistent cart handoff merges identical base configurations, derives count/subtotal from the current typed catalog and exposes the live count in desktop/mobile navigation. Persistence/edit/quantity mutations remain owned by M5A.
- Quality gate: typecheck GREEN; ESLint `--max-warnings 0` GREEN; 37/37 focused Vitest tests GREEN; Vite production build GREEN. Build output contains separate Product (6.50 kB) and Cart (2.45 kB) route chunks.
- Browser/E2E: 2/2 focused Chromium journeys GREEN. Menu → details → variant → add/merge → cart → exact discovery URL, direct product/cart reload, keyboard controls, contextual sticky CTA, scoped prefetch and layouts at 320/390/768/1024/1440 px are verified.

---

## Milestone 4B — Full pizza configuration and exact line identity

### User-visible outcome

Пользователь удаляет допустимые базовые ингредиенты, выбирает modifiers/add-ons и получает точную динамическую цену; разные рецепты остаются разными строками корзины.

### Scope

- Product-specific `ProductIngredient.removable`; base removal has zero price effect in core.
- Required/optional modifier groups with min/max constraints, availability and paid deltas; extras are optional modifier groups.
- One canonical `CartConfiguration`: product, variant, sorted removed ingredient IDs and selections sorted by group/modifier ID.
- One canonical serializer reused by fingerprint, persistence input, quote input, edit seed and future reorder.
- Accessible configurator groups, constraint messaging, live price and configuration summary.
- Fixed combos are not configured here; a second combo builder is out of core.

### Definition of Done

- Invalid min/max or unavailable selections cannot enter cart; the first issue is actionable.
- Price is `variant base + selected modifier deltas`; removing a base ingredient never changes it.
- Same canonical configuration merges; any variant/removal/modifier difference creates a distinct line.
- Cart displays a human-readable configuration summary, not raw IDs.
- Reordering selection operations yields the same fingerprint and price.

### Tests

- Price table, modifier constraints and unavailable-option unit tests.
- Canonical sort/serialize/fingerprint property cases, including different removed ingredients.
- Configurator keyboard interaction and error-summary integration.
- Two visually similar but distinct configurations remain separate cart lines.

### Browser / E2E verification

- Configure “30 cm / thin / no onion / extra cheese”, add it, then add a different removal/modifier combination.
- Verify two cart lines with correct summaries/prices through details → cart → back/edit navigation.
- Complete all groups with keyboard at mobile and desktop widths; inspect live announcements.
- Disable one selected modifier through a demo scenario and verify an explained correction path.

### Risks

- Fingerprint drift across features would corrupt merge/edit/reorder. Mitigation: export one pure canonicalization module; no feature-local hashes.
- Too many controls can overwhelm mobile. Mitigation: progressive groups and a concise sticky summary, not decorative 3D.
### Implementation evidence (2026-08-28) — GREEN

- Product-specific `ProductIngredient` relations, required/optional modifier groups, min/max/availability metadata and explicit paid deltas feed one reducer-owned configurator draft. Fixed combos remain unconfigured.
- `canonicalizeCartConfiguration` → `serializeCartConfiguration` → `cartConfigurationFingerprint` is the only line identity path. The same canonical configuration feeds validation, price, cart summary and is ready as the future persistence/quote/edit/reorder input without parallel serializers.
- Invalid/unavailable selections block add with a first actionable issue; base removal has zero price effect; human summaries use explicit removal grammar and expose no raw IDs. Reordered operations merge while any variant/removal/modifier difference remains distinct.
- Quality gate: typecheck GREEN; ESLint `--max-warnings 0` GREEN; 42/42 focused Vitest tests GREEN; Vite production build GREEN. Current lazy chunks remain separate: Product 11.05 kB and Cart 2.66 kB.
- Browser/E2E: 2/2 focused Chromium contracts GREEN. Two 30 cm recipes (no onion + extra cheese versus a different removal/cheese choice) retain distinct lines and correct 2 120 ₽ subtotal; keyboard min/max, live summary, selected-modifier unavailability and correction are verified at 320/390/768/1024/1440 px. A real 768 px min-content overflow was found and fixed with the tablet one-column contract.
- Boundary at this gate: persistence/edit/undo из M5A не были преждевременно включены в M4B.

## Milestone 5A — Durable, editable cart

### User-visible outcome

Корзина переживает reload, позволяет менять количество и конфигурацию, удалять/очищать с undo и безопасно объясняет устаревшие позиции.

### Scope

- Versioned, runtime-validated `localStorage` envelope for canonical lines and minimal fulfillment preference; derived totals are never trusted from storage.
- Hydration, known-version migrations, corrupt/unknown fallback and write-through listener middleware.
- Quantity stepper, edit configuration, remove with undo, clear with undo and deliberate empty state.
- Catalog reconciliation for removed products, unavailable variants/modifiers and changed prices.
- Storage failure keeps the in-memory cart usable and announces that persistence is unavailable.
- Cross-tab synchronization is explicitly out of core; one active browser tab/profile is the contract.

### Definition of Done

- Valid cart/configurations survive hard reload with the same fingerprints and recalculated totals.
- Edit replaces the intended line or merges canonically with an existing one without losing quantity.
- Remove/clear are reversible within a stated window; keyboard focus returns predictably.
- Corrupt or unsupported payload never crashes the app and is safely quarantined/replaced.
- Checkout CTA is unavailable while blocking reconciliation issues remain.

### Tests

- Hydration, migration, corrupt payload, storage exception and current-catalog recalculation.
- Quantity boundaries, edit/merge, remove/clear undo and selectors.
- Unavailable product/variant/modifier reconciliation.
- Canonical configuration survives serialize → hydrate → serialize.

### Browser / E2E verification

- Build two distinct configurations, reload, edit one, change quantity, remove/undo and clear/undo.
- Inject old/corrupt storage before load and verify safe recovery.
- Simulate storage denial; continue in-memory with a visible non-blocking warning.
- Verify empty cart CTA returns to the preserved menu state.

### Risks

- Persisted shape can become accidental public API. Mitigation: schema version, migrations and a narrow allow-list.
- Undo and merging can create quantity surprises. Mitigation: pure reducer transition tests and explicit status copy.

### Implementation evidence (2026-08-28) — GREEN

- Versioned `napoli:commerce:v1` persists only canonical configurations, quantities and safe fulfillment preference; totals are recalculated from the owned catalog. Known migration, corrupt/unknown payload quarantine and storage-denial in-memory fallback are implemented.
- Quantity/edit/remove/clear and timed undo are functional and announced. Exact edit replaces or canonically merges the intended fingerprint; catalog reconciliation blocks checkout for removed/unavailable configurations and explains recovery.
- Quality gate: 22/22 focused Vitest tests, typecheck, ESLint `--max-warnings 0` and Vite production build GREEN; 2/2 focused Playwright contracts cover reload/edit/undo/corruption/storage denial and 320/390/768/1024/1440 px.
---

## Milestone 5B — Fixed combo and contextual recommendations

### User-visible outcome

Пользователь добавляет понятное выгодное комбо и получает уместную рекомендацию с объяснением, не мешающую продолжить заказ.

### Scope

- One exact core bundle: `Вечер на двоих` = fixed named pizza A + fixed named pizza B + fixed 1 L drink, modeled as `Product(kind: 'combo')` with one non-configurable variant, one bundle price and visible saving.
- Combo is a first-class fixed product with its own details/availability/cart representation; no slot builder or hidden substitutions.
- Recommendations based on simple explainable rules such as missing drink/sauce or product affinity.
- Recommendation card states why it is shown and performs a real add/open action.
- Recommendation failure/absence never blocks cart or checkout.

### Definition of Done

- Combo composition, component reference value, bundle saving and cart quantity are unambiguous.
- Combo identity/persistence use the same canonical cart contract and survive reload.
- Unavailable combo is not purchasable and names the unavailable component.
- At least one recommendation changes after the relevant cart addition and never duplicates an already satisfied need.
- No configurable combo UI or dead discount placeholder exists.

### Tests

- Fixed composition, bundle price/saving and availability unit tests.
- Combo add/merge/persistence integration.
- Recommendation rule, de-duplication and unavailable-item cases.
- Cart totals combine combo and configured pizza correctly.

### Browser / E2E verification

- Open `Вечер на двоих`, inspect composition/saving, add, reload and verify one intact combo line.
- Add the recommended sauce/drink and verify the recommendation updates.
- Navigate the recommendation and combo flow by keyboard on mobile and desktop.
- Carry a combo cart into delivery checkout in milestone 6A E2E.

### Risks

- A second configurator would double domain complexity. Mitigation: fixed bundle only in core.
- “Recommendation” can feel like an ad. Mitigation: one contextual reason, easy dismissal and no checkout obstruction.

### Implementation evidence (2026-08-28) — GREEN

- `Вечер на двоих` is one fixed first-class combo with explicit two-pizza/1 L drink composition, 1 990 ₽ bundle price and 180 ₽ saving; unavailable component state blocks add without substitutions.
- Cart recommendations use explainable missing-drink/sauce rules, perform real adds and update/de-duplicate after satisfaction without blocking checkout.
- Quality gate: 14/14 focused Vitest tests, typecheck, lint and build GREEN; 2/2 focused Playwright contracts verify composition, availability, persistence, contextual update, keyboard use and required widths.
---

## Milestone 6A — Guest delivery checkout happy path

### User-visible outcome

Гость вводит контакт и адрес, выбирает доставку ASAP, получает подтверждённые fee/ETA/availability и доходит до готового к оплате заказа без регистрации.

### Scope

- Lazy `/checkout` route with semantic sections for contact, delivery address and order summary.
- Route-owned React Hook Form draft with targeted boundary validation; optional versioned `sessionStorage` restore for the active checkout only.
- Deterministic local address/serviceability adapter; no map/geocoding dependency.
- Before address: copy is `Укажите адрес` or explicitly approximate. After validation: authoritative delivery quote with fee, ETA, minimum and issues.
- RTK Query quote request derives from current canonical cart + delivery fulfillment; previous quote is marked stale while revalidating.
- Inline validation, first-invalid focus, `aria-live` summary updates and mobile sticky submit that does not cover fields.

### Definition of Done

- Guest can complete contact/address/ASAP checkout preparation without auth.
- Invalid/unsupported address has a specific recovery path and does not produce a confirmed ETA.
- Changing cart or address marks the old quote stale and prevents payment until a fresh quote succeeds.
- Full contact/address is never written to local guest history or logs.
- Empty/invalid cart cannot enter a misleading checkout state.

### Tests

- Contact/address validation and first-invalid focus.
- Serviceable/unserviceable address; loading/stale/success/failure quote integration.
- Cart/address change invalidates the quote.
- Active checkout session schema excludes payment-like values and handles corrupt data.

### Browser / E2E verification

- Configured pizza → cart → delivery checkout → valid address → confirmed fee/ETA.
- Repeat with the fixed combo cart from 5B.
- Submit invalid then unserviceable address and recover without losing valid fields.
- Reload active checkout in the same tab/profile; keyboard-only complete at 390 and 1440 px.

### Risks

- A fake address form can overpromise real logistics. Mitigation: explicit demo zone/copy and deterministic serviceability rules.
- Sticky summary can hide validation. Mitigation: safe-area/zoom/virtual-keyboard checks and focus scrolling.

### Implementation evidence (2026-08-28) — GREEN

- Lazy guest `/checkout` uses route-owned React Hook Form state plus versioned session draft, targeted validation/first-invalid focus and RTK Query delivery quote from canonical cart and address; auth is not required.
- Serviceability/loading/stale/error/offline states keep valid fields and expose explicit retry. Full contact/address remains session-only and never enters local history.
- Quality gate: 15/15 focused Vitest tests, typecheck, lint and build GREEN; 2/2 focused Playwright contracts cover invalid/out-of-zone recovery, confirmed fee/ETA, draft reload and responsive overflow checks.
---

## Milestone 6B — Pickup, scheduling and fulfillment recovery

### User-visible outcome

Пользователь переключается между доставкой и самовывозом, выбирает доступное время и понимает, как восстановиться при закрытом ресторане, stale quote или offline.

### Scope

- Delivery/pickup segmented choice owned by `fulfillmentSlice` and persisted without address PII.
- Pickup store list with public address/hours and deterministic availability; no interactive map.
- ASAP versus scheduled slots for both modes where supported.
- Quote invalidation on mode/store/slot/cart change.
- Explicit closed store, unavailable slot, minimum-order, quote-expired, request-error and offline states.
- Returning online retries only safe quote requests; user confirmation remains required for changed totals/ETA.

### Definition of Done

- Delivery fields hide/disable appropriately for pickup; switching back restores only safe route draft data.
- Confirmed pickup quote names store and slot and has no delivery address/fee leakage.
- Unavailable/expired selection cannot continue and offers a concrete alternative.
- Offline preserves entered form/cart and never presents a stale quote as current.
- Fulfillment status is communicated by text and semantics, not color alone.

### Tests

- Mode switching, store/slot rules and persisted preference.
- Quote invalidation/expiry, closed store, unavailable slot and minimum-order cases.
- Offline → online recovery with stale quote.
- Delivery fields are omitted from pickup request payload.

### Browser / E2E verification

- Complete delivery ASAP, delivery scheduled, pickup ASAP and pickup scheduled quote paths.
- Switch delivery → pickup → delivery and inspect retained/cleared fields.
- Go offline with a confirmed quote, change cart, reconnect and accept the refreshed quote.
- Keyboard and screen-reader smoke for mode/store/time controls.

### Risks

- Time-slot logic can resemble a backend scheduler. Mitigation: small deterministic fixture window with explicit demo semantics.
- Mode switching may leak address data into pickup. Mitigation: separate request DTOs and integration assertions.

### Implementation evidence (2026-08-28) — GREEN

- Redux-owned delivery/pickup preference is persisted without address PII. Both modes support ASAP/scheduled fixtures; pickup requests omit delivery address, fees and hidden delivery fields.
- Store/slot/mode changes invalidate quote. Closed store, unavailable slot, expiry, minimum, request failure and offline/reconnect paths preserve form/cart and require a fresh accepted quote.
- Quality gate: 20/20 focused Vitest tests, typecheck, lint and build GREEN; 2/2 focused Playwright contracts exercise switching, scheduling, alternate-store recovery and offline stale/reconnect behavior.
---

## Milestone 7 — Promo codes and authoritative final quote

### User-visible outcome

Пользователь применяет промокод, видит объяснимую скидку и финальный итог; invalid/expired/ineligible code не меняет сумму.

### Scope

- Deterministic promo rules: one valid percentage/fixed example plus invalid, expired, minimum and product-eligibility outcomes.
- Promo validation and final quote are authoritative async operations; no optimistic success.
- Quote snapshot lists lines, subtotal, discount, fee, total, issues and expiry.
- Discount row renders only after a valid applied promo; before this milestone no placeholder row exists.
- Remove/change promo, stale quote and retry behavior.

### Definition of Done

- Every promo outcome has specific, non-destructive copy and an accessible status announcement.
- UI totals equal the accepted quote snapshot; component-side math cannot override it.
- Cart/address/fulfillment/promo changes invalidate the previous final quote.
- User must acknowledge an increased total or changed ETA before payment.
- Repeated apply clicks cannot create duplicated discounts or racing results.

### Tests

- Promo eligibility/expiry/minimum and money rounding unit tests.
- Apply/remove/race/retry and quote-expiry integration.
- Request canonicalization and authoritative totals.
- Error announcement/focus behavior.

### Browser / E2E verification

- Apply valid, invalid, expired and minimum-failing codes.
- Apply a valid code, change cart/address, observe stale state, then accept a refreshed total.
- Throttle/fail the promo request and retry without losing checkout fields.
- Verify summary and CTA at mobile zoom and desktop.

### Risks

- Client-known rules can look authoritative when they are only demo logic. Mitigation: keep all results behind the quote adapter and document demo scope.
- Rounding discrepancies damage trust. Mitigation: integer minor units and table-driven tests.

### Implementation evidence (2026-08-28) — GREEN

- Final quote adapter reprices canonical lines in integer minor units and returns the only accepted subtotal/discount/fee/total snapshot. `NAPOLI10`, `COMBO200`, invalid, expired, minimum and ineligible outcomes have distinct non-destructive copy.
- Cart/address/fulfillment/promo changes stale the snapshot; removal/increased totals require explicit acknowledgement. Async errors focus recovery without losing checkout data or applying optimistic discounts.
- Quality gate: 20/20 focused Vitest tests, typecheck, lint and build GREEN; 4/4 focused Playwright contracts cover valid/invalid/expired/minimum promo, slow/error retry, stale refresh, acknowledgement and zoom/width checks.

---
## Milestone 8 — Mock payment, idempotent order and confirmation

### User-visible outcome

Пользователь безопасно проходит demo payment, восстанавливается после decline и получает ровно один подтверждённый заказ с понятным summary.

### Scope

- Mock payment state machine: idle → pending → declined or succeeded; no real PAN/CVC/payment credentials are requested or stored.
- Explicit demo outcome control that is clearly labeled as simulation and does not resemble a production card capture form.
- Final quote freshness check, order idempotency key and status recovery after ambiguous response.
- Introduce one versioned `DemoOrderRepository` interface used by this and later order surfaces.
- Active full snapshot in `sessionStorage`; sanitized `localStorage` history limited to 20 orders and 90 days. Local history omits phone, email, note and full delivery address.
- Lazy `/order/:orderId/confirmed` route; scoped non-sequential demo ID; confirmation can restore after hard reload in the same browser profile/session.

### Definition of Done

- Pending disables duplicate submit and announces progress.
- Decline preserves checkout and quote when still valid; retry can succeed without duplicate order.
- Ambiguous network response resolves by idempotency/status lookup before any second create.
- Confirmation shows order ID, items, totals, fulfillment summary, ETA/time and next tracking action.
- `DemoOrderRepository`, not RTK Query cache, owns reload/history persistence and sanitization.

### Tests

- Payment/order state-machine transitions and no-blind-retry rules.
- Idempotency: double click, timeout-after-create and decline → retry all yield at most one order.
- Repository version/migration/corruption/TTL/20-item limit and PII sanitization.
- Confirmation direct-load success/not-found/expired behavior.

### Browser / E2E verification

- Delivery checkout → decline → retry → one confirmation/order ID.
- Simulate timeout after create; recover the existing order rather than create another.
- Hard reload `/order/:orderId/confirmed` in the same profile and verify summary restoration.
- Inspect storage/network/logs: no card-like values or raw guest PII in local history.

### Risks

- A mock form can accidentally train users to enter real details. Mitigation: no card fields, prominent demo label and deterministic test controls.
- Cache/repository divergence can break reload. Mitigation: repository is authoritative; RTK Query invalidates/reads it through one adapter.

### Implementation evidence (2026-08-28) — GREEN

- Demo payment collects no PAN/CVC/card fields. Pending/decline/failure/ambiguous/success states preserve an accepted quote; timeout-after-create resolves by the same idempotency key before navigation and produces one opaque `nap_…` order.
- `DemoOrderRepository` owns a 24-hour full active session snapshot and bounded 20-order/90-day sanitized local history; local history excludes contact, note and full delivery address. Lazy confirmation restores directly after reload and handles missing/expired IDs.
- Quality gate: 18/18 focused Vitest tests, typecheck, lint and build GREEN; 4/4 focused Playwright contracts verify decline→retry, ambiguous timeout recovery, one order, reload-safe confirmation, PII/payment-like storage inspection and required widths.
---

## Milestone 9 — Live-looking order tracking

### User-visible outcome

Пользователь открывает заказ и видит правдоподобное движение по этапам приготовления/доставки или pickup, включая ETA и recovery после reload/offline.

### Scope

- Lazy `/order/:orderId/track` route backed by the same `DemoOrderRepository`.
- Deterministic timestamp-based event engine: confirmed → preparing → baking → courier/ready for pickup → delivered/collected.
- Delivery and pickup timelines have different relevant steps and copy.
- Oven-ring motif communicates progress with a reduced-motion static alternative.
- Current step, completed steps, ETA and exceptional delayed/cancelled demo states.
- Offline uses the latest retained snapshot, labels it stale and resumes derivation after reconnect; it never invents new server events.

### Definition of Done

- Reload computes status from persisted timestamps without restarting the order.
- Events are monotonic/idempotent and route not-found/expired states are helpful.
- Status changes are announced without excessive live-region noise; state is not color-only.
- Reduced-motion mode removes continuous/decorative animation.
- Scoped demo IDs are not predictable sequential identifiers.

### Tests

- Tracking derivation at time boundaries, reload, clock skew and terminal states.
- Delivery versus pickup event sequence.
- Delayed/cancelled/offline/stale recovery.
- Accessible current-step semantics and reduced-motion behavior.

### Browser / E2E verification

- Confirmation → tracking; advance deterministic demo clock through the full delivery path.
- Reload between stages and verify no regression/restart.
- Repeat for pickup; toggle delayed and offline scenarios.
- Screen-reader/current-step and reduced-motion smoke at mobile/desktop.

### Risks

- Simulated progress may be mistaken for realtime. Mitigation: explicit demo disclosure and deterministic status adapter.
- Timer-driven tests can flake. Mitigation: injected clock and event timestamps, never real sleeps.

### Implementation evidence (2026-08-28) — GREEN

- Lazy tracking reads the same active order repository. A pure timestamp engine derives monotonic delivery/pickup-specific stages, ETA, delayed/cancelled states, persisted demo-clock offsets and clock-skew floors; explicit replay is the only reset path.
- One `aria-current="step"` timeline exposes completed/current/upcoming text. Offline freezes the last observed snapshot and disables demo progression until reconnect; oven-ring progress has a `prefers-reduced-motion` static path and explicit non-realtime disclosure.
- Focused gate: 12/12 Vitest tests and 4/4 Playwright contracts GREEN across delivery/pickup, boundaries, reload, clock skew, terminal, delayed/cancelled, offline/reconnect, reduced motion and 320/390/768/1024/1440 px.
- Final M1A–M9 regression gate: 24/24 Vitest files and 107/107 tests GREEN; typecheck GREEN; ESLint `--max-warnings 0` GREEN; Vite production build GREEN with separate Product/Cart/Checkout/OrderConfirmation/OrderTracking chunks; Playwright 50/50 GREEN on Chromium 390/1440 using 4 workers.
- Milestones 10A, 10B, 11 and 12 were not started.
---

## Milestone 10A — Local favorites

### User-visible outcome

Пользователь отмечает товары, reload сохраняет выбор, а отдельная страница Favorites помогает вернуться к ним или восстановиться из empty/unavailable state.

### Scope

- Favorite toggle on menu cards and product details with accessible pressed state/name.
- Local slice + versioned persistence using the existing envelope; immediate local optimistic behavior.
- Lazy `/favorites` route with product cards, empty CTA back to menu and unavailable-item treatment.
- Favorites remain guest-first and do not require account/Supabase.
- No cross-device claim until milestone 11.

### Definition of Done

- Toggle updates every visible instance consistently and survives hard reload.
- Favorite action does not navigate or accidentally submit another control.
- Empty and partially unavailable favorite lists remain useful.
- Persistence corruption falls back without affecting cart/history.
- Favorite route is lazy and direct reload works.

### Tests

- Toggle/selectors/hydration/migration.
- Card/details synchronization and pressed announcements.
- Empty/unavailable favorites integration.
- Storage failure rollback to a clear in-memory state/message where relevant.

### Browser / E2E verification

- Favorite from menu, verify details state, reload, open Favorites, unfavorite to empty.
- Direct open `/favorites` in the same profile.
- Keyboard and screen-reader toggle checks at 390 and 1440 px.
- Confirm no account prompt blocks the action.

### Risks

- Heart-only controls can be ambiguous. Mitigation: accessible names, tooltip where useful and visible state.
- Persistence envelope coupling can regress cart. Mitigation: independent schema fields and migration tests.

### Implementation evidence (2026-08-28) — GREEN

- Guest-first Redux favorites use a separate `napoli:favorites:v1` versioned envelope; legacy-array migration, corruption quarantine and storage-write rollback do not mutate cart or history.
- Accessible `aria-pressed` toggles stay synchronized across menu cards, product details and the lazy `/favorites` route. Direct reload, keyboard activation, empty, removed and temporarily unavailable states remain actionable without an account prompt.
- Focused gate: 6/6 Vitest files and 29/29 tests GREEN; typecheck GREEN; zero-warning lint GREEN; production build GREEN with a separate `Favorites` chunk; Playwright 4/4 GREEN on Chromium 390/1440 including hard reload and unavailable recovery.

---

## Milestone 10B — Sanitized history and safe repeat order

### User-visible outcome

Пользователь видит недавние заказы без сохранённого адреса/контактов и может повторить доступные позиции после проверки текущих цен и availability.

### Scope

- Lazy `/orders` history backed by the same versioned `DemoOrderRepository`, 20-order/90-day retention and explicit clear action.
- Sanitized entries retain scoped ID, line configuration snapshots, display labels, historical totals, fulfillment mode/status and timestamps; no guest phone/email/note/full address.
- Order details/history empty and expired states; a clearly labeled non-personal seeded demo order can provide a reviewer path.
- Repeat-order reconciliation compares canonical configurations with current catalog, flags removed/unavailable/changed-price items and requires confirmation before merging into cart.
- Repeat never silently restores historical trusted prices or fulfillment quote.

### Definition of Done

- Completing milestone 8 adds exactly one sanitized history row; clearing history does not delete the active session order.
- Repeat adds only confirmed/currently valid configurations and explains every skipped/substituted line.
- Current catalog prices are shown beside historical totals before confirmation.
- Existing cart merge behavior is explicit and uses canonical identity.
- Direct history reload works in the same browser profile; a new device is not claimed before auth.

### Tests

- History retention/order/clear and sanitizer assertions.
- Reorder reconciliation for available, changed-price, missing variant/modifier and removed product.
- Existing-cart merge versus distinct fingerprint cases.
- Seeded demo record is labeled and contains no PII.

### Browser / E2E verification

- Complete an order → open history → inspect → repeat → review differences → merge into cart.
- Change catalog availability via demo scenario and repeat again with an explained skipped line.
- Reload `/orders`, clear history and verify the empty/reviewer-demo path.
- Inspect local history payload for the explicit PII deny-list.

### Risks

- Historical snapshots can be confused with current offer. Mitigation: label historical versus current amounts and always re-quote.
- Silent partial reorder damages trust. Mitigation: reconciliation review is mandatory when any line changes.

### Implementation evidence (2026-08-28) — GREEN

- The lazy `/orders` route reads the existing `DemoOrderRepository` 20-order/90-day sanitized history. Clear leaves the active session order intact; the explicit seeded reviewer record is labeled `DEMO / НЕПЕРСОНАЛЬНЫЙ` and contains no contact, note or address fields.
- Pure reconciliation revalidates canonical configurations against current products, variants, modifiers, availability and integer-minor-unit prices. Removed/unavailable/invalid lines are explained and skipped; price changes show historical versus current amounts; every merge requires explicit acknowledgement and uses the cart's canonical identity.
- Focused gate: 3/3 Vitest files and 10/10 tests GREEN; typecheck GREEN; zero-warning lint GREEN; production build GREEN with a separate `Orders` chunk; Playwright 2/2 GREEN on Chromium 390/1440 with order completion, repeat, changed-price/unavailable scenarios, PII deny-list, clear/active-order isolation, direct reload and 320/390/768/1024/1440 overflow checks.

## Milestone 11 — Optional passwordless account and Supabase sync

### User-visible outcome

Если decision gate пройден, пользователь входит без пароля и видит те же favorites и sanitized order history на другом устройстве; guest purchase по-прежнему не требует аккаунта.

### Scope

- Gate: implement only when cross-device retention materially improves the portfolio/product and a stable hosted demo environment is available.
- Lazy `/account` route and Supabase passwordless email flow; auth session is owned by the Supabase SDK, never a hand-written Redux token slice.
- Narrow backend data only for user favorites and sanitized order history.
- One explicit guest-to-user merge with deterministic union/de-duplication/conflict copy.
- Adapter boundary keeps UI independent of local/Supabase storage.
- Explicit grants/RLS, two-user isolation and auth redirect validation.
- Out of scope: catalog migration, saved addresses, realtime tracking, backend quote/payment, admin UI and custom Node server.

### Definition of Done

- Guest menu/cart/checkout/order flow remains fully functional while signed out or when Supabase is unavailable.
- Passwordless sign-in/out and session restore are understandable and keyboard-accessible.
- Favorites/history sync across two browser profiles after sign-in; guest merge neither duplicates nor leaks another user’s data.
- Every exposed table has explicit grants and RLS using `auth.uid()` ownership predicates; no secret/service-role key reaches the client.
- If the gate is not justified, an ADR records “skipped” and core release proceeds unchanged.

### Tests

- Auth callback/session/sign-out and invalid redirect.
- Guest merge idempotency, conflict/de-duplication and offline fallback.
- RLS integration with anonymous, user A and user B for select/insert/update/delete.
- Adapter contract runs against local and Supabase implementations.

### Browser / E2E verification

- Create guest favorite/order, sign in, merge, sign out/in and verify retained data.
- Sign into a second isolated browser profile and verify only the same user’s synced favorites/history.
- Attempt cross-user direct access and confirm denial.
- Disable backend/network and complete the guest core flow.

### Risks

- Email delivery and hosted backend can make a portfolio demo brittle. Mitigation: keep guest mode first-class and provide deterministic test infrastructure.
- Merge/RLS mistakes can leak data. Mitigation: minimal schema, server ownership predicates and two-user negative tests.
### Decision evidence (2026-08-28) — FORMALLY SKIPPED

- The repository owner selected `SKIP M11` at the explicit decision gate. Cross-device retention is not required for the guest-first core release and no stable hosted Supabase/email/redirect environment is in scope.
- `docs/ADR-001-SKIP-M11-SUPABASE.md` records the decision, consequences and concrete reconsideration criteria. No Supabase dependency, environment variable, `/account` route, remote table or cross-device claim was added.
- Per the M11 Definition of Done and release boundary, the core M12 gate proceeds without the optional auth/RLS matrix.

---

## Milestone 12 — Production release gate

### User-visible outcome

Reviewer получает стабильный deployed consumer product: все уже построенные сценарии работают на mobile/tablet/desktop и в трёх browser engines с измеренной accessibility/performance.

### Scope

- Verification only: no deferred feature, code-splitting, state or accessibility implementation belongs here; a failure returns to the owning milestone.
- Clean install → typecheck → zero-warning lint → unit/integration → production build → full Playwright gate.
- Chromium, Firefox and WebKit; responsive smoke/screenshot set at 320/390/768/1024/1440.
- Axe on key routes plus manual keyboard, zoom, reduced-motion and targeted screen-reader checks.
- Lighthouse/Web Vitals on the agreed representative mobile profile: LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms.
- Build manifest/network review for route chunks, initial-route exclusions, image strategy and request waterfalls.
- Hosting SPA rewrite/deep-link verification, dependency/security triage, storage/PII/log inspection and portfolio README/runbook.
- Optional milestone 11 has its own gated matrix and cannot block the core release if formally skipped.

### Definition of Done

- All core scripts and three-engine E2E matrix pass from a clean environment.
- The 12 observable portfolio success criteria in `docs/TRANSFORMATION_SPEC.md` pass against production preview/deployment.
- Zero critical/serious axe findings on key routes; manual keyboard path menu → configure → cart → checkout → tracking completes.
- Measured Web Vitals meet targets; any approved variance has captured profile/evidence and an owner, not an unqualified claim.
- Direct routes reload on hosting, no source-map console errors/404 assets, and initial menu excludes checkout/payment/account chunks.
- No unresolved critical/high direct runtime vulnerability; transitive findings are documented by exploitability and remediation.
- Local/session storage and logs satisfy the PII/payment deny-list.

### Tests

- Entire unit/integration/contract/migration suite.
- Full Playwright journeys: URL share, configuration identity, cart reload/edit, combo, delivery/pickup, promo, decline/retry, confirmation/tracking, favorite/history/repeat and recovery states.
- Optional auth/RLS matrix only when milestone 11 shipped.
- Production build/preview and hosting rewrite smoke.

### Browser / E2E verification

- Run the critical happy path in Chromium, Firefox and WebKit.
- Run keyboard-only path, 200% zoom, reduced motion and offline/error recovery.
- Capture targeted visual regression set at all required widths.
- Inspect route/data requests, cache behavior, storage and console on the deployed build.

### Portfolio preparation update — 2026-09-08

Publication follow-up (supersedes the pending repository/image conditions below): owner authorized commit/push to `godaylor/napoli-pizza`, branch `master`. Replaced all eight unverified masters and all 48 derivatives with locally served Pexels-licensed photos; source/author/license/hash receipts and bilingual illustrative alt text added. Node 24.20.0 typecheck/lint, 133 tests, 148-module build and 134 browser tests pass (2 intentional skips). Post-image-change median LCP 2405.42 ms, CLS 0, observed INP 32 ms; one of three LCP samples exceeded the target, recorded in docs/RELEASE.md. No backend or Vercel deploy. Hosted smoke remains after importing the published repository.

Targeted local fixes and regression checks are complete; M11 remains skipped and no backend was added. Corrected pickup hours/RU-EN labels, order configuration summaries/keys and React 18 image-priority warning; prepared Vercel SPA routing, dependency notices and publication docs.

Exact Node 24.20.0 clean install, typecheck, lint, 131 unit/integration tests, production build and browser matrix (134 passed / 2 intentional skips) pass. Five required widths, keyboard/Axe, English pickup/retry/reload and direct-route tests pass. Mobile lab medians: LCP 1804.90 ms, CLS 0.01550; observed INP 32 ms. Current detailed evidence is in docs/RELEASE.md.

No commit/push/deploy. Before publication: owner repository choice, image/source-code rights confirmation, then actual Vercel URL smoke. These external conditions supersede the historical claim that hosting smoke is the only follow-up. A real screen-reader review remains unverified.

### Historical release evidence (2026-09-03) — GREEN

- CI-equivalent runtime was the exact `.nvmrc` pin: Node `24.20.0` (repo-local `npx node@24.20.0` because the host-wide Node is `22.15.1`). `npm ci` installed 419 packages from `package-lock.json`; no install drift.
- `npm run typecheck` GREEN; `npm run lint` GREEN with zero warnings; `npm run test` GREEN: 29 files / 121 tests.
- `npm run test:coverage` GREEN: statements `88.43%`, branches `81.56%`, functions `88.19%`, lines `89.95%`.
- `npm run build` GREEN: 139 modules; `dist/.vite/manifest.json` emitted. The entry imports shared JSX/hooks/catalog only; Product, Cart, Checkout, OrderConfirmation, OrderTracking, Favorites and Orders are dynamic route chunks.
- Full production-preview Playwright run GREEN: `124 scheduled / 122 passed / 2 intentionally skipped` (the raw-Tab test is Chromium-only) across `chromium-390`, `chromium-1440`, `firefox-1440` and `webkit-390` with four workers. All shared journeys pass; the same run exercises 320/390/768/1024/1440 responsive widths, targeted screenshots, reduced motion, 200% text zoom, offline/error/stale recovery, direct-route reloads, request boundaries, storage and clean browser console.
- `e2e/release.spec.js` runs Axe on menu/product/cart/favorites/orders plus checkout/confirmation/tracking: zero critical/serious findings in all four projects. Keyboard activation passes in every engine; the true Tab+Enter path menu → configure → cart → checkout → confirmation → tracking passes on Chromium mobile and desktop.
- `npm run test:performance` GREEN on three Lighthouse default-mobile simulated runs plus 390×844 Event Timing at 4× CPU and 1.6 Mbps / 150 ms: median LCP `1804.29 ms`, median CLS `0.01622`, observed INP `24 ms`, median performance score `0.98`.
- `npm audit` reports `0 critical`, `0 high`, `2 moderate`. Both are React Router advisories: the SSR hydration path is not reachable in this client-only SPA; navigation destinations are fixed/internal and reconstructable return paths are validated. The automated fix requires a React Router 7 major and is deferred to an explicit dependency migration.
- Storage/log deny-list review is GREEN: full contact/address/note remains in versioned active-session storage only, and the redundant checkout draft is cleared after successful order creation; local order history is sanitized and bounded; tests reject phone/email/address/note/PAN/CVC; no raw PII logger, Supabase secret or real payment credential surface exists.
- `vercel.json` adds the official Vite SPA catch-all rewrite; production preview direct routes and asset/console checks are GREEN. CI installs Chromium/Firefox/WebKit and runs the four-project matrix.
- Portfolio documentation is current: `README.md`, `docs/GETTING-STARTED.md`, `docs/DEVELOPMENT.md`, `docs/TESTING.md`, `docs/CONFIGURATION.md`, `docs/DEPLOYMENT.md`, `docs/RELEASE.md`, the M11 ADR and an append-only implemented-state supplement in `docs/ARCHITECTURE.md`.

#### Twelve observable success criteria

1. Shared discovery URL parity: M3 reload/share/back-forward journeys GREEN.
2. Configurator dynamic price: M4A/M4B unit and browser pricing assertions GREEN.
3. Distinct configurations: canonical fingerprint and separate-cart-line journeys GREEN.
4. Durable cart: persistence/edit/remove/undo/clear/reload journeys GREEN.
5. Valid/invalid promo: authoritative success, minimum failure and refresh acknowledgement GREEN.
6. Guest delivery and pickup: both fulfillment paths, ASAP/scheduled and recovery GREEN.
7. Payment decline without duplicate: decline/retry and timeout-after-create idempotency GREEN.
8. Confirmation/tracking: reload-safe delivery/pickup deterministic progress GREEN.
9. Repeat order: current price/availability reconciliation and skipped-line handling GREEN.
10. Favorites: toggle, reload, unavailable favorite and Favorites route GREEN.
11. Keyboard mobile/desktop: critical activation path, focus contracts and responsive checks GREEN.
12. Loading/empty/error/offline: catalog, quote, promo, payment and tracking recovery journeys GREEN.

#### Real environment limitations

- No external hosting preview was published because this workspace has no authorized hosting project/session. Provider-side rewrite smoke remains after publication; the checked-in Vercel rewrite and local production-preview direct-route smoke are GREEN.
- No real screen-reader application session was available. Axe, accessibility-tree role/name assertions and keyboard journeys are GREEN, but one targeted assisted-technology pass remains an external review follow-up.
- The machine-wide Node remains `22.15.1`; all final gates were nevertheless executed with the exact repo pin `24.20.0` through the single repo-local runtime workaround.

### Risks

- Lab metrics vary by machine/network. Mitigation: pin the profile, repeat runs and retain reports.
- Treating the gate as a polish sprint would hide ownership. Mitigation: it may validate and report only; fixes reopen the earliest responsible milestone.

---

## Sequencing and release boundary

Core dependency path:

```text
1A → 1B → 2A → 2B → 3 → 4A → 4B → 5A → 5B
   → 6A → 6B → 7 → 8 → 9 → 10A → 10B → 12
```

Milestone 11 is an optional value-add branch after local favorites/history are proven. The production-looking guest product is complete without it.

For every milestone, “done” means its user-visible path, resilience states, accessibility contract, unit/integration coverage and listed browser proof land together. The core plan is closed; no later milestone remains in this `PLAN.md`.


