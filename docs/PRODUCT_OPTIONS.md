# Product and visual directions

## Decision

Рекомендуемое направление: **Napoli — городская neighbourhood kitchen**.

Оно даёт лучший баланс product realism, визуальной самостоятельности и frontend depth. Это не «ещё один оранжевый tutorial-каталог» и не дорогой эксперимент ради motion: основным wow-моментом становится живой, но полезный oven-stage motif, объединяющий конфигуратор, корзину и tracking.

## Как оценивались варианты

Шкала: 1–10; для «скорости реализации» 10 означает самый быстрый вариант.

| Направление | Wow-effect | Скорость | Frontend depth | Реалистичность | Ценность работодателю | Отличимость от tutorial | Итого / 60 |
|---|---:|---:|---:|---:|---:|---:|---:|
| **Napoli** | 9 | 7 | 9 | 10 | 10 | 10 | **55** |
| **Dough Lab** | 10 | 4 | 10 | 7 | 9 | 10 | 50 |
| **Slice Rush** | 8 | 9 | 8 | 10 | 9 | 9 | 53 |

Критерии намеренно не свёрнуты в один «business score»: разница между направлениями важнее одного числа. Napoli выигрывает, потому что ни по одному критичному измерению не опускается ниже 7.

---

## Option 1 — Napoli

### Product thesis

Самостоятельная городская пиццерия для людей 22–40 лет, которые хотят быстро заказать ужин, но выбирают продукт осознанно: видят состав, размер, время, аллергенные данные и понимают итоговую цену до корзины.

Главная работа меню: **помочь собрать подходящий заказ за 2–4 минуты без ощущения агрегатора**.

### Brand idea

«Кухня видна в интерфейсе». Визуальный язык берётся не из итальянских клише, а из предметов современной открытой кухни: enamel labels, stainless-steel counters, temperature markings, печные таймеры и карточки заказов.

Название Napoli является финальным пользовательским брендом; framework/tutorial naming исключается.

### Palette

| Token | Hex | Role |
|---|---|---|
| Porcelain | `#F6F3EC` | Основной canvas, не «жёлтая tutorial-страница» |
| Carbon | `#17191D` | Текст, navigation, high-contrast surfaces |
| Tomato lacquer | `#D9472B` | Food accent, badges, destructive emphasis |
| Cobalt enamel | `#3157C8` | Основной action color и focus ring |
| Basil | `#2F6A4F` | Vegetarian/availability/success |
| Steel | `#D9D7D0` | Dividers, controls, quiet surfaces |

Ключевой отличительный выбор — **cobalt, а не orange, как основной action color**. Tomato остаётся food-сигналом, но не превращает приложение в Dodo/tutorial clone.

### Typography

- Display: **Unbounded** с кириллицей, только для коротких brand/headline фраз и крупных чисел tracking.
- Body/UI: **Golos Text** — плотный, хорошо читаемый русский интерфейс.
- Utility/data: системный tabular-numeric stack либо **IBM Plex Mono** для ETA/order IDs/temperature-like labels.

Display не используется в длинных карточках и формах. Характер даёт контраст ролей, а не тотальная «дизайнерская» типографика.

### Layout concept

Desktop menu — спокойная content grid с компактным operational header; product details — split surface; mobile — полноэкранный commerce flow со sticky action zone.

```text
DESKTOP MENU
┌──────────────────────────────────────────────────────────────┐
│ NAPOLI    [Delivery · 32 min]  [Search........]   Cart 1 240 │
├──────────────────────────────────────────────────────────────┤
│ PIZZA  COMBOS  SNACKS  DRINKS  DESSERTS          Filters  Sort│
├──────────────────────────────────────────────────────────────┤
│ Seasonal story / operational offer                           │
├──────────────────────────────────────────────────────────────┤
│ product      product      product      recommendation         │
│ product      product      product      product                │
└──────────────────────────────────────────────────────────────┘

MOBILE PRODUCT
┌───────────────────────┐
│ back         favorite │
│    food photography   │
│   ◔ oven-price ring   │
├───────────────────────┤
│ Name / composition    │
│ Size · Dough          │
│ Remove / Add          │
│ Allergens             │
├───────────────────────┤
│ [Add for 890 ₽] sticky│
└───────────────────────┘
```

