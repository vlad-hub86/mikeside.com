# Cloudflare Pages source branch

This `dashboard` branch is the production source for the **danglemystash**
Cloudflare Pages project, which serves the private Robinhood dashboard at
**danglemystash.mikeside.com** (behind Cloudflare Access, vlad05@gmail.com only).

Root directory: `projects/dashboards/robinhood`.

**Why a separate branch:** the dashboard is deliberately kept off the `main`
branch so the Porkbun FTP deploy never publishes it. That means the dashboard
files live only on Cloudflare's edge — there is no public Porkbun origin for
anyone to reach around the Access lock.

To update the dashboard (e.g. load data): edit
`projects/dashboards/robinhood/index.html` on THIS branch and push. Pages
redeploys automatically. Do not merge this branch into `main`.
