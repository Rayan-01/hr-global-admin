# HR Global Admin

Secure content manager for the HR Global Express public website. It edits all
website text and repeatable lists, uploads images to GitHub, and stores the
published content as `content/site-content.json` in the public website repository.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Fill in the admin login and GitHub repository values.
3. Create a fine-grained GitHub token with **Contents: Read and write** access
   only to the `hrglobalexpress` repository.
4. Run `npm install`, then `npm run dev`.

## Vercel environment variables

Set these for Production, Preview, and Development:

- `ADMIN_EMAIL` — the fixed admin login email.
- `ADMIN_PASSWORD` — the fixed admin login password.
- `AUTH_SECRET` — a random value of at least 32 characters.
- `GITHUB_TOKEN` — a fine-grained token with repository Contents read/write access.
- `GITHUB_OWNER` — `Rayan-01`.
- `GITHUB_REPO` — `hrglobalexpress`.
- `GITHUB_BRANCH` — `main`.
- `NEXT_PUBLIC_WEBSITE_URL` — the public HR Global Express Vercel URL (optional).

The public website also needs `CONTENT_API_URL` set to this admin project's
production URL. Content changes are visible there within roughly one minute.

## Security

The login password, session secret, and GitHub token are never committed
to Git. Authentication uses an HTTP-only, secure, same-site cookie. Save and
upload endpoints require a valid signed session.

## Production checks

```bash
npm run typecheck
npm run build
```
