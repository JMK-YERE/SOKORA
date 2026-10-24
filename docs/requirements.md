# SOKORA — Product Requirements and Delivery Plan

**Status:** living specification; this document records intended requirements, not a claim that every feature is implemented.
**Primary market:** Tanzania. **Default language:** Kiswahili. **Currency:** TSh.
**Current architecture:** React/Vite web client, Cloudflare Worker API, Neon PostgreSQL via Hyperdrive.

## Delivery principles

1. Preserve existing production data. Use additive, reversible database migrations; never drop or truncate user tables during routine deployment.
2. Ship vertical slices that work end-to-end before expanding feature scope.
3. Never display demo records as verified real sellers, real orders, or real live streams. Label seeded/example content clearly.
4. Keep secrets in Cloudflare/GitHub secret storage; never commit tokens or database URLs.
5. A feature is “complete” only after implementation, automated checks, and an appropriate live/API verification.

## FR-01 — Accounts, authentication, and security
- Register and sign in using email, phone, username, and password where supported.
- Roadmap: verified OTP, recovery, social sign-in, 2FA, device/session management, account export and soft deletion.
- Support Guest, Buyer, Seller, Creator, Moderator, and Admin permissions; enforce authorization server-side.
- Users can maintain a profile with display name, avatar, bio, region, language, and contact preferences.
- Security requirements: password hashing, signed short-lived access sessions, rate limits, validation, generic authentication errors, audit security events, and safe secret management.

## FR-02 — Video and discovery feed
- Vertical mobile-first feed with For You and Following; Nearby requires an explicit user region/permission.
- Video controls: autoplay when visible, pause/play, mute, loop, seek/progress, and accessible controls.
- Show creator, caption, category/hashtags, price in TSh, location, and a product detail action when data exists.
- Record meaningful events (impression, watch time, completion, like, save, share, follow) with consent and deduplication.
- Ranking should balance watch time, engagement, recency, location, category interest, and diversity; provide “not interested” and reporting controls.
- Use lazy loading and prefetch carefully; adapt media quality to bandwidth. Do not promise HLS or sub-1.5-second startup until measured.

## FR-03 — Creator publishing
- Upload image/video with file type and size validation, progress, retry, caption, price, location, category, and preview.
- Persist listing metadata and media in server-backed storage before calling it published.
- Roadmap: trim, cover selection, drafts, scheduled posts, analytics, duet/stitch/remix, and licensed sound tools.
- Allow the owner to edit or delete their own content with audit-safe behavior.

## FR-04 — Social interaction
- Like/unlike, comment/reply, share, save, follow/unfollow, and report.
- Roadmap: comment likes/pinning, mentions, direct messages, reposts, mute/block/restrict, and notifications.
- Persist interactions server-side, enforce uniqueness and ownership, and rate-limit abusive activity.

## FR-05 — Creator and business profiles
- Public creator/business profile with handle, bio, region, contact choices, products, videos, and follow counts.
- Seller verification badge only after an actual verification workflow approves the seller.
- Privacy settings, shareable profile links, and profile analytics are planned follow-up work.

## FR-06 — Marketplace
- Product listings include title, description, price, media, seller, location, category, stock/availability, and optional variants.
- Search across products and sellers; category, price, region, and availability filters.
- Product details provide seller contact, save, related items, and clear safety guidance.
- Roadmap: reviews, Q&A, inventory alerts, cart, and checkout.

## FR-07 — LIVE shopping
- Public live sessions, host permissions, viewer counts, moderated comments, pinned products, report/end controls, and replay.
- Must use a real streaming provider or a tested streaming pipeline; do not simulate live video or viewer counts.

## FR-08 — Search and discovery
- Search products, videos, creators, sellers, and services.
- Support category, price, location, newest/relevance sorting, helpful empty states, and optional search history.
- Trending and fuzzy Swahili/English matching are later iterations.

## FR-09 — Orders and seller communication
- Server-backed order creation with immutable price snapshot, quantity, buyer/seller references, delivery details, and status history.
- Statuses: received, processing, shipped, delivered, completed, cancelled, refunded (refund only when payment integration supports it).
- Roadmap: buyer-seller chat, invoices, delivery tracking, disputes, and escrow-ready design.
- Do not represent a WhatsApp enquiry as a platform order or payment.

## FR-10 — Notifications
- In-app notification center for follows, interactions, security, and order events.
- Push, email/SMS, LIVE alerts, channel preferences, and delivery retries are staged capabilities.

## FR-11 — Sharing
- Native share sheet where supported, copy link, WhatsApp share, and stable deep links to a product/profile/post.
- Share URLs should resolve to the exact item and have safe previews.

