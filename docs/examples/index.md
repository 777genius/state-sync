---
title: Examples
---

# Examples

Runnable examples demonstrating state-sync patterns.

## Core patterns

| Example | Description |
|---------|-------------|
| [Source of truth](/examples/source-of-truth) | In-memory transport, revision gate, invalidation cycle |
| [Structured logging](/examples/structured-logging) | JSON logger, error metrics, observability |

## Framework examples

See the [packages documentation](/packages/) for framework-specific examples:

- [Pinia + Tauri](/packages/pinia) — Vue stores with Tauri backend
- [Zustand](/packages/zustand) — React stores
- [Valtio](/packages/valtio) — Proxy-based React state
- [Svelte](/packages/svelte) — Svelte writable stores
- [Vue](/packages/vue) — Vue reactive/ref
- [Persistence](/packages/persistence) — localStorage, IndexedDB, cross-tab sync

## Running examples locally

```bash
# Clone the repo
git clone https://github.com/777genius/state-sync.git
cd state-sync

# Install dependencies
pnpm install

# Run an example
npx tsx docs/examples/source-of-truth.ts
```
