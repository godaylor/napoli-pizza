# AGENTS.md — Napoli

This repository is being transformed from a React tutorial into a portfolio-grade food-delivery product. Treat the current code as a baseline, not as the target architecture.

## Read first

Before changing code, read in this order:

1. `docs/TRANSFORMATION_SPEC.md` — what the product must do.
2. `docs/PRODUCT_OPTIONS.md` — chosen Napoli design direction.
3. `docs/ARCHITECTURE.md` — state boundaries and technical decisions.
4. `PLAN.md` — milestone order and Definition of Done.
5. `docs/BASELINE_AUDIT.md` — evidence about the current tutorial baseline.

If code and docs disagree because a milestone has landed, verify the active milestone and update the affected documentation in the same task. Do not assume the target stack is already implemented.

## Current baseline

Historical note: the following audit snapshot describes the original tutorial, not the current worktree. M1–M10 and M12 implementation evidence is recorded in PLAN.md; the current app uses Vite, TypeScript and static demo adapters. For the latest publication checks and unresolved external steps, read docs/RELEASE.md and docs/ASSET-LICENSES.md.

As of the audit, the repository still uses:

- CRA / `react-scripts`;
- JavaScript/JSX;
- React 18;
- one Redux `filter` slice;
- direct Axios loading from MockAPI;
- incomplete URL synchronization;
- a static, non-functional Cart route;
- no automated tests.

The documents added by the audit are planning artifacts only. They do not mean Vite, TypeScript, RTK Query, cart, checkout or Supabase already exist.

## Product guardrails

- The customer-facing brand is Napoli unless the user approves another name. Never expose the original tutorial brand, CRA or framework language in product copy.
- Guest browsing, cart and checkout are the core flow. Auth must not block purchase.
- Never ship a visible dead control, placeholder CTA, hardcoded cart total or decorative form that implies behavior it does not have.
- Prices must be explainable and calculated in integer minor units.
- Any product configuration shown in cart must be reconstructable and editable.
- Delivery and pickup are first-class flows.
- Failure/recovery states are part of each feature, not a later cleanup task.
- Demo payment is explicitly mock and must never collect or persist real payment credentials.
- Live-looking tracking must remain honest about demo mode and understandable without animation.
- Avoid enterprise scope: no microfrontends, event bus, custom backend framework, real payment integration or premature admin system.

## Visual guardrails

- Follow the Napoli direction: porcelain/carbon surfaces, cobalt action color, tomato/basil semantic accents, disciplined oven-ring signature.
- Do not recreate the tutorial yellow shell or use dominant orange actions.
- Do not fall back to a generic cream + serif + terracotta editorial template.
- Use the oven ring as the one signature motif; keep surrounding UI calm.
- Use project-owned/licensed food assets with consistent lighting, crop and scale. No hotlinked Dodo images.
- Copy uses specific active actions: `Добавить за 890 ₽`, `Проверить адрес`, `Повторить заказ`.
- New UI must be reviewed at 320, 390, 768, 1024 and 1440 px.

## State ownership

Do not duplicate a state across boundaries.

| State | Owner |
|---|---|
| Search/category/sort/filter | React Router URL/search params; no menu pagination |
| Menu/product/availability/quotes/order queries | RTK Query server-state cache |
| Cart and fulfillment preference | Redux Toolkit slices |
| Product configurator draft | Local reducer/form state |
| Checkout fields | Route-owned form state; Redux only if cross-route need is proven |
| Active checkout/order snapshot | Versioned sessionStorage via `DemoOrderRepository` |
| Cart/favorites/sanitized order history | Explicit versioned localStorage payload; history is bounded and expires |
| Auth session | Supabase SDK if the optional backend milestone is active |
| Modal/popover/open UI state | Local component state |

Never reintroduce Search Context or mirror catalog filters in Redux and URL.

## Architecture rules

- Prefer a feature-first structure matching `docs/ARCHITECTURE.md`.
- Domain constants and pricing rules must not live in view components.
- Money, canonical `CartConfiguration`, cart fingerprint, URL codec and order transitions are pure modules with unit tests.
- `CartConfiguration` includes product, variant, sorted removed ingredient IDs and modifier selections sorted by group and ID. One canonical serializer is reused by fingerprint, persistence, quote, edit and reorder.
- Ingredient removability is product-specific. Removing a base ingredient has zero price effect in core; paid add-ons are optional modifier groups.
- Core combos are fixed products; do not introduce a second configurable combo builder without a new product decision.
- RTK Query is the chosen server-state layer while Redux remains. Do not add TanStack Query alongside it without an explicit architecture decision.
- Use targeted runtime validation for URL, API, persistence and form boundaries; do not schema-wrap every internal object.
- Keep CSS Modules + Sass + CSS custom-property design tokens. Do not add a second styling system merely for convenience.
- Introduce a headless UI dependency only when a complex accessibility behavior cannot be safely maintained locally.
- Prefer direct imports; create barrel exports only as intentional feature public APIs.
- No dumping-ground `utils.ts`; colocate helpers with their domain or place stable generic code under `shared/lib`.
- Do not persist the entire Redux store or RTK Query cache.
- RTK Query cache is not an order repository. Confirmation/tracking/history reload through `DemoOrderRepository` in demo mode or the account backend when enabled.
- Do not use IndexedDB/localForage for the small cart payload unless a measured requirement changes.