## FR-12 — Trust and safety
- Report accounts, listings, media, and comments; moderation queue; appeals and policy enforcement.
- Seller verification, anti-spam controls, abuse rate limits, moderator/admin role checks, and audit logs.
- AI-assisted moderation is optional and requires human review and privacy safeguards.

## FR-13 — Administration and analytics
- Role-protected dashboard for users, sellers, products, orders, reports, and system health.
- Moderation and seller verification queues, auditable role changes, CSV exports, and operational metrics.
- Never expose admin metrics or privileged actions to ordinary users.

## FR-14 — Payments and payouts (roadmap)
- Design provider adapters for M-Pesa, Tigo Pesa, Airtel Money, HaloPesa, and cards.
- Implement only after provider credentials, callback verification, idempotency, reconciliation, refund rules, and security review are in place.
- Never store raw card credentials. Do not claim escrow until a compliant provider-backed flow exists.

## FR-15 — Localization and accessibility
- Kiswahili-first UX, English-ready strings, Tanzania regions, TSh formatting, and localized dates.
- Minimum touch targets around 44px, keyboard navigation, form labels, focus visibility, meaningful media alt text, reduced-motion support, and WCAG AA contrast goals.

## Non-functional requirements and measurement

| ID | Requirement | Target / verification |
|---|---|---|
| NFR-01 | Performance | FCP under 2s on a defined 3G/4G test profile; API p95 under 500ms under a documented load profile; measure rather than assume. |
| NFR-02 | Scalability | Stateless Worker endpoints, bounded DB pool, CDN media delivery, and queues for expensive async work. |
| NFR-03 | Availability | 99.9% is a future service objective; define monitoring window, SLO, and incident response before advertising it. |
| NFR-04 | Security | HTTPS, secure password hashing, signed sessions, authorization, input validation, rate limiting, and secret storage. |
| NFR-05 | Privacy | Collect minimum necessary personal data; document consent, retention, export/deletion, and redact sensitive logs. |
| NFR-06 | Reliability | Idempotent critical writes, transaction boundaries, bounded retries with backoff, and actionable error responses. |
| NFR-07 | Usability | Readable type, clear Swahili copy, consistent states, and touch targets at least 44px where practical. |
| NFR-08 | Responsiveness | Mobile-first layouts, tablet/desktop breakpoints, safe areas, and landscape handling. |
| NFR-09 | Accessibility | Target WCAG AA contrast (4.5:1 normal text), labels, focus order, keyboard support, and reduced motion. |
| NFR-10 | Compatibility | Test supported modern browsers and Android/iOS devices; declare a minimum OS only after device testing. |
| NFR-11 | Maintainability | Modular code, CI build checks, unit/integration/E2E coverage, and API/schema documentation. |
| NFR-12 | Data integrity | Constraints, additive migrations, transactions, and backup verification before risky schema changes. |
| NFR-13 | Recovery | Define RPO/RTO and periodically test restore from backups. |
| NFR-14 | Media delivery | CDN, thumbnails, adaptive streaming/transcoding pipeline, and upload retry/resume. |
| NFR-15 | Localization | Kiswahili-first, TSh, Tanzania regions, and a structured path to English. |
| NFR-16 | Monitoring | Health checks, structured logs, API/DB/upload metrics, and actionable alerts. |
| NFR-17 | Observability | Correlation IDs, redacted logs, error tracking, and request timing. |
| NFR-18 | Cost | Pool database connections, cache safe reads, manage media lifecycle, and alert on spend. |
| NFR-19 | Compliance | Publish terms, privacy, content, seller, and retention policies before broad public launch. |
| NFR-20 | Extensibility | Version APIs where needed; isolate payment, delivery, streaming, and notification providers behind adapters. |

## Delivery phases
1. **Foundation:** account flows, health checks, safe API errors, schema constraints, and CI verification.
2. **Commerce slice:** persistent product/listing creation and retrieval, media storage, seller contact, and owner-only edit/delete.
3. **Feed slice:** responsive vertical feed, playback controls, server-backed likes/saves/follows, event measurement, and ranking baseline.
4. **Trust slice:** reporting, moderation queue, seller verification, RBAC, and audit events.
5. **Orders and messaging:** persistent order lifecycle, notifications, and chat.
6. **Scale and advanced features:** adaptive streaming, recommendations experiments, LIVE, payments, analytics, and operations dashboard.

## Release checklist
- [ ] Build and automated tests pass for the target commit.
- [ ] API contract and migration have been reviewed.
- [ ] Existing data is preserved and backup/restore path is known.
- [ ] Authorization, validation, rate limits, and error cases are tested.
- [ ] No secret is committed.
- [ ] Deployment success is confirmed separately from build success.
- [ ] Critical user flows are smoke-tested on mobile and desktop.
- [ ] Unimplemented roadmap items are clearly labelled in the UI.
