# Vercel / Neon migration

Next.js runtime and GitHub Auth.js integration staged. Not yet build-tested or deployed.
GitHub sign-in is restricted to jenozu; database keys use the verified provider account ID.
Configure DATABASE_URL, AUTH_SECRET, AUTH_GITHUB_ID and AUTH_GITHUB_SECRET in Vercel.
Register a GitHub OAuth app with callback https://<deployment-domain>/api/auth/callback/github.
Run npm install to regenerate the lockfile before npm ci. Then run npx tsc --noEmit and npm run build.
Original D1 files and legacy tests are retained for reference; legacy route tests need replacement.
Existing hosted progress requires separate validated import.
