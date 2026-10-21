# SOKORA — Development Roadmap

## Product direction
SOKORA is a Tanzania-focused marketplace concept combining product discovery, local businesses, and short-form product videos. The current repository contains an Expo / React Native UI foundation. It is not yet a complete marketplace.

## Current milestone
- Expo + React Native app shell.
- Swahili-first home screen and category navigation.
- Expo web export command: `npm run build:web`.
- GitHub Actions workflow at `.github/workflows/expo-web-build.yml` to install dependencies, export the web build, and retain the `dist/` artifact.
- The current web preview uses illustrative sample products only. No real seller data, account, messaging, order, or payment functionality is connected yet.

## Recommended implementation sequence

### Milestone 1 — Build and UI quality
1. Confirm the Expo web build in GitHub Actions.
2. Run Android and web smoke tests.
3. Establish responsive design tokens and reusable UI components.
4. Replace placeholder actions with accessible navigation and clear empty/loading/error states.

### Milestone 2 — Inspect and connect Neon safely
1. Confirm the intended Neon project and production branch before any change.
2. Inspect existing databases, tables, roles, permissions, and current data.
3. Document the existing schema; do not recreate existing tables or add a second authentication system without a reviewed design.
4. Use migrations and test against a separate development branch first.
5. Store credentials only in hosting environment variables or a secrets manager; never commit them.

### Milestone 3 — Accounts and seller profiles
- Choose one authentication system after inspecting current Neon setup.
- Add customer and seller profiles, verified contact details, sessions, role checks, and account recovery.
- Enforce authorization on the server, not only by hiding UI elements.
- Add privacy controls and account deletion/export workflows.

### Milestone 4 — Listings, search, and media
- Product/service listing CRUD with title, description, price, category, location, availability, and seller ownership.
- Search and filtering by category, region, price, and recency.
- Upload images/video to object storage using short-lived presigned URLs; validate file size/type and keep private media private by default.
- Store metadata in PostgreSQL, not binary media blobs.
- Add reporting, moderation, and abuse prevention before public user-generated uploads.

### Milestone 5 — Messaging and transactions
- Buyer-to-seller messaging with authorization and rate limits.
- Orders and order status history only after the business rules are agreed.
- Integrate Tanzanian payment providers only after merchant onboarding, callback verification, reconciliation, and refund flows are designed.
- Do not represent an order or payment as complete until the provider confirms it.

### Milestone 6 — Reliability and launch readiness
- Audit logs for sensitive seller/admin actions.
- Database backups and tested restore procedure.
- Rate limiting, input validation, secure headers, dependency updates, and error monitoring.
- Automated tests for auth, listings, uploads, messaging, and authorization boundaries.
- Verify mobile responsiveness, accessibility, and slow-network behavior.
- Publish a privacy policy, terms, prohibited-items rules, seller standards, and support contact.

## Proposed technical shape
- **Client:** Expo + React Native; React Native Web for the browser experience.
- **Data:** Existing Neon PostgreSQL project, after inspection.
- **Media:** Neon Object Storage or another confirmed S3-compatible provider, with private-by-default access and presigned uploads.
- **API:** A server-side API layer for authorization and business logic. The client must never receive database owner credentials.
- **Hosting:** Static hosting for the exported web client; an API service/function separately when the backend exists.
- **CI:** GitHub Actions for install/build checks and artifacts; add unit/integration tests as features arrive.

## Current blockers / risks
- Render's current SOKORA Go service does not match the Expo source code.
- The new Render static-site build was blocked because the workspace had exhausted its build-pipeline minutes for the billing period; this is not evidence that the source build itself passed or failed.
- The Neon connector was scoped to project `fragrant-mud-65041570`, while the intended project ID provided for SOKORA is `wild-leaf-93545275`. Do not modify a database until the connection is corrected and the project/branch are verified.
- No end-to-end database, auth, media, messaging, order, or payment test has passed yet.

## Definition of done for a milestone
A milestone is complete only when its code is committed, the build/test output is captured, the relevant flows are tested, security boundaries are checked, and any hosting deployment reports a successful status. A visual preview alone is not a production deployment.
