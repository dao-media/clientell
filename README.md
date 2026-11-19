# ClienTell

Two-sided client intake for **Dane O'Leary Media**: you configure question sets and assignments in the admin console; clients answer via a browser portal using their primary contact email and a 6-digit PIN.

**Production URL:** [https://clientell.daneoleary.com](https://clientell.daneoleary.com)

> **Self-hosting your own copy?** Follow [SETUP.md](SETUP.md). It covers Cloudflare resources, secrets, email, admin onboarding, security features and the optional portfolio sandbox.

## Stack

- [SvelteKit](https://kit.svelte.dev/) + [Tailwind CSS v4](https://tailwindcss.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/) + [D1](https://developers.cloudflare.com/d1/)
- [Drizzle ORM](https://orm.drizzle.team/)

## Requirements

- Node.js **22.12+** (see `volta` in `package.json`)
- Cloudflare account with **daneoleary.com** on the same account

## Setup

```sh
npm install
cp .env.example .env
```

Apply the local D1 schema:

```sh
npm run db:migrate:local
```

Start the dev server:

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Default admin login

- URL: `/admin/login`
- Password: value of `ADMIN_PASSWORD` in `.env` (default `briefly`)

## Workflow

1. **Admin → Clients** — add a client and primary contact email.
2. **Admin → Question sets** — create a set and add questions.
3. **Admin → New assignment** — assign a set to a client; copy the generated PIN.
4. **Client → Portal** — sign in with email + PIN, answer questions (autosave), submit.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run preview` | Preview Cloudflare build locally |
| `npm run deploy` | Apply pending remote migrations, build, and deploy to Cloudflare Pages |
| `npm run db:migrate:local` | Apply pending D1 migrations locally (safe; keeps existing rows) |
| `npm run db:migrate:remote` | Apply pending D1 migrations to Cloudflare (safe; keeps existing rows) |
| `npm run db:generate` | Generate a new SQL migration after editing `schema.ts` |

`npm run deploy` and `npm run db:migrate:*` only run **new** migration files (typically `ALTER TABLE … ADD COLUMN`). They do not wipe questions, categories, clients, or submissions. **`db:push` is disabled** by default because it can drop data — use `db:generate` + migrations instead.

## Deploy to clientell.daneoleary.com

### 1. Create the D1 database

```sh
node ./node_modules/wrangler/bin/wrangler.js d1 create briefly-db
```

Copy the returned `database_id` into `wrangler.jsonc` (replace the placeholder UUID).

### 2. Run remote migrations

Update `.env` with your Cloudflare account credentials, then:

```sh
npm run db:migrate:remote
```

### 3. Create the Pages project and deploy

```sh
npm run deploy
```

### 4. Set production secrets

In the [Cloudflare dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **briefly** → **Settings** → **Environment variables**, add:

| Variable | Type | Example |
|----------|------|---------|
| `ADMIN_PASSWORD` | Secret | strong password |
| `SESSION_SECRET` | Secret | long random string |
| `PUBLIC_ORIGIN` | Plain text | `https://clientell.daneoleary.com` |

`PUBLIC_ORIGIN` is also set in `wrangler.jsonc` for Wrangler deploys.

### 5. Attach the custom domain

In the dashboard: **Workers & Pages** → **briefly** → **Custom domains** → **Set up a custom domain** → enter `clientell.daneoleary.com`.

Cloudflare will create the DNS record automatically when the zone is on the same account. SSL is provisioned automatically (usually within a few minutes).

### 6. Verify

- [https://clientell.daneoleary.com](https://clientell.daneoleary.com) — landing page
- [https://clientell.daneoleary.com/admin/login](https://clientell.daneoleary.com/admin/login) — admin
- [https://clientell.daneoleary.com/portal](https://clientell.daneoleary.com/portal) — client portal

Assignment creation in admin will show the full `https://clientell.daneoleary.com/portal` link to share with clients.

## Recreate scaffold

```sh
npx sv@0.16.1 create --template minimal --types ts --add tailwindcss="plugins:none" prettier sveltekit-adapter="adapter:cloudflare+cfTarget:pages" drizzle="database:d1" --install npm .
```
