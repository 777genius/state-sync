# state-sync

Universal library for **reliable state synchronization** between windows/processes.

Focus: **framework-agnostic** (Pinia/React/vanilla state) + **transport-agnostic** (Tauri events+invoke, later BroadcastChannel, etc.).

## Packages

| Package | Description |
|-------|----------|
| [`state-sync`](packages/core/) | Core: engine, revision protocol, types |
| [`state-sync-pinia`](packages/pinia/) | Pinia adapter (applier) |
| [`state-sync-tauri`](packages/tauri/) | Tauri transport (subscriber + provider) |

## Install

```bash
npm install state-sync
npm install state-sync-pinia   # if Pinia
npm install state-sync-tauri   # if Tauri
```

## Quickstart

```typescript
import { createRevisionSync } from 'state-sync';

const handle = createRevisionSync({
  topic: 'settings',
  subscriber: mySubscriber,
  provider: myProvider,
  applier: myApplier,
});

await handle.start();
```

See: [core README](packages/core/README.md), [pinia README](packages/pinia/README.md), [tauri README](packages/tauri/README.md).

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Rust

```bash
cd crates/state-sync
cargo fmt
cargo clippy --all-targets -- -D warnings
cargo test
```

## Rust crate

The `crates/state-sync` directory contains an experimental Rust crate.
It is **not** part of the npm release and is versioned independently.
CI runs `cargo fmt`, `clippy`, and `cargo test`, but publishing to crates.io is not set up yet.

## Documentation

- [Lifecycle contract](docs/lifecycle.md)
- [Adapter authoring](docs/adapters/adapter-authoring.md)
- [Pinia adapter](docs/adapters/pinia.md)
- [Compatibility](docs/compatibility.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Examples](docs/examples/) — platform-agnostic usage examples
- [Release checklist](docs/release-checklist.md)
