# Napoli — transformation specification

Статус: proposed product contract

Исходная база: tutorial pizza catalog

Выбранное направление: Napoli из `PRODUCT_OPTIONS.md`

## 1. Product vision

Превратить учебный каталог в самостоятельный consumer product: современную городскую pizza delivery, где пользователь может осознанно выбрать продукт, настроить его, оформить delivery/pickup и проследить заказ от подтверждения до получения.

Продукт должен одновременно доказывать две вещи:

1. Пользователю — что это понятный, быстрый и надёжный сервис заказа еды.
2. Работодателю — что автор умеет проектировать сложный frontend: domain state, server state, URL contracts, forms, failure recovery, accessibility, performance и E2E.

### Product promise

**Собрать и подтвердить подходящий заказ за 2–4 минуты, заранее понимая состав, цену, способ и время получения.**

### Primary audience

- 22–40 лет, mobile-first, но часто оформляют семейный/офисный заказ с desktop.
- Хотят быстро решить «что съесть», но ценят состав, ограничения и прозрачную цену.
- Часто повторяют прошлый заказ или собирают комбинацию на несколько человек.
- Русский интерфейс, `ru-RU`, RUB; архитектура не должна блокировать будущую локализацию.

## 2. Product principles

1. **Guest-first.** Меню, корзина и checkout не требуют регистрации.
2. **No fake controls.** Любой визуально интерактивный элемент имеет действие, состояние pending/success/error и keyboard contract.
3. **Price is explainable.** Пользователь видит, почему изменилась цена; финальный quote перепроверяется перед заказом.
4. **URL is a product surface.** Поиск, категория, сортировка и фильтры восстанавливаются после share/reload/back-forward.
5. **Recovery is part of the happy path.** Error, offline, unavailable, invalid promo и payment decline проектируются одновременно с success.
6. **Mobile is not a compressed desktop.** Critical actions остаются достижимыми одной рукой; desktop использует пространство для сравнения и summary.
7. **One memorable visual idea.** Oven ring объединяет product configuration и tracking; остальной UI дисциплинирован.
8. **Portfolio demo is deterministic.** Reviewer всегда может пройти flow и намеренно проверить failure scenarios.

## 3. Non-goals

Не входят в целевой scope:

- реальное списание денег или хранение card data;
- courier app, restaurant admin panel и inventory ERP;
- marketplace из нескольких ресторанов;
- сложная геокодинг/карта с платным vendor lock-in;
- production-grade dispatch/logistics optimization;
- microservices, microfrontends, GraphQL ради GraphQL;
- SSR/Next.js без подтверждённой SEO-задачи;
- полноценный PWA/offline ordering;
- loyalty economy, subscriptions и gamification в первой версии;
- AI-рекомендации без реальных данных.

## 4. Information architecture

### Routes

| Route | Purpose | Public |
|---|---|---:|
| `/` | Redirect/alias to menu | Да |
| `/menu` | Full menu, categories, discovery | Да |
| `/menu/:productSlug` | Product details and configurator | Да |
| `/cart` | Cart review/edit/recommendations | Да |
| `/checkout` | Fulfillment, contact, promo, payment | Да |
| `/order/:orderId/confirmed` | Confirmation and order summary | Да, scoped token/demo ID |
| `/order/:orderId/track` | Live-looking status timeline | Да, scoped token/demo ID |
| `/favorites` | Favorites | Guest local / account synced |
| `/orders` | Order history and repeat order | Guest local / account synced |
| `/account` | Optional auth/profile surface | Да, но не required for purchase |
| `*` | Helpful not-found state | Да |

Checkout может быть одной route с clearly separated sections. Отдельные `/checkout/address` и `/checkout/payment` нужны только если mobile usability tests покажут необходимость; multi-step routing заранее не навязывается.

### Primary navigation

- Brand/menu.
- Delivery or pickup context + ETA.
- Search.
- Favorites.
- Orders/account.
- Cart with derived item count and formatted total.

Mobile: sticky bottom navigation допустима для Menu, Search, Orders, Cart. Во время configurator/checkout она скрывается, уступая место contextual sticky CTA.

## 5. Core user journeys

### Journey A — first delivery order

