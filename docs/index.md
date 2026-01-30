---
layout: home
hero:
  name: state-sync
  text: Надёжная синхронизация состояния между окнами/процессами
  tagline: Invalidation → Fetch snapshot → Apply (revision gate)
  actions:
    - theme: brand
      text: Quickstart
      link: /guide/quickstart
    - theme: alt
      text: Packages
      link: /packages/
    - theme: alt
      text: Lifecycle
      link: /lifecycle
features:
  - title: Framework-agnostic
    details: Работает с Pinia/React/vanilla state через адаптеры applier.
  - title: Transport-agnostic
    details: Любой IPC/transport (Tauri events+invoke, BroadcastChannel, in-memory) через subscriber/provider.
  - title: Deterministic
    details: Monotonic revision + snapshot source-of-truth защищают от out-of-order событий.
  - title: Production-friendly
    details: Contract tests, строгая валидация протокола и наблюдаемость через phases.
---

## Установка

```bash
npm install state-sync
npm install state-sync-pinia   # если Pinia
npm install state-sync-tauri   # если Tauri
```

## Быстрый пример

```ts
import { createConsoleLogger, createRevisionSync } from 'state-sync';

const handle = createRevisionSync({
  topic: 'app-config',
  subscriber: mySubscriber,
  provider: myProvider,
  applier: myApplier,
  logger: createConsoleLogger({ debug: true }),
});

await handle.start();
```

