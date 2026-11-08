# HR Global Admin

Secure content manager for the HR Global Express public website. It edits all
website text and repeatable lists, uploads images to Google Drive, and stores the
published content as `site-content.json` in the configured Drive folder.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Fill in the admin login and Google service-account values.
3. Share the configured Google Drive folder with the service-account email as an
   **Editor**.
4. Run `npm install`, then `npm run dev`.

## Vercel environment variables

Set these for Production, Preview, and Development:

- `ADMIN_EMAIL` — the fixed admin login email.
- `ADMIN_PASSWORD` — the fixed admin login password.
- `AUTH_SECRET` — a random value of at least 32 characters.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the Google service-account email.
- `GOOGLE_PRIVATE_KEY` — the complete private key, including BEGIN/END lines.
- `GOOGLE_DRIVE_FOLDER_ID` — `1T_6jqh8saDWKZHUUeLYuAbJ6sb3nG7AN`.
- `NEXT_PUBLIC_WEBSITE_URL` — the public HR Global Express Vercel URL (optional).

The public website also needs `CONTENT_API_URL` set to this admin project's
production URL. Content changes are visible there within roughly one minute.

## Security

The login password, session secret, and Google private key are never committed
to Git. Authentication uses an HTTP-only, secure, same-site cookie. Save and
upload endpoints require a valid signed session.

## Production checks

```bash
npm run typecheck
npm run build
```
