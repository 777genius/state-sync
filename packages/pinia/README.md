# state-sync-pinia

Pinia-адаптер для state-sync. Применяет snapshot-ы в Pinia store.

## Установка

```bash
npm install state-sync-pinia state-sync
```

## Quick Start

```typescript
import { createRevisionSync } from 'state-sync';
import { createPiniaSnapshotApplier } from 'state-sync-pinia';

const store = useMyStore();

const applier = createPiniaSnapshotApplier(store);

const handle = createRevisionSync({
  topic: 'settings',
  subscriber: mySubscriber,
  provider: myProvider,
  applier,
});

await handle.start();
```

## Режимы

### Patch (default)

```typescript
const applier = createPiniaSnapshotApplier(store);
// Вызывает store.$patch(data) — мержит поля
```

### Replace

```typescript
const applier = createPiniaSnapshotApplier(store, { mode: 'replace' });
// Полная замена: удаляет отсутствующие ключи, назначает новые
```

## Опции

- `toState(data, ctx)` — маппинг snapshot data → state patch
- `pickKeys` / `omitKeys` — ограничить обновляемые ключи
- `strict` (default: `true`) — бросить ошибку если `toState` вернёт не объект

См. [adapter docs](../../docs/adapters/pinia.md).