1. Пользователь видит текущий mode `Доставка` и явно indicative range, например «примерно 25–35 мин», пока адрес не подтверждён.
2. Выбирает категорию или ищет продукт.
3. Открывает product details.
4. Выбирает size, dough, removals, modifiers и extras.
5. Видит dynamic price и добавляет configuration в cart.
6. Добавляет recommendation либо переходит в cart.
7. Вводит promo, выбирает delivery, адрес и время.
8. Проходит mock payment.
9. Получает order ID, summary и ETA.
10. Наблюдает status timeline до `delivered`.

### Journey B — pickup

1. Переключает mode на `Самовывоз`.
2. Выбирает одну из seeded locations и pickup slot.
3. Availability/ETA пересчитываются.
4. Checkout не показывает delivery address/fee.
5. Tracking использует pickup-specific states и сообщает, когда заказ готов.

### Journey C — repeat order

1. Пользователь открывает history.
2. Выбирает «Повторить».
3. Система проверяет availability и изменившиеся modifiers/prices.
4. Доступные lines добавляются; проблемные явно требуют решения.
5. Пользователь подтверждает актуальный total.

### Journey D — shared discovery state

1. Пользователь ищет `трюфель`, выбирает `vegetarian`, sort `price-asc`.
2. URL отражает состояние.
3. Получатель ссылки видит тот же normalized result.
4. Reload и Back/Forward не теряют state.

## 6. Functional requirements

### 6.1 Menu and categories

Минимальный core catalog:

- 12–16 pizzas;
- 3–4 fixed combos;
- 4–6 snacks;
- 4–6 drinks;
- 3–4 desserts/sauces.

Для визуальной целостности достаточно 12–16 master food images с согласованными crops/variants. Набор из 6–8 изображений в `PRODUCT_OPTIONS.md` — prototype set для утверждения арт-дирекции, а не весь release catalog.

Каждый category/product использует устойчивый slug, не numeric UI index.

Product card показывает:

- controlled food image;
- name и short composition;
- starting/current price;
- dietary/spicy/new/popular badges, только если истинны;
- availability;
- favorite control;
- CTA `Выбрать` или quick-add только когда обязательной конфигурации нет.

Default menu не использует tutorial pagination по 4 товара. Для owned core-каталога предпочтительны category sections + URL-owned category/filter navigation без `page`, cursor или `Показать ещё`. Если dataset когда-либо перерастёт этот контракт, pagination становится отдельным измеримым architecture decision.

Acceptance:

- category selection scrolls/filters predictably and remains keyboard accessible;
- long names/compositions do not ломать card geometry;
- unavailable product нельзя добавить, но details остаются доступны с объяснением;
- price/number format идёт через `Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' })`.

### 6.2 Search, filters, sorting and URL

Search:

- ищет по name, composition, `searchAliases` ингредиентов и badges;
- input draft обновляется мгновенно;
- normalized query попадает в URL debounced;
- clear имеет named button и возвращает focus;
- result count объявляется через polite live region.

Filters:

- category;
- vegetarian;
- spicy;
- availability for selected fulfillment mode.

Sort:

- popular (default);
- price ascending;
- price descending;
- name.

Canonical example:

```text
/menu?category=pizza&q=truffle&sort=price-asc&diet=vegetarian&spicy=1
```

Taxonomy rules:

- `diet=vegetarian` — единственный meat-free filter; отдельный `no-meat` не дублируется;
- `spicy=1` означает «показывать острые», отсутствие параметра означает any;
- отрицательный `spicy=0` не сериализуется;
- price range не входит в core, пока dataset не докажет его пользу.

URL rules:

- defaults можно не сериализовать;
- unknown values safely normalize to defaults;
- debounced typing uses history `replace`;
- deliberate category/sort/filter transitions use `push`;
- browser Back/Forward is authoritative;
- parse/normalize/serialize are pure and round-trip tested.

### 6.3 Product details

Product route содержит:

- name, composition, weight range, nutrition summary where available;
- allergens and dietary/spicy attributes;
- image/gallery with fallback;
- availability and fulfillment note;
- full configurator;
- related combo/recommendation;
- deep-linkable slug and helpful not-found/unavailable state.

Card click/navigation uses real link so Cmd/Ctrl/middle click works.

### 6.4 Pizza configurator

Supported decisions:

1. Size.
2. Dough.
3. Removable base ingredients.
4. Required/optional modifier groups.
5. Paid extras/add-ons, представленные теми же optional modifier groups.

Rules:

