# SOKORA API

Initial Node.js/Express API for the SOKORA Expo client.

## Current endpoints
- `GET /health` — API and database connection status.
- `GET /api/feed?limit=10&cursor=<timestamp>` — public published video/product feed.
- `GET /api/products/:id` — active product details.

## Local setup
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Put the verified Neon pooled connection string in `DATABASE_URL`; never commit it.
4. Install dependencies with `npm install` from this directory.
5. Start with `npm run dev`.
6. Check `GET /health`.

## Database migration
Review `migrations/001_marketplace.sql` and apply it only to the confirmed SOKORA Neon project and branch. It has not been applied automatically.

## Not implemented yet
Authentication/session verification, authenticated write routes, upload signing/media storage, likes/comments/follows endpoints, moderation, and live-stream provider integration. Do not expose write endpoints before authentication and ownership checks exist.
