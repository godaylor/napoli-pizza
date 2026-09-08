# ADR-001: Skip optional M11 Supabase account sync

- Status: Accepted
- Date: 2026-08-28
- Decision owner: Product/repository owner
- Applies to: Milestone 11 and the Napoli core portfolio release

## Context

Milestone 11 is an optional value-add branch for passwordless authentication and cross-device synchronization of favorites and sanitized order history. `PLAN.md` permits implementation only when cross-device retention materially improves the product and a stable hosted demo environment is available.

The core guest product is already complete through M10B: local favorites and sanitized history are reload-safe, checkout does not require registration, and deterministic demo adapters keep the reviewer flow independent from external services. No stable hosted Supabase demo environment, email-delivery contract, redirect origin or project connection is part of the current release scope.

## Decision

Skip M11 for this release and proceed directly from M10B to the M12 production release gate.

The application will not add:

- Supabase packages, environment variables or project configuration;
- an `/account` route or passwordless email flow;
- remote favorites/history tables, grants or RLS policies;
- guest-to-user merge behavior;
- any claim of cross-device persistence.

Guest browsing, cart, checkout, confirmation, tracking, favorites and sanitized history remain the authoritative core experience.

## Consequences

- Favorites and sanitized order history remain explicitly scoped to the current browser profile.
- Core release verification does not include auth, remote synchronization or RLS tests.
- External email delivery and backend availability cannot make the portfolio demo brittle.
- M12 must continue to verify that no account prompt blocks purchase and that no Supabase secret or client configuration appears in the bundle.

## Reconsideration criteria

Open a new decision before implementing the optional branch. It requires all of:

1. A stable hosted Supabase project dedicated to the demo.
2. Approved redirect origins and a reliable passwordless email delivery path.
3. A concrete cross-device reviewer journey that justifies the dependency.
4. Time for two-user RLS isolation tests, guest merge idempotency and offline fallback.
5. Confirmation that guest purchase remains fully functional without the backend.

Until those criteria are met, local adapters remain the intended production-demo architecture.
