# SOKORA

SOKORA is a Swahili-first, Tanzania-focused social-commerce marketplace: **Tazama. Gundua. Nunua.**

## Current web foundation

- Public product/feed browsing from the Worker API; known seeded/demo records are filtered out.
- Account registration/login using the existing Worker authentication and JWT configuration.
- Buyer checkout/order APIs and account order view.
- Commerce API foundation for conversations/messages, saved products, reviews, notifications, seller storefront metadata, and LIVE product pinning.
- Product cards support image/video URLs when the backend has valid media URLs.
- Upload entry points require an authenticated session. Until a real media-storage upload service is configured, creating a listing from the web UI saves it only in the current browser/device and does **not** publish it to the public marketplace.
- LIVE streaming is not active until a streaming provider and server-side integration are configured.

## Hosting and database safety

- Web/Worker deployment target: Cloudflare Workers.
- Database: Neon PostgreSQL through the `sokora_hyperdrive` binding.
- The production Hyperdrive binding is configured in `wrangler.jsonc`.
- **Preview deployments intentionally do not inherit the production Hyperdrive binding.** Configure a separate Hyperdrive binding connected to an isolated Neon preview branch before testing write APIs in preview.
- Do not apply `server/migrations/003_commerce_foundation.sql` until the SOKORA Neon project, branch, and database connection have been positively verified. The migration is additive; review it before applying.
- Never commit database passwords, JWT secrets, API keys, or other credentials.

## Verification status

GitHub Actions build workflows validate the web build, but a successful build does not prove production database connectivity or API health. Before declaring the marketplace production-ready, verify:

1. Cloudflare `/api/health` reports the database as available.
2. Registration/login and session validation work against the intended Neon database.
3. Product/feed reads, orders, and buyer/seller authorization pass integration tests.
4. Media uploads persist to a configured storage service and are visible to other users.
5. A separate preview database is used for preview writes.

## Development

```sh
npm install
npm run dev
npm run build
``

Keep existing Neon data intact. Do not drop or reset tables as part of routine development.
