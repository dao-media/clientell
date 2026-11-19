# ClienTell self-hosting guide

This guide takes you from an empty Cloudflare account to a fully working, self-hosted copy of ClienTell: admin console, client portal, briefs, contracts with e-signatures and PDF export, and outbound email. It also covers the optional **portfolio sandbox**, a public demo with sample data.

Read **Before you start** first. Most setup problems come from one of those points.

---

## Before you start: what you need and what to know

### Accounts and tools

| Need | Why | Cost |
|---|---|---|
| Cloudflare account | Hosting (Pages), database (D1), file storage (R2), email | Free tier covers hosting, D1 and R2 at small scale. **Email Sending needs Workers Paid ($5/mo).** The sandbox's Durable Objects also need Workers Paid. |
| A domain on Cloudflare | Custom URL (e.g. `clients.yourstudio.com`) and a verified email sender | Your domain registration |
| Node.js **22.12+** | Wrangler and local D1 need it. The repo pins `22.12.0` via [Volta](https://volta.sh). | Free |
| Git | Cloning the repo | Free |

### Things that catch people out

1. **Every `npm run …` script calls `volta run node`.** Install Volta (`curl https://get.volta.sh | bash`), or replace `volta run node` with `node` in `package.json` if you manage Node another way.
2. **The repo's `wrangler.jsonc` points at the original owner's Cloudflare resources** (account ID, D1 `database_id`, R2 bucket, domain). You **must** replace them with your own (Step 3). Deploying without that fails, or targets resources you don't own.
3. **The first visitor to a fresh install can claim the admin account.** Onboarding (`/setup`) is open until an admin profile exists. Set `ADMIN_PASSWORD` *before* your first deploy: on a real deployment it acts as a one-time **setup key** that `/setup` asks for. Then finish onboarding right away.
4. **Never recreate the production database** (`d1 create`) or change its `database_id` once you have real data. Schema changes only go through the migration files in `drizzle/migrations/`. `db:push` is disabled on purpose because it can drop tables.
5. **Email is optional for a working app, but clients can't receive briefs without it.** Without email credentials, sends are *simulated*: the message is logged and the brief is still marked as sent. You can copy the PIN from the admin screen and share it yourself.
6. **Emails and contracts use your admin profile.** Your name, business and email fill email greetings, sign-offs and help lines, the sender name ("Your Studio via ClienTell") and contract Designer fields. Until onboarding is finished they fall back to the original author's details, so onboard before you send anything.
7. **Local dev serves HTTPS with a self-signed certificate.** Your browser warns once; accept it. If an embedded preview browser refuses the certificate, run `CLIENTELL_HTTP=1 npm run dev` for plain HTTP.

---

## Step 1: Get the code

```bash
git clone <your-fork-url> clientell
```

```bash
cd clientell
```

```bash
npm install
```

---

## Step 2: Log in to Cloudflare from the terminal

```bash
npx wrangler login
```

```bash
npx wrangler whoami
```

Note the **Account ID** that `whoami` prints. You need it in Steps 3 and 6.

---

## Step 3: Create your own Cloudflare resources and point the config at them

### 3a. Database (D1)

```bash
npx wrangler d1 create briefly-db
```

Copy the printed `database_id`.

### 3b. File storage (R2)

R2 stores brief attachments and signed contract PDFs.

```bash
npx wrangler r2 bucket create clientell-uploads
```

### 3c. Edit `wrangler.jsonc`

Replace every value that belongs to the original owner:

```jsonc
{
	"name": "briefly",                       // Pages project name; rename if you like
	"vars": {
		"PUBLIC_ORIGIN": "https://clients.yourstudio.com", // the URL clients will use
		"EMAIL_FROM": "studio@yourstudio.com",            // verified sender (Step 6)
		"CLOUDFLARE_ACCOUNT_ID": "<your account id>"
	},
	"d1_databases": [
		{
			"binding": "DB",
			"database_name": "briefly-db",
			"database_id": "<your database_id from 3a>",
			"migrations_dir": "drizzle/migrations"
		}
	],
	"r2_buckets": [{ "binding": "UPLOADS", "bucket_name": "clientell-uploads" }]
}
```

If you rename the Pages project, also change `--project-name=briefly` in `scripts/deploy.mjs`, and the database name in `package.json` → `db:migrate:remote` and in `scripts/ensure-local-db.mjs` if you renamed it.

Also replace the hardcoded production URL in `src/lib/server/config.ts` (`PRODUCTION_ORIGIN`) and the canonical/social URLs in `src/routes/+layout.svelte`.

---

## Step 4: Run it locally

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Local value |
|---|---|
| `ADMIN_PASSWORD` | Any value. It's the setup key for `/setup`, and the admin password until onboarding is done. |
| `SESSION_SECRET` | A long random string: `openssl rand -base64 48` |
| `PUBLIC_ORIGIN` | `https://localhost:5173` |
| `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`, `CLOUDFLARE_ACCOUNT_ID`, `EMAIL_API_TOKEN` | Leave the email token blank locally. Sends are logged to the terminal instead. |

```bash
npm run dev
```

`npm run dev` applies any pending migrations to the **local** D1 copy first (stored under `.wrangler/state`), then starts Vite on https://localhost:5173.

### Onboard yourself

1. Open the site. The splash shows **Setup admin account** and **Sign in as user**.
2. Choose **Setup admin account**. Enter the setup key (your `ADMIN_PASSWORD`), then your name, email, phone, business / brand / DBA, website and social links. Use **+ Add link** for each one.
3. Choose your admin password (at least 8 characters).
4. You return to the admin sign-in, and the splash now says **Sign in as admin**. From then on your new password is the admin password, and `ADMIN_PASSWORD` stops working for login.

Your onboarding details fill the Designer fields in every contract: `{{designer_display}}`, `{{designer_short}}`, `{{designer_name}}`, `{{designer_email}}`, `{{designer_phone}}`, `{{designer_website}}` and `{{designer_social_links}}`. Edit them any time under **Admin → Manage → Profile**.

> **Already had clauses before this version?** Clause text is copied into the database the first time it's seeded. The new "Designer contact" line on the SOW only appears for new installs. To add it to an existing install, edit Exhibit A under **Admin → Manage → Clauses** and add: `Designer contact: {{designer_display}} / {{designer_email}} / {{designer_phone}} / {{designer_website}}`.

---

## Step 5: Deploy to Cloudflare Pages

### 5a. Set production secrets before the first deploy

Create the Pages project and set secrets. The first deploy creates the project if it doesn't exist.

```bash
npx wrangler pages project create briefly --production-branch=main
```

```bash
npx wrangler pages secret put ADMIN_PASSWORD --project-name=briefly
```

```bash
npx wrangler pages secret put SESSION_SECRET --project-name=briefly
```

Use a fresh random `SESSION_SECRET` in production (`openssl rand -base64 48`). Changing it later signs everyone out.

### 5b. Deploy

```bash
npm run deploy
```

This applies **pending** D1 migrations to production (additive only, so existing rows stay), builds, and uploads to Pages.

### 5c. Finish onboarding immediately

Open the deployed URL and complete **Setup admin account** with the setup key. Until you do, `/setup` is the only thing between a stranger and your admin console.

### 5d. Custom domain

**Workers & Pages → briefly → Custom domains → Set up a custom domain** → enter e.g. `clients.yourstudio.com`. If the domain's zone is on the same Cloudflare account, the DNS record is created for you. SSL takes 2–15 minutes. Make sure `PUBLIC_ORIGIN` matches this URL exactly, because invitation links and PIN emails use it.

---

## Step 6: Wire up email (Cloudflare Email Sending)

ClienTell sends brief invitations, reminders, Forgot PIN codes, submission notices and contract packets. It uses the **Cloudflare Email Sending REST API**. Pages can't use the Workers `send_email` binding, so the REST API is the supported path.

1. **Upgrade to Workers Paid** (Email Sending requires it).
2. **Dashboard → Email → Email Sending → Onboard domain.** Pick your domain and let Cloudflare add the SPF/DKIM/DMARC records. Wait until it shows **Verified**.
3. **Create an API token:** **My Profile → API Tokens → Create token → Custom**. Grant **Account → Email Sending → Edit**, scoped to your account.
4. **Configure the app:**
   - `EMAIL_FROM` (in `wrangler.jsonc` vars): an address on the verified domain, e.g. `studio@yourstudio.com`.
   - `CLOUDFLARE_ACCOUNT_ID` (in `wrangler.jsonc` vars): your account ID.
   - `EMAIL_API_TOKEN` (secret):

     ```bash
     npx wrangler pages secret put EMAIL_API_TOKEN --project-name=briefly
     ```

   - `ADMIN_NOTIFICATION_EMAIL` (secret or var, optional): where "brief submitted" notices go. Defaults to your admin profile email, then `EMAIL_FROM`.
5. Redeploy: `npm run deploy`.

**Test it:** create a client with your own email, send a brief, and check your inbox. If the token is wrong, the admin screen shows "Email API token is invalid or missing Email Sending permission." `CLOUDFLARE_API_TOKEN` also works as a fallback token name.

---

## Step 7: Security features you should know about

| Feature | How it works |
|---|---|
| **Client PIN lockout** | 3 wrong PINs → 30-minute lockout (even the correct PIN is refused). After it ends, 3 more wrong PINs within **24 hours** → the account is **locked** until an admin unlocks it. Once 24 hours pass without that, the counter starts over. Forgot PIN won't issue a new PIN while an account is locked or cooling down. |
| **Lock / Unlock** | **Admin → Clients**: every client card has a lock switch. Locking signs the client out immediately. Unlocking asks **"Force a PIN reset?" No / Yes**. *Yes* makes the client choose a new PIN on their next sign-in. *No* just unlocks. |
| **Admin password** | Hashed (PBKDF2-SHA256) in the `admin_profile` table. Change it under **Profile** (needs the current password). |
| **"Keep me logged in"** | Today / 7 days / 2 weeks / until logout. Session cookies are HMAC-signed with `SESSION_SECRET`. |
| **Client profile** | Clients can fix their company name, legal name, contact name, email (also their sign-in) and phone under **Profile** in the portal. |

**Forgot your admin password?** Run this against your database (local: add `--local`; production: `--remote`), then sign in with `ADMIN_PASSWORD` and use `/setup` again:

```bash
npx wrangler d1 execute briefly-db --remote --command "DELETE FROM admin_profile"
```

This only removes the login profile. Clients, briefs and contracts are untouched.

---

## Step 8: Day-to-day operations

| Task | Command |
|---|---|
| Local dev | `npm run dev` |
| Deploy (with pending migrations) | `npm run deploy` |
| Apply migrations only | `npm run db:migrate:remote` |
| After editing `src/lib/server/db/schema.ts` | `npm run db:generate`, review the new SQL in `drizzle/migrations/`, then deploy |
| Typecheck | `npm run check` |
| Back up production data | `npx wrangler d1 export briefly-db --remote --output backup.sql` |

---

## Optional: the portfolio sandbox

The sandbox is a public, explorable demo. It runs the **same code** with `SANDBOX_MODE=1` and is deployed as a separate Cloudflare Worker with **no D1 binding**, so it can never touch real data.

**How it behaves**

- Every visitor gets a **private SQLite database** (a Cloudflare Durable Object), seeded with 10 sample brands (Apple, Figma, Nike, Spotify, Airbnb, Stripe, Notion, Patagonia, LEGO, Duolingo). Their briefs are at different stages of completion, and five of them have contracts. Contacts are made up and use `.example` addresses.
- Visitors set up their own admin account through the normal onboarding. **Sign in as user** logs in as the Figma demo contact (credentials are shown on the sign-in panel).
- **Nothing is ever sent.** Email is blocked on the server, and reminder / resend / portal-link buttons are disabled with a tooltip explaining why. "Send brief" and "Send to client" still work, marking the item as sent without emailing anyone. File uploads are off.
- **Persistence follows "Keep me logged in":** *Today* keeps the sandbox only for the browser session (the server copy is deleted after 24 hours idle). A longer choice keeps it for that long, up to 30 days, so visitors can pick up where they left off. The banner's **Start over** button wipes it immediately.

**Where it lives:** `https://sandbox.daneoleary.com/clientell`. The sandbox is built with the base path `/clientell` (`CLIENTELL_BASE_PATH`, set by the sandbox scripts) and attached to two Worker routes on `sandbox.daneoleary.com`. Other demos can share the host on their own paths later (for example `sandbox.daneoleary.com/<other-app>`), each as its own Worker with its own routes. Cookies are scoped to the base path, so sandboxes on one host never share sessions. Sessions are also stamped "sandbox" or "main", so a sandbox login is never accepted by the real app, even with the same secret.

**Deploy it** (requires Workers Paid for Durable Objects):

1. **DNS for the host (one time).** Routes only run on proxied hostnames. In **daneoleary.com → DNS**, add a record for `sandbox`:
   - Type `AAAA`, Name `sandbox`, IPv6 `100::`, **Proxied** (orange cloud).

   It's a placeholder target; the Worker routes answer the requests. Paths outside `/clientell` return Cloudflare's default error until you add a landing page or another sandbox.
2. Create the sandbox's upload bucket:

   ```bash
   npx wrangler r2 bucket create clientell-sandbox-uploads
   ```

3. Check `wrangler.sandbox.jsonc`. `PUBLIC_ORIGIN` is the host only (`https://sandbox.daneoleary.com`), because the app adds `/clientell` itself. `routes` must list both `sandbox.daneoleary.com/clientell` and `sandbox.daneoleary.com/clientell/*` on zone `daneoleary.com`.
4. Set a session secret for the sandbox worker. Use a different one from production.

   ```bash
   npx wrangler secret put SESSION_SECRET -c wrangler.sandbox.jsonc
   ```

5. Deploy the store worker, then the sandbox app:

   ```bash
   npm run sandbox:deploy
   ```

6. Open `https://sandbox.daneoleary.com/clientell` and link it from your portfolio.

**Using a different URL:** change the `routes` and `PUBLIC_ORIGIN` in `wrangler.sandbox.jsonc`, and set `CLIENTELL_BASE_PATH` (for example `/demo`, or an empty string to serve at a domain root) when running the sandbox scripts.

**Run it locally:**

```bash
npm run sandbox:dev
```

This starts the store worker (port 8799) and the app together at `http://localhost:5173/clientell` (add `CLIENTELL_HTTP=1` for plain HTTP). When you change the seed data in `src/lib/server/sandbox/seed.ts`, bump `SEED_VERSION` so existing visitor sandboxes rebuild.

---

## Environment variable reference

| Name | Where | Required | Purpose |
|---|---|---|---|
| `SESSION_SECRET` | Secret | **Yes** | Signs login cookies |
| `ADMIN_PASSWORD` | Secret | **Yes** (before onboarding) | One-time setup key for `/setup`, and the admin password until a profile exists |
| `PUBLIC_ORIGIN` | Var | **Yes** | Absolute URL used in emails and links |
| `EMAIL_FROM` | Var | For email | Verified sender address |
| `CLOUDFLARE_ACCOUNT_ID` | Var | For email | Email Sending API account |
| `EMAIL_API_TOKEN` | Secret | For email | Token with Email Sending → Edit |
| `ADMIN_NOTIFICATION_EMAIL` | Var/Secret | No | Where submission notices go (default: admin profile email) |
| `SANDBOX_MODE` | Var | Sandbox only | `1` enables sandbox behavior (set in `wrangler.sandbox.jsonc`) |
| `CLIENTELL_HTTP` | Shell | No | `1` = plain-HTTP dev server |
| `CLIENTELL_WRANGLER_CONFIG` | Shell | No | Alternate wrangler config (used by the sandbox scripts) |
| `CLIENTELL_BASE_PATH` | Shell | No | Serve under a sub-path, e.g. `/clientell` (sandbox default). Leave unset for a domain root. |
