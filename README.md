# ElimuSmartSystem

A school-management platform concept for Tanzanian primary and secondary schools (Primary to Form 6).

## Current milestone: Phase 1 UI foundation

The React/Vite frontend now presents:
- Public ElimuSmart landing page with school-management feature descriptions.
- Responsive school dashboard layout and role-preview selector for eight planned user roles.
- Navigation for students, academics/results, attendance, teachers/classes, fees, transport, boarding/hostels, announcements, reports and settings.
- Clearly marked illustrative sample data and UI-only forms so demo behavior is not mistaken for production functionality.
- White and dark-navy visual design, with responsive desktop and mobile layouts.

## Important implementation status

**This is a frontend preview, not a production school-management system.** Authentication, school registration persistence, real student records, role enforcement, PostgreSQL school schema, SMS delivery, payments, PDF/Excel exports, and GPS tracking are not implemented by this UI-only milestone.

The existing SOKORA marketplace API, marketplace migrations and Cloudflare Worker were intentionally left unchanged in this branch. Do not apply the old marketplace SQL migrations to a school database, and do not connect real school data until a separate school schema and secure API have been reviewed.

## Next phases

1. Inspect and design a new multi-school PostgreSQL schema without modifying or deleting existing Neon data.
2. Implement secure authentication and school-level tenant isolation.
3. Add students, guardians, staff, classes, academic years and subject assignments.
4. Add examinations, configurable grading, attendance and report cards.
5. Add fees and receipts, parent access, announcements and optional SMS provider integration.
6. Add transport, boarding and optional external-hostel management.
7. Test authorization, tenant isolation, data backups, mobile layouts and production deployment.

## Development

```sh
npm install
npm run dev
npm run build
```

Never place database passwords, JWT secrets, SMS credentials or other secrets in frontend code or commit them to the repository.
