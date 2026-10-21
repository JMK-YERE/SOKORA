# SOKORA — Architecture Notes

## Current state
The repository uses Expo + React Native and supports Expo Web. `App.js` now contains a mobile-first short-video feed UI, demo product posts, local-state likes/follows/saves/comments, sample search, LIVE preview dialogs, and native share. These are not yet connected to an API. Sample posts are hard-coded and local changes do not persist across devices.

## Proposed components

### Client
- Expo + React Native for Android and cross-platform UI.
- Expo Web for a browser experience.
- Screens/components: vertical feed, product details, seller profile, upload, live room, inbox, account, and moderation/report flows.
- Client state is presentation only; server owns identities, permissions, moderation, persistence, and authoritative counters.

### API/application service (not implemented yet)
Responsibilities:
- Verify authentication/session tokens.
- Seller/product CRUD and ownership checks.
- Feed pagination and discovery.
- Likes, follows, comments, saves, reports, and notifications.
- Video upload authorization, media processing status, and live-session coordination.
- Input validation, rate limiting, audit events, and safe public response shaping.

The backend framework is not finalized. Avoid creating a second authentication system or exposing database credentials to the app.

### Database
Neon PostgreSQL is intended, pending confirmation of the correct project and branch. Proposed entities:
- `users`, `seller_profiles`
- `products`, `product_categories`
- `videos`, `video_assets`
- `follows`, `video_likes`, `comments`, `saved_videos`
- `live_sessions`, `live_viewers` or provider references
- `reports`, `moderation_actions`, `notifications`, `audit_events`

Use foreign keys, unique constraints (one like per user/video), timestamps, indexes for feed ordering, and explicit visibility/moderation states. Use versioned migrations and review existing data before applying them.

### Media storage and delivery
Store video bytes and thumbnails in object storage/CDN, not PostgreSQL. Provider is not selected yet. Uploads should use server-issued short-lived signed URLs, file validation, asynchronous transcoding, thumbnail generation, and adaptive playback. Unreviewed uploads must not automatically become public.

### Live streaming
Live media is separate infrastructure. Store provider session IDs and lifecycle metadata in the API/database; use a streaming provider for real-time audio/video. Compare cost, Tanzania latency, recording policy, moderation tools, and usage limits before selection. Keep provider credentials on the server.

## Proposed API surface (design only)
- `GET /feed?cursor=...`
- `GET /videos/:id`
- `POST /videos/upload-intent`
- `POST /videos` and `DELETE /videos/:id`
- `POST /videos/:id/likes`, `DELETE /videos/:id/likes`
- `GET /videos/:id/comments`, `POST /videos/:id/comments`
- `POST /users/:id/follow`, `DELETE /users/:id/follow`
- `GET /users/:id/profile`
- `POST /reports`
- `POST /live-sessions`, `POST /live-sessions/:id/end`, `GET /live-sessions/active`

These endpoints are proposals, not implemented services.

## Security and trust
- Public browsing may be anonymous; write actions require a verified account.
- Enforce ownership and roles in the API, not only the client.
- Rate-limit login, comments, uploads, live creation, and reports.
- Validate media type, size, duration, and content; process uploads before publication.
- Provide block/report/moderation workflows and clear community standards.
- Use least-privilege DB credentials and hosting environment variables for secrets.
- Expose only fields needed for public seller/product pages.

## Status summary
- Implemented: feed UI, sample posts, local demo interactions, sample search, and comment modal.
- UI-only: LIVE indicators/room preview, upload entry, and download affordance.
- Not implemented: API, persistent database access, authentication, media storage/transcoding, real live streaming, production notifications, payments, or orders.
