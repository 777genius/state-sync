# state-sync

Ядро библиотеки синхронизации состояния. Framework- и transport-agnostic.

## Установка

```bash
npm install state-sync
```

## Quick Start

```typescript
import { createConsoleLogger, createRevisionSync } from 'state-sync';

const handle = createRevisionSync({
  topic: 'settings',
  subscriber: myInvalidationSubscriber,
  provider: mySnapshotProvider,
  applier: {
    apply(snapshot) {
      console.log('New data:', snapshot.data);
    },
  },
  onError(ctx) {
    console.error(`[${ctx.phase}]`, ctx.error);
  },
  logger: createConsoleLogger({ debug: true }),
});

await handle.start();

// Позже:
handle.stop();
```

## API

### `createRevisionSync<T>(options): RevisionSyncHandle`

Создаёт sync handle для заданного topic.

**Options**:
- `topic` — идентификатор ресурса (`string`)
- `subscriber` — источник invalidation events
- `provider` — поставщик snapshot-ов
- `applier` — применяет snapshot к состоянию
- `shouldRefresh?` — фильтр: нужно ли обновляться по конкретному event
- `logger?` — опциональный логгер
- `onError?` — callback при ошибках

**Handle**:
- `start()` — подписаться и загрузить начальный snapshot
- `stop()` — отписаться и заблокировать дальнейшие apply
- `refresh()` — одноразовый fetch + apply
- `getLocalRevision()` — текущая revision

См. [lifecycle contract](../../docs/lifecycle.md).
