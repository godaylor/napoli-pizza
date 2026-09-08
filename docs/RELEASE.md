<!-- generated-by: gsd-doc-writer -->
# Release verification

## Product image restoration — 2026-09-08

The Pexels replacement from `46c727c` was traced to 8 master PNGs, 48 responsive files and the temporary Pexels mapping helper. All 56 image paths were restored byte-for-byte from `artifacts/unverified-menu-originals`, the local ignored snapshot created immediately before replacement. Catalog keys and original RU/EN per-product alt text are restored. Pexels metadata/import files were removed because they no longer describe the publication set. No functional code or product data was rolled back.

Verification after restoration: all 56 working files match the pre-Pexels backup by SHA-256; all 36 production-preview cards render; eight representative product pages resolve the expected restored key. The full card contact sheet and product-page sheet were visually inspected at mobile/desktop sizes. Node 24.20.0 typecheck PASS, 31 files / 131 tests PASS, production build PASS (146 modules). Screenshots remain local under ignored `artifacts/` and are not publication files.

## GitHub publication candidate — 2026-09-08

Owner selected `https://github.com/godaylor/napoli-pizza` and explicitly authorized commit/push of the complete Napoli worktree. The target initially had no Git refs. Publication branch: `master`, preserving the original tutorial history; no force push or Vercel deploy is part of this step.

This section describes the superseded Pexels publication candidate. See “Product image restoration” above for the current state.

Post-replacement gate on Node **24.20.0**: typecheck PASS, lint PASS, **32 files / 133 unit/integration tests PASS**, build PASS (**148 modules**), browser matrix **134 passed / 2 intentional skips**. Five required responsive widths, direct routes, image fallback, RU/EN, checkout/recovery, Axe and keyboard tests pass. No backend or deployment secrets were added.

Post-replacement mobile performance: three LCP runs **5977.36 / 2405.42 / 1803.90 ms**, median **2405.42 ms**; median CLS **0**; observed INP **32 ms**. The defined median-based gate passes, though the first run exceeded the LCP target; this is lab evidence, not a field guarantee. Reports are local under `artifacts/m12`.

The repository selection and image-provenance conditions in the historical notes below are resolved. GitHub Actions and provider-side deep-link/asset smoke must be verified on the published commit and actual Vercel URL respectively. No hosted URL or real screen-reader session is claimed here. Repository-local `.gitattributes` normalizes text to LF without global Git configuration changes.

## Earlier portfolio release preparation — 2026-09-08

This targeted preparation supersedes the historical results below; no general audit was rerun.

- Exact `.nvmrc` Node `24.20.0` launched npm CLI explicitly (Windows npm.ps1 otherwise selects the system runtime). Clean install: 419 packages. Typecheck and lint: PASS, zero lint warnings.
- Coverage: 31 files / 131 tests PASS; statements 88.09%, branches 76.74%, functions 86.92%, lines 89.61%. Four Vitest workers prevent excessive simultaneous transforms; assertions were not weakened.
- Production build: PASS, 146 modules, static route chunks and complete dependency notices in dist.
- Browser matrix: 136 scheduled / 134 passed / 2 intentionally skipped Chromium-only raw-Tab cases. Chromium 390/1440, Firefox 1440 and WebKit 390; keyboard, Axe and existing recovery journeys pass.
- Portfolio regression coverage: English pickup hours/ETA, distinct configuration summaries in checkout and confirmation, decline/retry, RU/EN and order reload, direct routes, screenshots and no overflow at 320/390/768/1024/1440.
- Three mobile Lighthouse runs: median LCP 1804.90 ms, CLS 0.01550, performance score 0.98; observed Event Timing INP 32 ms. All configured budgets pass. Reports remain local in artifacts/m12.
- Local ports: 32500 site, 32501 E2E, 32502 performance preview, 32503 Chrome debugger. Occupancy checked; strict ports/no server reuse. No foreign process or global runtime setting changed.

Fixed incorrect pickup-store hours, incomplete English operational labels, technical demo copy, missing order configuration summaries and duplicate confirmation keys. React 18 image priority preserves the HTML attribute without a console warning. Existing UI/design and the static demo architecture remain intact.

