# state-sync

Универсальная библиотека для **надёжной синхронизации состояния** между окнами/процессами.

Фокус: **framework-agnostic** (Pinia/React/vanilla state) + **transport-agnostic** (Tauri events+invoke, позже BroadcastChannel и т.п.).

## Пакеты

| Пакет | Описание |
|-------|----------|
| [`state-sync`](packages/core/) | Ядро: engine, revision protocol, types |
| [`state-sync-pinia`](packages/pinia/) | Pinia-адаптер (applier) |
| [`state-sync-tauri`](packages/tauri/) | Tauri-транспорт (subscriber + provider) |

## Установка

```bash
npm install state-sync
npm install state-sync-pinia   # если Pinia
npm install state-sync-tauri   # если Tauri
```

## Быстрый старт

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

Подробнее: [core README](packages/core/README.md), [pinia README](packages/pinia/README.md), [tauri README](packages/tauri/README.md).

## Разработка

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

Директория `crates/state-sync` содержит экспериментальный Rust crate.
Он **не входит** в npm-релиз и версионируется отдельно.
CI проверяет `cargo fmt`, `clippy` и `cargo test`, но публикация на crates.io пока не предусмотрена.

## Документация

- [Lifecycle contract](docs/lifecycle.md)
- [Adapter authoring](docs/adapters/adapter-authoring.md)
- [Pinia adapter](docs/adapters/pinia.md)
- [Compatibility](docs/compatibility.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Examples](docs/examples/) — platform-agnostic примеры использования
- [Release checklist](docs/release-checklist.md)
