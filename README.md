# Fathers.com — clean-pilot (Next.js)

This repository is the **Next.js clean-pilot app** for review and hardening. It is not production, and it is not the old static Fathers.com site.

**If `app/` is not here yet:** the tree is still unpacking. Wait a few minutes and pull again. Or run:

```bash
cat export/part-* | base64 -d | tar -xzf -
```

```bash
npm install
# Copy .env.example to .env.local. Missing Supabase keys fall back to the Pilot project.
npm run dev
```

Start with `handoff/00-SUBMISSION-GUIDE.md`.

Do **not** use https://fathers-com-platform.vercel.app to judge this repo.