- Variant defines a valid size+dough combination and base price.
- Invalid combinations are disabled with reason, not silently changed.
- Modifier group has `min`, `max`, `required` and allowed modifier IDs.
- Removal базового ингредиента всегда имеет нулевой price effect в core: ресторан не возвращает стоимость удалённого ингредиента. Если правило изменится, это потребует новой pricing contract version.
- Extra has price delta and availability.
- Price preview recalculates synchronously from integer minor units.
- CTA includes total: `Добавить за 890 ₽`.
- Selection remains local to configurator until added.
- Reopening from cart loads the exact configuration for editing.
- Focus is managed when modal/sheet opens/closes; controls use fieldsets/radios/checkboxes or equivalent semantic buttons.

Pricing formula:

```text
lineUnitPrice = variant.basePrice
              + selectedModifierDeltas
```

`selectedModifierDeltas` включает paid extras/add-ons. Removed base ingredients влияют на composition и identity, но не на цену.

Client calculation is preview. Checkout quote/order creation recalculates against current catalog rules.

### 6.5 Combos and recommendations

Combos are first-class fixed products, not a marketing banner.

- Core combo is `Product(kind: 'combo')` with an explicit composition and exactly one non-configurable `ProductVariant`; that variant's `basePriceMinor` is the bundle price.
- Its canonical cart configuration uses that product/variant and empty `removedIngredientIds`/`modifierSelections`; core has no substitutions.
- A configurable «соберите комбо» slot builder is value-add outside the core release.
- Recommendation includes reason: pair, savings, popular complement.
- Cart recommendations never block checkout.
- Dismissal is local UI state; analytics vendor is not required.

### 6.6 Cart

Canonical cart configuration:

```text
CartConfiguration {
  productId
  variantId
  removedIngredientIds: sorted[]
  modifierSelections: sorted [
    { groupId, modifierIds: sorted[] }
  ]
}
```

The canonical serialized `CartConfiguration` is the single input for fingerprint, persistence, quote, edit and reorder. Quantity is not part of identity.

Behavior:

- identical configurations merge quantities;
- different configurations remain separate;
- add, increment, decrement, remove, clear and edit are functional;
- remove offers undo where appropriate;
- empty cart directs to menu;
- header/cart/checkout read the same derived selectors;
- subtotal, discount, fee and total are visually separated;
- cart survives reload;
- stale/unavailable lines reconcile against latest catalog;
- derived prices/totals are not trusted from persistence.

Persistence payload contains only:

- `schemaVersion`;
- canonical `CartConfiguration` for each line;
- quantity;
- minimal fulfillment preference.

Do not persist payment data.

Guest PII policy:

- current checkout/confirmation may keep full contact/address only in `sessionStorage`, scoped to the active browser session and cleared after completion/expiry;
- optional local guest history stores a sanitized order snapshot: order ID, line configurations, totals, timestamps, status and fulfillment mode, but no phone, email, delivery note or full delivery address;
- pickup location may be stored because it is public store data;
- guest history persistence is disclosed and can be cleared; a seeded demo contact/address provides a safe reviewer path;
- a full saved address appears only after explicit consent in the optional account/backend milestone.

### 6.7 Promo codes

Promo validation behaves as server-owned even in demo mode.

Required states:

- idle;
- validating;
- applied with explainable discount;
- invalid;
- expired;
- minimum order not met;
- not applicable to selected products/mode;
- network error + retry.

Promo cannot optimistically show success. Cart/checkout total updates only after authoritative result.

Demo codes and rules должны быть documented для reviewer, но не занимать основной UI.

### 6.8 Fulfillment: delivery and pickup

Global fulfillment context contains mode and quote summary.

ETA copy contract:

- до address/store selection: `Укажите адрес` либо явно approximate range;
- после successful fulfillment quote: confirmed ETA, fee and availability;
- после изменения address, cart или mode предыдущий quote помечается stale до повторной проверки.

Delivery fields:

- city/zone (seeded single city is enough);
- street/address suggestion or validated manual input;
- house, apartment, entrance, floor;
- delivery note;
- ASAP or scheduled slot;
- contact name, phone, email optional/required by defined rule.

Pickup fields:

- location card with address/hours;
- pickup slot;
- contact data;
- no delivery fee/address fields.

Validation/recovery:

- address outside zone;
- minimum order;
- slot unavailable;
- store closed;
- fulfillment switch invalidates only fields that no longer apply;
- first invalid field receives focus and inline error explains the next step.

No real map is required. A small static location preview is optional if it improves comprehension and has a text equivalent.