Publication is not yet complete: the owner must choose the GitHub repository and confirm image provenance and tutorial-code rights (see ASSET-LICENSES.md). Vercel configuration is prepared, but provider-side deep-link/asset smoke requires an actual deployment. A real screen-reader session remains unverified. No commit, push or deploy was performed; existing migration changes are preserved.

## Historical release evidence — 2026-09-03

The audit/security observations below are historical, not newly rerun checks. The hosting smoke is not the only remaining publication condition; the current conditions above take precedence.

Дата evidence: 2026-09-03. Runtime: Node `24.20.0` из `.nvmrc`, npm `10.9.2`, Windows local production preview.

## Automated gate

| Check | Result |
|---|---|
| Clean install | `npm ci` GREEN; 419 packages installed from lockfile |
| TypeScript | GREEN |
| ESLint | GREEN, zero warnings |
| Unit/integration | 30 files, 129 tests GREEN |
| Coverage | 88.43% statements, 81.56% branches, 88.19% functions, 89.95% lines |
| Production build | GREEN; 146 modules transformed; Vite manifest emitted |
| Napoli RU/EN smoke | GREEN in production preview at 390 px: RU default, EN catalog and metadata, persistence after reload, return to RU, zero console errors |
| Browser matrix | 124 scheduled: 122 passed, 2 intentionally skipped for the Chromium-only raw-Tab test; all shared journeys GREEN across Chromium 390/1440, Firefox 1440 and WebKit 390 |
| Axe + keyboard | Key guest routes have zero critical/serious findings; keyboard activation passes in all engines and raw Tab+Enter completes the full path on Chromium mobile/desktop |
| Performance | 3 mobile Lighthouse runs; median LCP 1804.29 ms, median CLS 0.01622, observed Event Timing INP 24 ms; performance score 0.98 |
| Dependency audit | 0 critical/high; 2 moderate React Router findings |

## Responsive and resilience evidence

Browser journeys cover URL share/reload/back-forward, distinct configuration identity, cart persistence/edit, combo/recommendation, delivery/pickup, ASAP/scheduled time, promo success/failure, payment decline/ambiguous recovery, one idempotent order, confirmation/tracking reload, favorites/history/repeat and offline/error/stale states.

Targeted screenshots and overflow assertions run at 320, 390, 768, 1024 and 1440 px. Reduced motion, 200% text zoom, skip link, focus states and icon accessible names are asserted. WebKit uses viewport screenshots because its single-image dimension limit rejects the 320 px full-page catalog; Chromium retains the full-page evidence.

## Build and hosting evidence

The initial entry imports only shared JSX, Redux hooks and catalog API chunks. Product, Cart, Checkout, OrderConfirmation, OrderTracking, Favorites and Orders are distinct dynamic imports. Browser request assertions confirm initial `/menu` excludes checkout/payment/account chunks and loads responsive owned images.

`vercel.json` contains the official Vite SPA catch-all rewrite. Production preview direct routes/reloads and local assets are GREEN with a clean browser console. No external hosting preview was created in this workspace, so provider-side rewrite smoke remains the only deployment follow-up.

## Security and privacy triage

`npm audit` reports two moderate React Router advisories. The SSR hydration constructor-injection path is not reachable because Napoli is a client-only SPA. The open-redirect advisory requires attacker-controlled navigation destinations; this application uses fixed internal routes and validates reconstructable return paths before passing them to navigation. The available automated fix is the React Router 7 major and is deferred to a dedicated dependency migration.

The active order and in-progress checkout draft may contain guest contact/address/note only in versioned `sessionStorage`; the checkout draft is cleared after successful order creation. Bounded `localStorage` history is sanitized; automated tests deny phone, email, address, note, PAN and CVC. No Supabase secret, service-role key, payment credential field or raw PII logging path is present.

## Remaining external verification

- Publish to the selected hosting project and repeat direct-route reload/network/console smoke on its real URL.
- Run one targeted assisted-technology session with the reviewer’s screen reader; automated Axe, accessible-name assertions and keyboard journeys are GREEN but do not replace that session.

