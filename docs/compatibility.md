---
title: Compatibility
---

# Compatibility

## Runtime & tooling

| Requirement | Minimum |
|-------------|---------|
| Node.js | >= 18 |
| TypeScript | >= 5.3 |
| ES target | ES2022 |

## Framework adapters

| Adapter | Peer dependency |
|---------|----------------|
| `@statesync/zustand` | None (structural typing) |
| `@statesync/pinia` | None (structural typing) |
| `@statesync/vue` | None (structural typing) |
| `@statesync/valtio` | None (structural typing) |
| `@statesync/svelte` | None (structural typing) |
| `@statesync/tauri` | `@tauri-apps/api >= 2` |

All adapters use structural interfaces (e.g., `ZustandStoreLike`, `PiniaStoreLike`) instead of importing framework types directly. This means they work with any compatible version of the framework without version lock-in.

## Module formats

All packages ship in two formats:

- **ESM** (`import`) — `dist/index.js`
- **CJS** (`require`) — `dist/index.cjs`

Sourcemaps are included for both formats.

## TypeScript

Type declarations (`dist/index.d.ts`, `dist/index.d.cts`) are generated automatically.

`exports` in `package.json` use the `types` → `import` → `require` condition order, which ensures correct type resolution in any bundler or runtime.

## Browser support

`@statesync/core` uses no browser APIs and works in any ES2022 environment.

`@statesync/persistence` uses browser APIs depending on the storage backend:

| Backend | Required API |
|---------|-------------|
| `createLocalStorageBackend` | `localStorage` |
| `createSessionStorageBackend` | `sessionStorage` |
| `createIndexedDBBackend` | `indexedDB` |
| `createMemoryStorageBackend` | None |
| Cross-tab sync | `BroadcastChannel` |

## See also

- [Quickstart](/guide/quickstart) — get started
- [Troubleshooting](/troubleshooting) — common issues
