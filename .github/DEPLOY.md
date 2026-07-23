# Deployment

This site auto-deploys to **Porkbun Static Hosting** on every push to `main`,
via `.github/workflows/deploy.yml` (FTP upload using the `FTP_PASSWORD` repo secret).

- FTP host: `pixie-ss1-ftp.porkbun.com` (user: `mikeside.com`)
- Manual run: **Actions** tab → **Deploy to Porkbun** → **Run workflow**
- `README.md`, `.gitattributes`, and `.github/` are excluded from the upload.
