# Release Checklist

## Pre-release gates

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm -r typecheck
pnpm -r test
pnpm -r build
```

All steps must pass without errors.

## Versioning

```bash
pnpm changeset version
```

- Verify generated `CHANGELOG.md` files in each package
- Ensure versions are correct
- Commit the changes

## Publishing

Publish order (dependencies first):

1. `@statesync/core` (core)
2. `@statesync/pinia`
3. `@statesync/zustand`
4. `@statesync/valtio`
5. `@statesync/svelte`
6. `@statesync/vue`
7. `@statesync/tauri`

```bash
pnpm release
```

## CI/CD secrets

For automated releases via GitHub Actions, configure repository secrets:

- **`NPM_TOKEN`** — npm token for publishing packages.
  Get it via `npm token create` or the npm web UI (Access Tokens).
  Scope: automation token with publish permissions.
- **`GITHUB_TOKEN`** — provided automatically by GitHub Actions.
  Used by `changesets/action` to create the Release PR.

Setup: Settings → Secrets and variables → Actions → New repository secret.

## Smoke-import check (ESM + CJS)

Before publishing, ensure both formats work:

```bash
# ESM
node -e "import('@statesync/core').then(m => console.log('ESM OK:', Object.keys(m)))"

# CJS
node -e "const m = require('@statesync/core'); console.log('CJS OK:', Object.keys(m))"
```

Repeat for each package (`@statesync/pinia`, `@statesync/zustand`, `@statesync/valtio`, `@statesync/svelte`, `@statesync/vue`, `@statesync/tauri`).

## Post-release

- Smoke test: install published packages into a test project
- Verify ESM and CJS imports (see above)
- Verify TypeScript types resolve
- Create a git tag if needed

## Docs deploy (GitHub Pages)

- Ensure repository Pages is enabled with **Source = GitHub Actions**.
- Push changes under `docs/**` to `main` and verify the **Docs (GitHub Pages)** workflow completes successfully.
