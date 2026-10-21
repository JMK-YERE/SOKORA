# SOKORA — Architecture Notes

## What exists today
- `App.js`: Expo / React Native starter screen for mobile.
- `package.json`: Expo dependencies plus a web export script.
- `.github/workflows/expo-web-build.yml`: CI workflow that installs dependencies, exports the Expo web build, and uploads `dist/`.
- `.gitignore`: excludes dependencies, generated builds, Expo cache, and local environment files.
- The current UI is a prototype. Its sample listings and actions are not connected to a live database.

## Intended request flow
1. Browser or mobile app displays the client UI.
2. Client calls a protected server-side API.
3. API authenticates the user and checks ownership/roles.
4. API reads/writes PostgreSQL using server-side credentials.
5. Media uploads use a short-lived presigned URL to object storage; the API stores metadata and ownership in PostgreSQL.
6. Messaging and orders are recorded server-side with audit history.

## Security boundaries
- Never put `DATABASE_URL`, Neon secret keys, S3 secret keys, or provider API secrets in client-side Expo variables or committed source.
- Treat `EXPO_PUBLIC_*` values as public.
- Validate all inputs server-side, enforce seller ownership, and rate-limit login, search, messaging, and upload-signing endpoints.
- Do not use public-read storage for private documents or user messages.
- Do not connect production database writes until the correct project and branch have been confirmed.

## Suggested first domain entities (design only; not yet migrated)
- `users` / auth identity mapping
- `seller_profiles`
- `listings`
- `listing_media`
- `categories`
- `conversations` and `messages`
- `orders` and `order_events`
- `reports` and `moderation_actions`
- `audit_events`

Before implementing these entities, inspect the existing Neon schema and reuse existing tables where suitable. This document does not authorize or imply a database migration.
