# Deploy Briefly to briefly.daneoleary.com

The subdomain **will not appear in Cloudflare** until you complete the steps below. Nothing in the codebase creates DNS or domains automatically—you deploy the app first, then attach the subdomain.

**Time required:** ~20–30 minutes (plus up to 15 minutes for SSL).

---

## Before you start

Confirm these are true:

- [ ] You have a [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [ ] **daneoleary.com** is added as a site/zone in Cloudflare (**Websites** in the left sidebar)
- [ ] Node.js **22.12+** is installed (the project pins this via Volta)
- [ ] You are in the project folder:

```sh
cd "/Users/daneoleary/Documents/Work/Dane O'Leary Media/briefly"
```

If **daneoleary.com is not on Cloudflare**, add it first: **Websites → Add a site →** follow the prompts to point your registrar nameservers to Cloudflare. You cannot use the automatic subdomain setup until the zone exists on the same account.

---

## Step 1 — Log in to Cloudflare from your terminal

```sh
node ./node_modules/wrangler/bin/wrangler.js login
```

A browser window opens. Approve access for Wrangler.

Verify:

```sh
node ./node_modules/wrangler/bin/wrangler.js whoami
```

You should see your Cloudflare account email.

---

## Step 2 — Create the production database (D1)

```sh
node ./node_modules/wrangler/bin/wrangler.js d1 create briefly-db
```

The output includes a line like:

```text
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy that UUID.

Open `wrangler.jsonc` and replace the placeholder:

```jsonc
"database_id": "00000000-0000-0000-0000-000000000001"
```

with your real `database_id`. Save the file.

---

## Step 3 — Apply the database schema to Cloudflare

```sh
npm run db:migrate:remote
```

When prompted to confirm, answer **yes**.

You should see `0000_init.sql` marked ✅.

---

## Step 4 — Deploy Briefly to Cloudflare Pages

```sh
npm run deploy
```

This applies any **pending** D1 migrations to production (additive only — your existing rows stay), builds the app, and uploads it. The first run creates a Pages project named **briefly**.

**Do not wipe production data:** never re-run `d1 create briefly-db` or change `database_id` in `wrangler.jsonc` after you have real content. Do not use `db:push` (it is disabled in this repo). Schema changes should go through `npm run db:generate` and the migration files in `drizzle/migrations/`.

Note the deployment URL in the output (something like `https://briefly.pages.dev` or `https://xxxx.briefly.pages.dev`). The site should load there before the custom domain is attached.

---

## Step 5 — Set production environment variables

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Left sidebar → **Workers & Pages**
3. Click the **briefly** project
4. **Settings** tab → **Environment variables**
5. Under **Production**, add these variables:

| Variable name   | Type       | Value                              |
|-----------------|------------|------------------------------------|
| `ADMIN_PASSWORD`| **Secret** | A strong password (your admin login) |
| `SESSION_SECRET`| **Secret** | A long random string (32+ chars)   |
| `PUBLIC_ORIGIN` | Plain text | `https://briefly.daneoleary.com`   |

6. Click **Save**
7. **Redeploy** so the new variables take effect:

```sh
npm run deploy
```

---

## Step 6 — Attach the custom domain (this creates the subdomain)

You can use the dashboard **or** the CLI. Do one, not both.

### Option A — Dashboard (recommended)

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**
2. Click **briefly**
3. **Custom domains** tab (or **Domains & routes** in newer UI)
4. Click **Set up a custom domain** / **Add domain**
5. Enter: `briefly.daneoleary.com`
6. Click **Continue** / **Activate domain**

Cloudflare will attach the domain to your Pages project and, if **daneoleary.com** is on the same account, create the DNS record for you.

### Option B — Terminal

```sh
npm run domain:add
```

---

## Step 7 — Confirm DNS (where the subdomain actually shows up)

The subdomain appears under your **zone**, not under Workers & Pages alone.

1. Dashboard → **Websites**
2. Click **daneoleary.com**
3. **DNS** → **Records**

You should see a record like:

| Type  | Name    | Content                    | Proxy |
|-------|---------|----------------------------|-------|
| CNAME | briefly | `briefly.pages.dev` (or similar) | Proxied (orange cloud) |

If the record is missing after Step 6, add it manually:

- **Type:** CNAME  
- **Name:** `briefly`  
- **Target:** the `.pages.dev` hostname shown on the **briefly** Pages project overview  
- **Proxy status:** Proxied (orange cloud)  
- Save

---

## Step 8 — Wait for SSL, then test

SSL provisioning usually takes **2–15 minutes**. Status is on the **briefly** project → **Custom domains** page (look for **Active**).

Then open:

| Page            | URL |
|-----------------|-----|
| Landing         | https://briefly.daneoleary.com |
| Admin login     | https://briefly.daneoleary.com/admin/login |
| Client portal   | https://briefly.daneoleary.com/portal |

Sign in to admin with the `ADMIN_PASSWORD` you set in Step 5.

---

## Troubleshooting

### “I don’t see briefly under Workers & Pages”

You haven’t deployed yet. Run **Step 4** (`npm run deploy`).

### “I don’t see briefly.daneoleary.com under DNS”

You haven’t completed **Step 6** (custom domain). The DNS record is created when you attach the domain to Pages, not when you write code locally.

### “daneoleary.com isn’t on Cloudflare”

Add the zone first (**Websites → Add a site**). Or, at your current DNS host, add a CNAME: `briefly` → your Pages `.pages.dev` URL (Cloudflare will show the exact target when you add the custom domain).

### Wrangler says wrong Node version

Use Node 22.12+:

```sh
node -v   # should be v22.12.0 or newer
```

The project includes a Volta pin; run commands from inside the `briefly` folder.

### Wrangler / npm script fails on `wrangler` command

Use the project scripts as written (`npm run deploy`, etc.) or prefix with:

```sh
node ./node_modules/wrangler/bin/wrangler.js <command>
```

### Site loads on `.pages.dev` but not on briefly.daneoleary.com

- Check DNS record exists (Step 7)
- Wait for SSL to show **Active**
- Confirm orange-cloud (proxied) is on for the CNAME

### Admin login doesn’t work in production

- Confirm `ADMIN_PASSWORD` is set in Pages **Production** environment variables
- Redeploy after changing secrets

---

## Quick reference — full command sequence

```sh
cd "/Users/daneoleary/Documents/Work/Dane O'Leary Media/briefly"

node ./node_modules/wrangler/bin/wrangler.js login
node ./node_modules/wrangler/bin/wrangler.js d1 create briefly-db
# → update database_id in wrangler.jsonc

npm run db:migrate:remote
npm run deploy   # also runs pending remote migrations, then deploys
# → set ADMIN_PASSWORD, SESSION_SECRET, PUBLIC_ORIGIN in dashboard
npm run deploy
npm run domain:add   # or use dashboard Step 6A
```

Then verify DNS under **Websites → daneoleary.com → DNS** and test https://briefly.daneoleary.com.
