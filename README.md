# Explore More Academy LLC — Full-Stack Platform

**Learn Wild. Live Big.**

Production-quality education and adventure platform for [Explore More Academy LLC](https://www.exploremoreacademy.com), including public marketing site, e-commerce, student/parent portals, and custom admin CMS.

## Prerequisites

- **Node.js** 20+ and npm
- **MongoDB** 6+ (local or Atlas)
- **MongoDB Compass** (recommended for database inspection)
- **SMTP** credentials for email (optional for development)
- **Stripe** account for payments (optional for development)

## Installation

```bash
# Clone and enter the project
cd "explore ore"

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values (see below)
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Public URL (e.g. `http://localhost:3000`) |
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SECRET` | Random 32+ character secret for sessions |
| `AUTH_URL` | Same as app URL |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Initial admin credentials for seeding |
| `SMTP_*` | Email server configuration |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `CRON_SECRET` | Protects `/api/email/process` endpoint |
| `RESET_DB` | Set to `true` for destructive reseed |

## MongoDB Setup

1. Install MongoDB locally or create a free Atlas cluster
2. Start MongoDB: `mongod` (or use Atlas connection string)
3. Set `MONGODB_URI` in `.env.local`:
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/explore-more-academy
   ```

### MongoDB Compass

1. Open MongoDB Compass
2. Connect using the same URI as `MONGODB_URI`
3. Browse collections: `users`, `events`, `courses`, `orders`, etc.

## Seeding

```bash
# Seed database with initial content
npm run seed

# Destructive reseed (drops existing data)
RESET_DB=true npm run seed
```

This creates:
- Company settings and brand content
- Six core programs
- Page records with editable sections
- FAQ categories and starter FAQs
- Draft book, course, and donation campaigns
- Archived 2025 events (not shown as upcoming)
- Initial administrator account

**Default admin:** Use `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env.local`.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Tailwind CSS v4

This project uses **Tailwind CSS v4** with:
- `@import "tailwindcss"` in `src/app/globals.css`
- `@tailwindcss/postcss` in `postcss.config.mjs`
- Brand tokens in `@theme` block

After Tailwind config changes, restart the dev server.

## Production Build

```bash
npm run build
npm start
```

## SMTP Configuration

Set in `.env.local`:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-user
SMTP_PASSWORD=your-password
SMTP_SENDER_EMAIL=chris@exploremoreacademy.com
SMTP_SENDER_NAME=Explore More Academy
SMTP_REPLY_TO=chris@exploremoreacademy.com
```

Emails are queued in MongoDB (`emailjobs` collection) and processed asynchronously.

### Email Queue Processing

Call periodically (cron job or task scheduler):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/email/process
```

## Stripe Configuration

1. Create a Stripe account and get API keys
2. Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Configure webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
4. Set `STRIPE_WEBHOOK_SECRET` from Stripe dashboard
5. Listen for `checkout.session.completed` events

**Without Stripe:** Orders and donations remain pending. Admins see a configuration warning. Manual order mode can be enabled in Settings.

## Public Uploads

Public images are stored in:

```
public/uploads/
  pages/  events/  books/  courses/  programs/
  gallery/  testimonials/  campaigns/  settings/
```

Upload via Admin → relevant content section, or `POST /api/upload/public` (admin only).

**Limits:** 5MB max, JPEG/PNG/WebP/GIF only. Safe filenames with UUID collision resistance.

## Private Storage

Private student files (results, certificates, documents) are stored in:

```
storage/private/
  results/
  certificates/
  documents/
```

**Never** place private files in `/public`. Access is via authenticated `/api/files/private/[...path]` endpoints only.

### Persistent Storage Requirements

In production, ensure these directories persist across deploys:
- `public/uploads/` — public CMS images
- `storage/private/` — student academic files

Use volume mounts, persistent disks, or object storage adapters for containerized deployments.

## Backup Procedures

1. **MongoDB:** `mongodump --uri="$MONGODB_URI" --out=./backup-$(date +%Y%m%d)`
2. **Uploads:** Copy `public/uploads/` and `storage/private/` to secure backup storage
3. **Environment:** Store `.env.local` secrets in a password manager (never in git)

## Admin Portal

Access at `/admin/login` with an administrator account.

### Key Workflows

| Task | Location |
|------|----------|
| Edit homepage sections | Admin → Pages → Home |
| Create events | Admin → Events → New |
| Publish courses | Admin → Courses |
| Manage orders | Admin → Orders |
| Publish results | Admin → Results |
| Create campaigns | Admin → Donation Campaigns |
| Replace logo | Admin → Settings |
| View registrations | Admin → Event Registrations |

## Student Records

- Results are private — visible only to assigned student, linked guardian, instructor, and admin
- Guardian linking requires admin approval via `GuardianStudentLink`
- Never expose student data on public pages without documented consent

## Content Verification

See [CONTENT_VERIFICATION.md](./CONTENT_VERIFICATION.md) for claims that must be confirmed before publication (statistics, certifications, testimonials, pricing, etc.).

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- MongoDB + Mongoose
- Auth.js (NextAuth v5)
- Stripe Checkout + Webhooks
- Nodemailer (SMTP)
- GSAP + Framer Motion + Lenis
- React Hook Form + Zod

## License

Proprietary — Explore More Academy LLC
