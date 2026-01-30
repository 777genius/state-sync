# state-sync-tauri

Tauri-транспорт для state-sync. Использует Tauri events для invalidation и invoke для snapshot.

## Установка

```bash
npm install state-sync-tauri state-sync
```

## Quick Start

```typescript
import {
  createTauriInvalidationSubscriber,
  createTauriSnapshotProvider,
  createTauriRevisionSync,
} from 'state-sync-tauri';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

// Option A: explicit wiring
const handleA = createRevisionSync({
  topic: 'settings',
  subscriber: createTauriInvalidationSubscriber({ listen, eventName: 'state-sync:invalidation' }),
  provider: createTauriSnapshotProvider({ invoke, commandName: 'get_snapshot', args: { topic: 'settings' } }),
  applier: myApplier,
});

// Option B: DX sugar
const handleB = createTauriRevisionSync({
  topic: 'settings',
  listen,
  invoke,
  eventName: 'state-sync:invalidation',
  commandName: 'get_snapshot',
  args: { topic: 'settings' },
  applier: myApplier,
});

await handleA.start();
await handleB.start();
```

## API

### `createTauriInvalidationSubscriber(options)`

Оборачивает Tauri `listen` в `InvalidationSubscriber`.

### `createTauriSnapshotProvider<T>(options)`

Оборачивает Tauri `invoke` в `SnapshotProvider<T>`.

Оба адаптера принимают structural types — можно передать свои mock-функции для тестирования без Tauri runtime.

## Peer dependency policy

`@tauri-apps/api` объявлен как **optional** peer dependency:

- **В production Tauri app**: установить `@tauri-apps/api >=2` — `listen` и `invoke` передаются напрямую.
- **В тестах**: устанавливать `@tauri-apps/api` **не нужно**. Используйте structural mocks:

```typescript
import { createRevisionSync } from 'state-sync';
import { createTauriInvalidationSubscriber, createTauriSnapshotProvider } from 'state-sync-tauri';

const mockListen = async (eventName, handler) => {
  // эмулируем events
  return () => {};
};

const mockInvoke = async (cmd, args) => {
  return { revision: '1', data: { /* ... */ } };
};

const subscriber = createTauriInvalidationSubscriber({ listen: mockListen, eventName: 'evt' });
const provider = createTauriSnapshotProvider({ invoke: mockInvoke, commandName: 'cmd' });
```

Адаптеры типизированы через structural types (`TauriListen`, `TauriInvoke`), поэтому любая функция с совместимой сигнатурой будет принята TypeScript компилятором.