### 6.9 Checkout

Checkout summary remains visible/sticky on desktop and collapsible on mobile.

Sections:

1. Fulfillment.
2. Contact.
3. Time/location/address.
4. Promo.
5. Payment method.
6. Final review.

Rules:

- cart cannot be empty;
- final quote runs before payment/order creation;
- changed price/fee/availability requires explicit acknowledgement;
- submit is idempotent and disabled only once request starts;
- navigation away with meaningful unsaved draft receives a warning where appropriate;
- guest checkout is complete without auth.

### 6.10 Mock payment

Supported outcomes:

- pending;
- success;
- declined;
- cancelled;
- retry success;
- network timeout with safe status recovery.

Payment UI is explicitly demo. It does not transmit/store real card numbers. Prefer a mock method selector and controlled demo outcome over a deceptive full PCI-looking card form.

Order is created once. Retrying a declined/timeout payment cannot duplicate order IDs.

### 6.11 Confirmation

Confirmation route shows:

- stable order ID;
- delivery/pickup ETA;
- address/location;
- ordered lines and totals;
- payment status;
- next step CTA `Отслеживать заказ`;
- optional `Сохранить заказ` account invitation after guest success.

Reload в активной browser session восстанавливает full summary из session order snapshot. Sanitized direct link/history summary восстанавливается из demo order repository/backend и не зависит только от transient navigation state.

### 6.12 Live-looking order tracking

Status model:

```text
confirmed
→ preparing
→ baking
→ ready_for_handoff
→ out_for_delivery | ready_for_pickup
→ delivered | picked_up
```

Requirements:

- accessible ordered timeline with current/completed/upcoming states;
- human copy, ETA and last update time;
- deterministic demo clock persists through reload;
- status can progress automatically on a short demo schedule;
- reviewer can enable an unobtrusive demo control to advance/replay states;
- reduced-motion path communicates the same information;
- offline/stale badge explains that updates are paused;
- no fake map movement is required.

If Supabase is added, order events may arrive through Realtime; the UI contract remains the same.

### 6.13 Order history and repeat order

History shows:

- date/time via `Intl.DateTimeFormat`;
- status;
- thumbnail/summary;
- total;
- details;
- repeat action.

Guest history may be local, но следует guest PII policy из раздела Cart. Account history may be server-owned.

Repeat order:

- revalidates product/variant/modifier availability;
- explains substitutions or removed items;
- uses current price;
- never silently recreates invalid configuration.

### 6.14 Favorites

- Favorite toggle works from card/details.
- Guest favorites persist locally.
- Toggle is optimistic only when rollback is possible.
- Empty favorites has CTA to menu.
- On optional sign-in, local favorites merge deterministically with server favorites.

### 6.15 Authentication

Auth is **valuable but not a core-flow dependency**.

It is justified only for:

- cross-device favorites;
- server order history;
- saved addresses/profile;
- repeat order across devices.

Recommended model:

- browse/cart/checkout as guest;
- passwordless email/OTP or simple email flow through Supabase;
- invitation to save order after confirmation;
- local cart/favorites merge after sign-in;
- session is owned by auth SDK, not a hand-written Redux token slice.

Gate: если auth, RLS и merge flow нельзя закончить качественно, release остаётся guest-first без декоративной login form.

## 7. State and failure matrix

Every asynchronous surface must define at least:

| State | Required behavior |
|---|---|
| Initial loading | Stable skeleton matching final geometry; `aria-busy` |
| Background refetch | Keep previous content; subtle progress |
| Empty catalog | Explain active query/filter and offer reset |
| API error | Specific message, retry, no eternal skeleton |
| Offline with cache | Show stale content + offline badge; cart remains usable |
| Offline without cache | Actionable offline state |
| Image error | Controlled fallback without layout shift |
| Product unavailable | Explain and suggest alternative |
| Promo invalid | Inline reason and corrective action |
| Quote changed | Diff/acknowledgement before payment |
| Payment declined | Preserve checkout, retry safely |
| Order timeout | Recover by idempotency key/status lookup |
| Empty cart/history/favorites | Contextual primary action |
| Route not found | Correct page title and link to menu |

Offline does not mean offline order submission. Cart and draft remain available; quote/payment/order creation are blocked until connection returns.

## 8. Content and visual requirements

