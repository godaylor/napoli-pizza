<!-- generated-by: gsd-doc-writer -->
# Release verification

## Server-order extension — 2026-09-11

A deployable Vercel `/api/orders` boundary and Supabase migration now cover successful guest-order persistence, status-event creation and idempotency recovery. The server validates quote expiry, payload limits, fulfillment consistency and all integer-minor-unit arithmetic before writing. Browser code never receives `SUPABASE_SECRET_KEY`; the migration enables RLS and revokes `anon`/`authenticated` access to both PII-bearing tables.

Local verification after the change: client/API typecheck PASS, zero-warning lint PASS, 32 files / 136 unit-integration tests PASS, production build PASS (146 client modules). The focused Vercel handler test confirms lookup → insert → event behavior and `apikey`-only secret transport. The production site was opened and visually inspected in a normal in-app browser; its current demo-mode menu remains available.

The full local Playwright rerun is not counted: the installed Playwright package expects browser revision 1234, which is absent from the shared machine cache. A one-test Chromium rerun reproduced the missing-executable failure before page creation. Because other PetProjects are running concurrently, this task did not mutate the shared browser cache or stop any process. The preceding 138-pass / 2 intentional-skip matrix remains historical evidence for the unchanged demo client flow, not evidence for server mode.

Server mode is not deployed: no Supabase project URL or secret is available in this workspace. Apply the checked-in migration, add the three Vercel environment values described in `DEPLOYMENT.md`, redeploy, then run the hosted create/recovery/row-count smoke before marking Milestone 13 GREEN.

## Canonical repository transfer — 2026-09-10

The owner renamed the previous deployment repository to `godaylor/napoli-pizza-archive` and the repository with the React Pizza history to `godaylor/napoli-pizza`. The canonical remote `master` was `6941c3379d5ac0c4dda4d844981660aea6ca6f4a`; it is an ancestor of the complete local Napoli history. Existing commits `46c727c` and `762cedf` are retained unchanged, with the new product-specific imagery in `1229430`. Publication uses a normal fast-forward push; no archive deletion, history rewrite or force push.

Pre-push checks on Node 24.20.0: typecheck PASS, lint PASS, 31 files / 132 unit/integration tests PASS, build PASS (146 modules). The build regenerates and validates full third-party license/copyright notices; `public/THIRD-PARTY-NOTICES.txt` and its deployed copy are identical (142253 bytes). Image provenance and the inherited-code license limitations remain explicitly recorded in `ASSET-LICENSES.md`; no new application license is inferred.

Final full browser matrix: 138 PASS / 2 intentional Chromium-only skips, clean runner exit in 2.6 minutes. Chromium 390/1440, Firefox 1440 and WebKit 390 cover guest flows, recovery, keyboard/Axe, image decoding and 320/390/768/1024/1440 widths. The first sandbox run prevented Firefox page creation and stalled server cleanup; an unrestricted run exposed external Google Fonts waiting in the shared-link test's second tab. Font interception now belongs to the entire test context, retaining every user-visible assertion. A subsequent complete run passed. Browser-generated `debug.log` is ignored.

Secret scan: 444 tracked/unignored worktree paths and 605 historical Git blobs, including 400 text objects, checked for private keys, GitHub/AWS/provider tokens, credential-bearing URLs and long literal secret assignments. No matches or credential-file paths found. `.env*`, `.vercel`, generated builds and local reports are excluded. This is a scoped pattern scan, not a proof that every possible secret format is absent. Fresh runtime `npm audit`: zero high/critical, two moderate React Router findings with the existing triage below.

Vercel target is the existing `maxeem/napoli-pizza` project (`prj_bTzZ2D9sQrDrB7Ui9bljb8NYhsU5`) and the existing `napoli-pizza-tau.vercel.app` domain. Before reconnection, Git settings resolve the connected repository as `napoli-pizza-archive`; Vite, root directory and Node 24.x are already configured. Hosted checks follow the push and Git reconnection.

The canonical fast-forward push completed at `a8a61e7`, and Vercel Git settings now show `godaylor/napoli-pizza` connected. The archive remains at `762cedf9ce1d73ddf3f7b02d3147f9dfa25943e3`. The first GitHub CI run revealed a detached-element race in the search integration assertion during catalog replacement. The assertion now waits for the named Tiramisu article and the final one-result list together, without retaining a stale DOM reference or weakening the expected result.

A local rerun also exposed the history test asserting its seeded label while the current catalog was still loading. It now waits for that same visible label. These changes affect tests only; product behavior and the production build remain unchanged.

Hosted browser smoke on the retained domain passed the actual menu → Mortadella product → 30 cm plus extra cheese (1260 RUB) → persistent cart → delivery (199 RUB) → final quote (1459 RUB) → simulated payment → confirmation → tracking flow. Cart, confirmation and tracking direct reloads passed; English tracking also passed. The new Mortadella image was visually inspected. Vercel shows the canonical repository source, Production/Ready and the retained domain. Automated HTTP and isolated Playwright requests received Vercel Security Checkpoint (403) before the app; those automated production checks are not counted as passes. The ordinary browser passed Vercel's check without a security-setting change.

Linux CI passed typecheck, lint, 132 tests and build, then exposed a WebKit-only 11 px scroll overflow at 320 px. A native-select clipping hypothesis passed local checks but did not resolve the Linux finding, so that styling change was reverted. Geometry diagnostics now include the horizontal scroll offset and nested scroll containers. The remote Linux result remains the authoritative follow-up for this platform-specific finding.

The expanded diagnostics locate the overflow inside the demo-controls grid, with no visible text or element crossing the viewport. Explicit grid track sizing did not change the Linux result and was reverted. The inner demo-controls panel now clips overflow to its own bounds; its existing padding preserves room for focus outlines. This is scoped to that panel, with the page overflow assertions unchanged. Local lint, build and the responsive keyboard/configurator test in all four browser projects pass; the subsequent Linux CI run verifies the platform-specific result.

## Product-specific images — 2026-09-10

All 36 catalog products now use distinct image keys matched visually against their names, descriptions and categories. Three suitable original pizza images remain active; 33 replacements include the three approved previews copied unchanged. All 56 previous master/responsive files are preserved byte-for-byte. New assets include PNG masters and 480/960 AVIF, WebP and JPEG sources. See `docs/MENU-IMAGE-REVIEW.md` for the per-product record and generation references.

Verification on Node 24.19.0: typecheck PASS, lint PASS, 31 files / 132 unit/integration tests PASS, production build PASS (146 modules). Browser checks cover all 36 images decoding at 320, 390, 768, 1024 and 1440 px, unique sources, RU/EN bindings, product details and adding to cart. Responsive image/fallback, keyboard and text-zoom assertions passed. A separate browser run against the existing preview completed cleanly with 2 tests passed, including the image audit and no critical/serious Axe violations on key guest routes. Six category screenshots were visually inspected. An earlier managed-webserver test run passed its assertions but stalled during Windows cleanup; it is not counted as a clean runner exit.

Local production preview: port 32500. No deployment, commit, paid API or Docker changes were performed.

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