## Accessibility rules

- Target WCAG 2.2 AA for implemented flows.
- Use semantic HTML before ARIA.
- Never remove outlines without a visible `:focus-visible` replacement.
- Every page has a meaningful `<h1>`, valid landmarks and heading hierarchy.
- Icon-only controls need accessible names; decorative icons are hidden from assistive tech.
- Forms need real labels, correct type/inputmode/name/autocomplete and inline errors.
- Focus the first invalid field; restore focus after dialogs/sheets.
- All critical flows work by keyboard; Escape closes popovers/dialogs.
- Touch targets are at least 44×44 CSS px.
- Async cart/search/promo/payment/order changes are announced through polite live regions.
- Respect `prefers-reduced-motion`; never make motion the only status signal.
- Automated axe checks supplement, not replace, manual keyboard/screen-reader verification.

## Data, security and privacy

- Use owned typed fixtures/demo adapters until the optional Supabase milestone is explicitly active.
- Normalize transport errors before they reach UI copy.
- GET retry may be bounded; never blindly retry payment or order creation.
- Order creation requires an idempotency key.
- Do not log raw addresses, contact data, tokens or payment-like values.
- Full guest phone/email/address/note may exist only in the active session snapshot. Local guest history must omit them; pickup store data may remain because it is public.
- Do not render untrusted HTML.
- Never expose a Supabase secret/service-role key in the frontend.
- If Supabase is used, every exposed table needs explicit grants and RLS; ownership must use `auth.uid()` predicates and be integration-tested with two users.
- Guest core mode must still work if external backend/auth is unavailable unless the user explicitly changes this requirement.

## Performance rules

- Route-split product, cart, checkout, tracking/history and account; keep app shell/menu initial.
- Prefetch route/data on user intent, not all content on load.
- Keep previous catalog data visible during background refetch.
- Product images need intrinsic geometry, responsive sources, below-fold lazy loading and controlled fallbacks.
- Do not add virtualization or broad memoization without profiling evidence.
- Verify route chunks in the build manifest/network trace.
- Release targets: LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms on the agreed mobile profile.

## Testing expectations

Each behavioral change includes tests at the lowest valuable level:

- Vitest for pure domain rules.
- Testing Library + user-event + MSW for feature integration.
- Playwright for critical browser journeys.
- axe plus manual accessibility checks for changed surfaces.

Prefer accessible role/name queries and user-visible assertions. Do not test CSS class names or hook implementation details.

Critical E2E contracts include:

- shared URL reload/back-forward;
- configure → add → distinct cart fingerprints;
- cart persistence and edit;
- delivery and pickup checkout;
- valid/invalid promo;
- payment decline → retry → one order;
- confirmation/tracking reload;
- favorites/history/repeat;
- offline/error recovery;
- keyboard-only critical path.

## Commands

Inspect `package.json` before running commands; the scripts change in milestone 1.

Current CRA baseline:

```text
npm start
npm run build
npm test
```

Target commands as the corresponding milestones land:

```text
npm run dev
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npm run build
npm run test:e2e
```

Do not claim a check passed unless it was actually run. Report environment/tooling limitations separately from application failures.

## Milestone workflow

1. Identify the active milestone in `PLAN.md`.
2. Restate its user-visible outcome and failure scenarios.
3. Inspect the current implementation and dirty worktree before editing.
4. Implement the smallest complete vertical behavior.
5. Add/update unit, integration and browser coverage.
6. Verify mobile/desktop, keyboard, error and loading states.
7. Run the milestone quality gate.
8. Update docs if a deliberate architecture/product decision changed.

Do not pull work forward from later milestones unless it is a required dependency for the current vertical outcome.

## Change discipline

- Preserve user changes and existing git history.
- Never use destructive git commands to simplify a migration.
- Do not edit generated `build/`/`dist/` artifacts.
- Remove legacy assets/dependencies only after replacement behavior is covered.
- Keep package versions pinned through the lockfile.
- Do not commit or push unless the current user request explicitly authorizes it.
- When a requirement is ambiguous but the code/docs can answer it, investigate before asking.
- If a choice materially expands scope (backend, real payment, admin, SSR), stop and request direction.

## Definition of done for any feature

A feature is done only when:

- its user-visible success path works;
- relevant empty/loading/error/offline/unavailable states work;
- keyboard/focus semantics are correct;
- required responsive widths are verified;
- derived values come from the correct source of truth;
- tests cover domain rules and critical browser behavior;
- typecheck, lint and production build pass;
- no visible control is decorative or dead;
- documentation remains truthful.
