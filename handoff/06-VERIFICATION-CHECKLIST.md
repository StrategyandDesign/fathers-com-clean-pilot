# Verification checklist

Run these on a clone of `fathers-com-clean-pilot` (`main`). Do not use `fathers-com-platform.vercel.app` or the stale `fathers-com-pilot.vercel.app` to confirm this tree.

## A. Identity

- [ ] `git remote -v` points at `StrategyandDesign/fathers-com-clean-pilot`, not `fathers-com-platform`.
- [ ] `git rev-parse --abbrev-ref HEAD` is `main`.
- [ ] There is no `main` from the old platform in this clone.

## C. Automated

```bash
npx tsx --test tests/*.test.ts
npx tsc --noEmit
npm run lint
```

Expect: tests pass; tsc clean; eslint clean on the Next app.
