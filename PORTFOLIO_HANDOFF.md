# Napoli — portfolio handoff

## Product

**Final name:** Napoli

**Short description:** A bilingual, guest-first pizza delivery application with a configurable menu, resilient checkout and honest order tracking.

**User problem:** Choose food quickly, understand configuration and final price, complete delivery or pickup checkout without registration, and recover an order after refresh or a failed response.

## Author contribution

The portfolio implementation replaces the small React Pizza tutorial runtime with an independently designed product architecture and Napoli interface: Vite/strict TypeScript migration, owned catalog and media pipeline, URL contracts, pricing/configuration domain, Redux/RTK Query state boundaries, durable cart, checkout, order lifecycle, RU/EN localization, accessibility, recovery states, automated quality gates, CI/release documentation, and the deployable server-order extension. Original Git history and upstream attribution remain visible because the inherited baseline has no repository license that would justify claiming it as newly authored code.

## Actual stack

- React 18, React Router, Redux Toolkit and RTK Query
- TypeScript 6, Vite 8, CSS Modules, Sass and CSS custom properties
- React Hook Form
- Vercel static hosting plus Web-standard Node Function
- Supabase Postgres migration for optional production order persistence
- Vitest, Testing Library, MSW, Playwright, Axe and Lighthouse
- GitHub Actions CI

## Main capabilities

1. Owned 36-item RU/EN catalog with search, category, dietary/availability filters, sorting and shareable URL state.
2. Product details, pizza variants, removable ingredients, paid modifiers and exact cart fingerprints.
3. Versioned persistent cart with quantity, edit, remove, undo, clear and availability reconciliation.
4. Delivery and pickup checkout with address/store validation, ASAP/scheduled time and promo-aware final quote.
5. Credential-free mock payment with decline/error/timeout scenarios and idempotent order recovery.
6. Reload-safe confirmation, live-looking honest demo tracking, sanitized bounded history and safe repeat order.
7. Favorites, offline/stale/error recovery, keyboard-first interaction, WCAG-oriented semantics and responsive widths from 320 to 1440 px.
8. Opt-in same-origin server order API with validated snapshots, Supabase persistence, RLS/grants and server-only secret handling.

## Architecture in brief

React Router owns catalog query state; RTK Query owns catalog/quote server state; Redux slices own cart, fulfillment and favorites; configurator and checkout drafts stay local/route-owned. Pure modules own money, canonical configuration, fingerprints, pricing and tracking transitions. Active guest PII is session-scoped locally; history is sanitized and bounded. In server mode, a Vercel Function validates and persists an order through a server-only Supabase secret, then mirrors the result into the same browser repositories for the existing UX.

## Links

- **GitHub:** https://github.com/godaylor/napoli-pizza
- **Live:** https://napoli-pizza-tau.vercel.app

## Best screenshots

- [Desktop menu](docs/screenshots/menu-desktop.jpg)
- [Mobile menu at 390 px](docs/screenshots/menu-mobile-390.png)
- [Product pages](docs/screenshots/product-pages.jpg)
- Recommended final capture after backend activation: delivery confirmation and tracking timeline in one 1440 px sequence.

## Licensing and provenance

- Upstream React Pizza history and attribution are retained; the baseline repository contains no LICENSE, so Napoli does not infer permission or relicense inherited commits.
- The current runtime/UI/domain implementation is documented as the owner's transformation, not a renamed upstream claim.
- Product imagery has per-asset generation/source records in `docs/ASSET-LICENSES.md` and `docs/MENU-IMAGE-REVIEW.md`.
- Font licenses and generated installed production dependency notices are included; build validates `public/THIRD-PARTY-NOTICES.txt`.

## What works in production now

The public Vercel site runs the full RU/EN menu → configuration → persistent cart → delivery/pickup checkout → promo/final quote → mock payment → confirmation → tracking → history/repeat journey in local demo repository mode. Direct-route reload, responsive behavior, keyboard/Axe flows and browser-engine coverage have release evidence in `docs/RELEASE.md`.

The server order code and database migration are implementation-complete but are **not yet active on the public URL** because this workspace has no Supabase project URL/secret. Production must not be described as cross-device or server-persistent until the connection checklist in `docs/DEPLOYMENT.md` passes.