- Product brand: Napoli; no framework name in customer-facing copy.
- Visual tokens and signature are defined in `PRODUCT_OPTIONS.md`.
- Food images are project-owned/licensed and stored in controlled formats; no Dodo hotlinks.
- Copy uses active voice and exact action: `Добавить за …`, `Проверить адрес`, `Повторить заказ`.
- Empty/error messages explain what happened and the next step.
- Product names/composition are real seeded content, not lorem ipsum.
- Price, weight, time, count and dates are localized; values and units do not break across lines.

## 9. Responsive contract

Required verification widths:

- 320 px;
- 390 px;
- 768 px;
- 1024 px;
- 1440 px.

Acceptance:

- no unintended horizontal scrolling;
- safe-area inset support for sticky mobile CTA/navigation;
- touch targets at least 44×44 CSS px;
- dialogs/sheets contain overscroll and restore focus;
- cart becomes vertical mobile rows, not compressed percentage columns;
- checkout summary remains reachable without covering focused fields;
- product configurator CTA remains visible without obscuring last option;
- long Russian copy and 200% zoom remain usable.

## 10. Accessibility contract

Target: WCAG 2.2 AA for implemented flows.

Required:

- `lang="ru"`, semantic landmarks and skip link;
- one clear page `<h1>` and valid heading hierarchy;
- native controls before ARIA;
- visible `:focus-visible` in all themes/states;
- full keyboard flow menu → product → cart → checkout → tracking;
- Escape closes modal/popover; focus returns to trigger;
- input labels, names, autocomplete, correct type/inputmode;
- inline validation and focus first invalid field;
- `aria-live` for cart, result count, promo/payment/order updates;
- meaningful image alt or empty alt for decoration;
- AA color contrast;
- reduced-motion alternative;
- no color-only status communication;
- axe has zero critical/serious issues on key routes, supplemented by manual keyboard/screen-reader checks.

## 11. Performance contract

Portfolio release targets on a representative mobile profile:

- LCP ≤ 2.5 s;
- CLS ≤ 0.1;
- INP ≤ 200 ms;
- no request waterfall for independent menu shell data;
- route chunks for product/cart/checkout/tracking/account;
- initial menu route excludes payment/account code;
- image width/height or aspect ratio always reserved;
- WebP/AVIF + responsive `srcset/sizes`;
- below-fold images lazy, first meaningful food image prioritized;
- previous catalog content retained during refetch;
- bundle budget documented and measured per milestone.

Virtualization is not required for the planned catalog size. Memoization is profiling-driven.

## 12. Product analytics without vendor lock-in

Define event names, not an analytics dependency:

- `menu_viewed`;
- `search_used`;
- `product_opened`;
- `configuration_changed`;
- `cart_item_added`;
- `promo_applied` / `promo_failed`;
- `checkout_started`;
- `payment_failed` / `payment_retried`;
- `order_confirmed`;
- `repeat_order_started`.

Events must not include raw address, card-like data or unnecessary PII. A no-op/debug adapter is enough until a real analytics destination is selected.

## 13. Portfolio success criteria

Release is convincing when a reviewer can:

1. Open a shared filtered URL and get the same menu.
2. Configure a pizza and see a tested dynamic price.
3. Add two different configurations and see separate cart lines.
4. Reload and keep a valid cart.
5. Apply valid/invalid promo.
6. Complete both delivery and pickup checkout as guest.
7. Recover from payment decline without duplicate order.
8. See confirmation and tracking progression.
9. Repeat an order with current availability checks.
10. Favorite a product, reload and recover it from Favorites.
11. Complete the critical flow with keyboard on mobile and desktop.
12. Trigger loading, empty, error and offline demo states.

The repository must also show:

- strict TypeScript;
- explicit state boundaries;
- unit/integration/E2E coverage around business rules;
- accessible component contracts;
- measured route splitting and performance;
- concise architectural decisions rather than library accumulation.

## 14. Release scope tiers

### Core portfolio release

- branded responsive menu;
- search/filter/sort/shareable URL;
- details/configurator/dynamic price;
- persistent cart/recommendations;
- promo + delivery/pickup checkout;
- mock payment + confirmation;
- deterministic tracking;
- local favorites/history/repeat;
- state matrix, accessibility, tests and E2E.

### Value-add release

- narrow Supabase backend;
- optional passwordless auth;
- cross-device favorites/history;
- order events through Realtime;
- saved addresses only if privacy/UX scope is clear.

Core release must remain fully demoable if Supabase is unavailable.
