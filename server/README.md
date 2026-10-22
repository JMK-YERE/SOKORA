# SOKORA API

Initial Node.js/Express API for the SOKORA Expo client.

## Current endpoints
- `GET /health` — API and database connection status.
- `GET /api/feed?limit=10&cursor=<timestamp>` — public published video/product feed.
- `GET /api/products/:id` — active product details.
- `POST /api/auth/register` — creates an account with a hashed password (requires `JWT_SECRET`).
- `POST /api/auth/login` — verifies credentials and issues a 7-day bearer token.
- `GET /api/auth/me` — validates the bearer token and returns the current active account.
- `GET /api/videos/:id/comments` — lists visible comments for a published video.
- `POST /api/videos/:id/comments` — adds a comment (Bearer token required).
- `POST /api/videos/:id/like` — toggles the current user's like (Bearer token required).
- `POST /api/sellers/:sellerId/follow` — toggles following a user (Bearer token required).
- `POST /api/videos/:id/save` — toggles a saved video (Bearer token required).
- `GET /api/me/saved-videos` — lists the current user's saved published videos (Bearer token required).
- `GET /api/sellers/:username` — returns a public seller profile and counts.

## Authentication setup
1. Set a strong, random `JWT_SECRET` in the API host environment. Do not use the example value in production.
2. Review and manually apply `migrations/002_auth.sql` to the intended SOKORA Neon database/branch before deploying the API changes.
3. Keep `DATABASE_URL` private. Use HTTPS and configure exact frontend origins in `CORS_ORIGINS`.

## Local setup
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Put the verified Neon pooled connection string in `DATABASE_URL`; never commit it.
4. Install dependencies with `npm install` from this directory.
5. Start with `npm run dev`.
6. Check `GET /health`.

## Database migration
Review `migrations/001_marketplace.sql` and apply it only to the confirmed SOKORA Neon project and branch. It has not been applied automatically.

## Still not implemented: product/video creation endpoints, secure upload signing and media storage, seller profile editing, inbox/messaging, moderation workflows, order/checkout, and live-stream provider integration. The social write endpoints require the marketplace tables from `001_marketplace.sql` and the auth column from `002_auth.sql`; verify both migrations were applied to the intended Neon database before use. Do not expose write endpoints before authentication and ownership checks exist.
