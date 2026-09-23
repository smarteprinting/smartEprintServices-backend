# SmartEprint Services

A responsive Next.js landing page for SmartEprint Services, built with JavaScript and JSX.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build for production

```bash
npm run build
```

## Deploy to Vercel

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Vercel will detect the Next.js app automatically.
4. Deploy.

## Form security

The appointment and contact APIs require Cloudflare Turnstile verification, reject honeypot submissions, validate and length-limit all fields, escape email content, and rate-limit each client IP before sending email.

1. Copy `.env.example` to `.env.local` for local development and replace the SMTP values.
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel Environment Variables for Production, Preview, and Development.
3. Create a Cloudflare Turnstile widget for your production domain and add its site key and secret key to Vercel Environment Variables as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
4. Redeploy after changing environment variables.

Middleware uses the shared Redis database to count all matched application-route requests per IP, including page routes, API routes, and form submissions. Request 11 within five minutes receives HTTP 429 and a page titled `Blocked`. Static Next.js assets are excluded so a normal page load does not consume the allowance. If Redis is unavailable or not configured, requests receive HTTP 503 rather than bypassing the protection.

For Cloudflare-style bot challenges on every route, put the domain behind Cloudflare using the orange-cloud proxy, then create a WAF custom rule with action **Managed Challenge** for suspected automated traffic, such as `cf.bot_management.score lt 30` when Bot Management is available. You can also enable **Under Attack Mode** during an active attack. Turnstile in this project protects form submissions; it does not create a browser challenge for every page visit.
