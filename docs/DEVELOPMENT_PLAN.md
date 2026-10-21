# SOKORA — Development Plan

## Product direction
SOKORA is a public, Tanzania-focused social-commerce marketplace inspired by short-video discovery apps. It should open into a vertical feed where people can discover products and services, then view the seller and product details. It is not a TikTok clone for entertainment only; commerce and trusted local sellers are the core.

## Current milestone: mobile feed foundation
Implemented in `App.js`:
- Dark mobile-first vertical feed with paging/snapping.
- Sample product posts, seller identity, location, and price.
- Local UI state for likes, follows, saved items, and comments.
- “Kwa ajili yako” and “Inafuatwa” tabs.
- Search over sample products, sellers, and locations.
- Live creator strip with preview-only join/start-live dialogs.
- Native share sheet using React Native `Share`.
- Bottom navigation and upload entry point.
- Demo labels so sample content is not confused with real listings.

**Limitations:** sample content is hard-coded and not persisted to a server. Real authentication, video upload/storage/playback, downloadable hosted videos, cross-device interactions, notifications, and live streaming are not connected yet. A button or dialog does not mean its backend capability exists.

## Milestones

### 1. Stabilize mobile and web UI
- Verify Expo Android and Expo Web builds.
- Test small screens, feed snapping, accessibility, and error states.
- Split screens/components as features grow; add lint and tests.
Acceptance: Android and web builds complete and the feed works without runtime errors.

### 2. Backend and database
- Confirm the intended Neon project and branch before any changes.
- Review existing tables and data before migrations; never drop production data.
- Version migrations for users, seller profiles, products, videos, follows, likes, comments, saved posts, reports, live sessions, and moderation events.
- Add an API layer; never expose database credentials or privileged tokens in the client.
Acceptance: health check passes, migrations are repeatable, and API authorization tests pass.

### 3. Accounts and seller profiles
- Sign-up, sign-in, recovery, profile editing, and seller/business profiles.
- Public browsing without login; login required for posting and social actions.
- Enforce ownership and permissions on the server for every write.
Acceptance: users can only edit their own profile and content.

### 4. Real video publishing
- Add a supported Expo video picker/camera workflow.
- Validate file type, size, duration, and upload progress.
- Use short-lived signed upload authorization to object storage.
- Generate thumbnails, transcode to mobile-friendly formats, and track processing status.
- Use adaptive playback; don't load large video files into memory.
- Enable downloads only where creator permissions and platform rules allow.
Acceptance: a seller uploads a video, publishes it, and another device can play it.

### 5. Social interactions
- Persistent likes, comments, follows, saves, share links, and notifications.
- Cursor-based feed pagination and duplicate prevention.
- Reporting, blocking, moderation, and rate limits.
Acceptance: interactions persist across devices and are authorized server-side.

### 6. Live shopping
- Select a live provider after checking cost, Tanzania availability, latency, moderation, and free-tier limits.
- Verify seller permissions before creating a stream.
- Track scheduled/live/ended/failed states, viewer join/leave, chat, pinned products, report/mute/block controls, and end-stream actions.
- Show LIVE badges only for real active sessions.
Acceptance: one device streams, another joins with audio/video, and a moderator can stop/report the stream.

### 7. Marketplace and trust
- Product/service listings, categories, location, price, availability, seller contact, and order workflow.
- Report scam/counterfeit listings, seller verification, moderation queue, audit events.
- Privacy policy, terms, community rules, copyright/takedown flow, and data deletion/export policy.
Acceptance: listings are searchable and reportable, with private user data excluded from public APIs.

### 8. Launch readiness
- CI builds for Android/web, automated tests, dependency/security checks.
- Error monitoring, backups, media cost alerts, and recovery plan.
- Test on affordable Android devices and slower mobile networks.
- Document secrets, deployment, smoke tests, and rollback.
Acceptance: release checks and recovery steps are verified.

## Engineering rules
1. Never describe a UI prototype as a live backend feature.
2. Never commit API keys, database URLs, or streaming secrets.
3. Do not change Neon production data until project, branch, and schema are verified.
4. Enforce authorization server-side and use signed upload URLs for private media.
5. Build reporting, moderation, privacy, and rate limits before opening public user-generated content at scale.
6. Video delivery and live streaming may incur costs as usage grows; verify pricing before selecting providers.