### Signature element

**Oven ring** — тонкая дуга вокруг product image/price, похожая на печной таймер. В configurator она отражает выбранный размер и price delta; в tracking та же геометрия показывает стадию заказа. Это один узнаваемый motif с продуктовой функцией, а не рассыпанная декоративная анимация.

### Motion

- Один orchestrated moment: при изменении variant кольцо и цена переходят к новому состоянию, modifiers появляются без layout jump.
- Add-to-cart завершается коротким переходом product → cart badge, без летящих частиц.
- Tracking ring движется только при смене стадии.
- Все эффекты используют transform/opacity, прерываемы и отключаются через `prefers-reduced-motion`.

### Product emphasis

- Delivery/pickup и ETA видны до каталога.
- Cards ведут в details; quick-add доступен только для продукта без обязательной конфигурации.
- Composition, dietary/spicy badges и availability — часть решения, не decoration.
- Recommendation объясняет причину: «к острой пицце», «выгоднее набором», а не просто «вам может понравиться».
- Cart, checkout и tracking визуально принадлежат одной системе.

### Why it works for a portfolio

- Показывает branding, design tokens, responsive composition и accessibility.
- Конфигуратор демонстрирует сложное domain state и dynamic pricing.
- Checkout/tracking добавляют consumer-product realism.
- Визуальный риск локализован в одном motif и не требует 3D pipeline.
- Отличие от tutorial считывается с первого экрана и подтверждается глубиной flow.

### Main risks

- Нужна качественная, юридически чистая food photography.
- Unbounded легко переиспользовать; требуется строгий typographic budget.
- Oven ring должен оставаться понятным и не конкурировать с CTA.

---

## Option 2 — Dough Lab

### Product thesis

Configurator-first experience для аудитории, которой интересно собирать необычные сочетания и видеть влияние каждого решения на цену, состав и условную nutrition summary.

Главная работа продукта: **превратить настройку пиццы в контролируемый интерактивный эксперимент**.

### Visual system

| Token | Hex | Role |
|---|---|---|
| Lab paper | `#F2F4F6` | Neutral canvas |
| Blueprint | `#193B8C` | Structure/grid |
| Heat orange | `#F15B35` | Active ingredient/price delta |
| Ultraviolet | `#7257D8` | Variant groups |
| Signal mint | `#64D6B2` | Valid/available state |
| Graphite | `#20242A` | Text and equipment surfaces |

Typography: `Unbounded` или `Russo One` для коротких experiment labels, `Golos Text` для UI, mono face для formulas/order metadata.

### Layout concept

```text
┌──────────────────────────────────────────────────────────────┐
│ ingredients layers       │ CONFIGURATION                     │
│   tomato / cheese        │ Size [30] Dough [thin]            │
│   mushroom / basil       │ Remove / Add / Constraints        │
│                          │ Price 890 ₽ · 640 g                │
│ exploded visual stack    │ [Add experiment to cart]          │
└──────────────────────────────────────────────────────────────┘
```

### Signature element

Exploded ingredient stack: modifier changes visibly rebuild 3–5 controlled layers. It can be implemented as curated transparent assets, not generative/3D runtime.

### Strengths

- Максимальный wow и frontend depth.
- Pricing/constraints state становится наглядным.
- Сильная тема для animation, derived state и testing.
- Очень далеко от tutorial.

### Weaknesses

- Высокая asset cost и риск недоделанного визуала.
- Ниже коммерческая универсальность: пользователь может хотеть «просто заказать».
- Сложнее mobile и reduced-motion implementation.
- Есть риск уделить 60% времени configurator и оставить checkout/history поверхностными.

### When to choose

Если цель меняется с «реальный delivery product» на «интерактивный frontend showcase» и есть время подготовить контролируемый image layer set.

---

## Option 3 — Slice Rush

### Product thesis

