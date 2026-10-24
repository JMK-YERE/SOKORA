# SOKORA commerce foundation

This change adds the first authenticated transaction layer without deleting or rewriting existing marketplace data.

## Included API routes

- `GET /api/orders`: list orders where the signed-in user is buyer or seller.
- `POST /api/orders`: create an order from active product IDs and quantities. Prices are read from PostgreSQL, not trusted from the client. One order may contain products from one seller only; create separate orders for different stores.
- `PATCH /api/orders/:id/status`: controlled transitions: seller confirms then ships; buyer marks delivered; buyer or seller may cancel only a pending order.
- `GET /api/saved-products`, `POST /api/saved-products/:productId`, `DELETE /api/saved-products/:productId`.
- `GET /api/conversations`, `POST /api/conversations`, `GET|POST /api/conversations/:id/messages`. Conversation participants are checked before messages are read or sent.
- `POST /api/products/:id/reviews`: requires a delivered order containing that product; one review per order/product.
- `GET /api/products/:id/reviews`.
- `GET /api/notifications`.
- `GET /api/sellers/:username`: store profile, verified status, active products, followers and rating summary.
- `POST /api/live/:id/pin` and `GET /api/live/:id/pinned-product`: the live session owner can pin only their own active products while the session is LIVE.
- Product image URL is returned from product and feed APIs through `products.image_url`.

All authenticated routes use the existing `JWT_SECRET2` and active-user lookup. This change does not introduce a second authentication system.

## Database migration

Review and apply `server/migrations/003_commerce_foundation.sql` only to the intended SOKORA Neon project/branch, after database connectivity is restored and confirmed. It is additive (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) and does not drop tables or delete rows. Do not paste connection strings or passwords into GitHub.

## Important production boundaries

- Mobile-money checkout, escrow, refunds, push notifications, Cloudflare Stream upload/transcoding, moderation AI, 2FA, creator payouts, QR generation and multi-country tax support are not enabled by this change. They need provider credentials, additional policy/schema work, and end-to-end verification.
- `GET /api/health` must report `database: connected` before database-backed features can work. The previously observed `database: unavailable` means deploy alone will not fix the Neon/Hyperdrive connection.
- CI/build and a live API/database test must pass before this feature is treated as production-ready.