Mobile-first quick-delivery продукт для повторных заказов, офисного обеда и вечернего «нужно быстро». Основные преимущества: понятный ETA, one-tap repeat, компактные combos и минимальный checkout.

Главная работа продукта: **сократить путь от открытия до подтверждённого заказа**.

### Visual system

| Token | Hex | Role |
|---|---|---|
| Mist blue | `#EAF2F7` | App canvas |
| Burgundy | `#731F36` | Brand/action |
| Butter | `#F5D36B` | Offers/ETA |
| Coral | `#ED6A5A` | Food accent |
| Deep teal | `#0F5960` | Pickup/success |
| Navy ink | `#172738` | Text/navigation |

Typography: condensed display with Cyrillic for ETA/headlines, neutral `Onest`/`Golos Text` for UI.

### Layout concept

```text
MOBILE HOME
┌───────────────────────┐
│ Deliver to Home  24min│
│ [Search..............]│
│ Reorder last meal  →  │
│ Pizza | Combo | Drinks│
│ wide product row      │
│ wide product row      │
├───────────────────────┤
│ Home Search Orders Cart│
└───────────────────────┘
```

### Signature element

Courier route line: одна графическая линия связывает ETA, fulfillment selection и tracking timeline. На desktop она становится quiet divider system, а не картой ради карты.

### Strengths

- Самый быстрый путь к цельному commercial UX.
- Очень реалистичный mobile flow.
- Сильны reorder, fulfillment и operational states.
- Низкая стоимость иллюстраций и motion.

### Weaknesses

- Меньше visual spectacle на portfolio screenshots.
- Product configurator может выглядеть утилитарно.
- Похожая operational density встречается у многих delivery apps; отличимость нужно удерживать типографикой и route-line motif.

### When to choose

Если приоритет — быстрее выпустить убедительный consumer app и глубже показать mobile/resilience, чем арт-дирекцию.

---

## Почему выбран Napoli

### Decision matrix

| Вопрос | Napoli | Dough Lab | Slice Rush |
|---|---|---|---|
| Выглядит как реальный standalone brand | Да | Скорее concept brand | Да |
| Даёт сильный configurator | Да | Максимально | Достаточно |
| Не жертвует checkout/tracking | Да | Риск высокий | Да |
| Реалистично завершить vertical slices | Да | Сложно | Проще всего |
| Сильный desktop + mobile portfolio | Да | Desktop сильнее | Mobile сильнее |
| Требует дорогого asset pipeline | Умеренно | Да | Нет |
| Отличается без decorative overload | Да | Не всегда | Да |

Napoli берёт commercial clarity Slice Rush и часть интерактивной глубины Dough Lab, но сохраняет собственный visual thesis.

## Guardrails выбранного направления

- Не использовать tutorial yellow shell, dominant orange buttons и Dodo hotlinks.
- Не делать generic «cream + editorial serif + terracotta» moodboard; выбранные cobalt/enamel/oven cues должны быть видны в tokens и interactions.
- Не ставить large hero поверх основного job меню. Hero допустим только как seasonal offer с конкретным CTA.
- Не добавлять glassmorphism, random gradients, floating blobs и numbering без информационной функции.
- Один signature motif — oven ring; остальные surfaces спокойные.
- Food photography должна быть одинаковой по свету, масштабу и фону.
- Весь UI проектируется сразу для 320/390/768/1024/1440 px, keyboard и reduced motion.
- Copy называет пользовательское действие: «Добавить за 890 ₽», «Повторить заказ», «Проверить адрес»; никаких `Submit`/`Continue` без контекста.

## Recommended first design artifacts

До production UI implementation подготовить:

1. Brand lockup и app icon Napoli.
2. 6–8 owned product photos в единой treatment как prototype set; после утверждения — 12–16 master images/crops для core catalog.
3. Token sheet: color, type, space, radius, elevation, motion, focus.
4. Mobile/desktop wireframes для menu, product, cart, checkout и tracking.
5. State sheet: loading, empty, error, offline, unavailable, promo fail, payment fail.
6. Один high-fidelity vertical prototype: product configurator → cart.

Эти артефакты — вход для milestone 2, а не отдельный долгий redesign phase.
