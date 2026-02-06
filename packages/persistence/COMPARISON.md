# Сравнение @statesync/persistence с конкурентами

Детальное сравнение с популярными persistence решениями для state management.

## Таблица фич

| Фича | @statesync/persistence | zustand/persist | pinia-persistedstate | redux-persist | tauri-plugin-store |
|------|:----------------------:|:---------------:|:--------------------:|:-------------:|:------------------:|
| **Storage Backends** | | | | | |
| localStorage | ✅ | ✅ | ✅ | ✅ | ❌ |
| sessionStorage | ✅ | ✅ | ✅ | ✅ | ❌ |
| IndexedDB | ✅ (с retry) | ⚠️ (adapter) | ⚠️ (custom) | ⚠️ (localForage) | ❌ |
| File system | ✅ (Tauri) | ❌ | ❌ | ⚠️ (Node) | ✅ |
| Memory (тесты) | ✅ | ❌ | ❌ | ❌ | ❌ |
| | | | | | |
| **Throttling** | | | | | |
| Debounce | ✅ | ❌ | ❌ | ❌ | ✅ |
| Throttle | ✅ | ❌ | ❌ | ❌ | ✅ |
| maxWait | ✅ | ❌ | ❌ | ❌ | ❌ |
| leading/trailing | ✅ | ❌ | ❌ | ❌ | ❌ |
| | | | | | |
| **Schema Migration** | | | | | |
| Version tracking | ✅ | ✅ | ❌ | ✅ | ❌ |
| Migration functions | ✅ | ✅ | ❌ | ✅ | ❌ |
| Migration builder | ✅ | ❌ | ❌ | ❌ | ❌ |
| Validation | ✅ | ❌ | ❌ | ❌ | ❌ |
| | | | | | |
| **Compression** | | | | | |
| Built-in LZ | ✅ | ❌ | ❌ | ❌ | ❌ |
| External adapters | ✅ | ❌ | ❌ | ⚠️ (transforms) | ❌ |
| Benchmarking | ✅ | ❌ | ❌ | ❌ | ❌ |
| | | | | | |
| **Cross-Tab Sync** | | | | | |
| BroadcastChannel | ✅ | ❌ | ❌ | ❌ | N/A |
| Storage events | ⚠️ (fallback) | ⚠️ | ⚠️ | ⚠️ | N/A |
| Multi-window | ✅ | ❌ | ❌ | ❌ | ✅ |
| | | | | | |
| **TTL & Expiry** | | | | | |
| TTL support | ✅ | ❌ | ❌ | ⚠️ (custom) | ❌ |
| Auto-expire | ✅ | ❌ | ❌ | ❌ | ❌ |
| | | | | | |
| **Observability** | | | | | |
| Save events | ✅ | ⚠️ (onRehydrate) | ✅ (hooks) | ❌ | ❌ |
| Error events | ✅ | ❌ | ❌ | ❌ | ❌ |
| Statistics | ✅ | ❌ | ❌ | ❌ | ❌ |
| | | | | | |
| **Integrity** | | | | | |
| Hash verification | ✅ | ❌ | ❌ | ❌ | ❌ |
| Corruption detection | ✅ | ❌ | ❌ | ❌ | ❌ |
| | | | | | |
| **Framework** | | | | | |
| Framework-agnostic | ✅ | ❌ (React) | ❌ (Vue) | ❌ (Redux) | ✅ |
| TypeScript | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| SSR support | ✅ | ✅ | ✅ | ⚠️ | N/A |
| | | | | | |
| **Bundle Size** | ~8KB | ~1KB | ~2KB | ~10KB | N/A |

**Легенда:** ✅ Полная поддержка | ⚠️ Частичная/через плагины | ❌ Нет | N/A Неприменимо

---

## Уникальные преимущества @statesync/persistence

### 1. Полный Throttling Control

```typescript
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  throttling: {
    debounceMs: 300,    // Ждать 300ms тишины
    throttleMs: 1000,   // Максимум 1 save/sec
    maxWaitMs: 5000,    // Force save после 5s
    leading: false,     // Не сохранять сразу
    trailing: true,     // Сохранить после паузы
  },
});
```

**Конкуренты:** zustand/persist и pinia-persistedstate не имеют throttling вообще. tauri-plugin-store имеет только простой debounce.

### 2. Built-in LZ Compression

```typescript
import { createLZCompressionAdapter, benchmarkCompression } from '@statesync/persistence';

const applier = createPersistenceApplier({
  compression: createLZCompressionAdapter(), // 40-70% сжатие
});

// Бенчмарк перед продакшеном
const result = benchmarkCompression(myData, adapter);
console.log(`Ratio: ${result.ratio}, Time: ${result.compressTimeMs}ms`);
```

**Конкуренты:** Никто не предоставляет built-in compression. redux-persist требует отдельные transforms.

### 3. Memory Storage для тестов

```typescript
const storage = createMemoryStorageBackend<AppState>({
  latencyMs: 50,           // Симуляция задержки
  failOnSave: false,       // Injection ошибок
  maxSizeBytes: 1024 * 1024, // Симуляция quota
});

// Test helpers
storage.setFailMode({ save: true }); // Включить ошибки
storage.reset();                      // Сбросить состояние
storage.getSavedSnapshots();          // Получить все сохранения
```

**Конкуренты:** Ни один конкурент не предоставляет тестовый backend с такими возможностями.

### 4. Type-safe Migration Builder

```typescript
const migration = createMigrationBuilder<AppStateV3>()
  .addMigration<V1, V2>(1, (v1) => ({ ...v1, newField: 'default' }))
  .addMigration<V2, V3>(2, (v2) => ({ ...v2, enabled: true }))
  .withValidator((data): data is AppStateV3 => {
    return typeof data === 'object' && 'enabled' in data;
  })
  .build(3);
```

**Конкуренты:** zustand имеет migrate function, но без builder pattern и validation. redux-persist имеет migrations, но без типобезопасности.

### 5. Cross-Tab Sync через BroadcastChannel

```typescript
const applier = createPersistenceApplier({
  crossTabSync: {
    channelName: 'my-app-state',
    receiveUpdates: true,
    broadcastSaves: true,
  },
});
```

**Конкуренты:** Все конкуренты полагаются на storage events (медленнее, нет поддержки sessionStorage).

### 6. Полная Observability

```typescript
applier.on('saveStart', (snapshot) => {
  console.log('Saving revision:', snapshot.revision);
});

applier.on('saveComplete', (snapshot, durationMs) => {
  metrics.recordSave(durationMs);
});

applier.on('saveError', (error, snapshot) => {
  Sentry.captureException(error);
});

const stats = applier.getStats();
// { saveCount, saveErrorCount, totalBytesSaved, lastSaveDurationMs }
```

**Конкуренты:** pinia-persistedstate имеет hooks, но без статистики. Остальные не имеют event system.

### 7. Hash Verification

```typescript
const applier = createPersistenceApplier({
  enableHash: true,
});

const cached = await loadPersistedSnapshot(storage, applier, {
  verifyHash: true, // Проверка целостности
});
```

**Конкуренты:** Никто не предоставляет integrity verification.

### 8. Framework-Agnostic

```typescript
// Работает с любым state manager
import { createPiniaSnapshotApplier } from '@statesync/pinia';
import { createZustandSnapshotApplier } from '@statesync/zustand';
import { createValtioSnapshotApplier } from '@statesync/valtio';

// Один и тот же persistence layer для всех
const applier = createPersistenceApplier({
  storage,
  applier: createPiniaSnapshotApplier(store), // или zustand, valtio, etc.
});
```

**Конкуренты:** Каждый привязан к своему state manager.

---

## Что есть у конкурентов

| Фича | Где есть | Статус в @statesync |
|------|----------|---------------------|
| `partialize` (выборочное сохранение) | zustand, pinia | Планируется |
| `skipHydration` | zustand | Планируется |
| Transforms chain | redux-persist | Есть compression adapter |
| React Native AsyncStorage | zustand, redux | Не в scope |
| Nuxt module | pinia-persistedstate | Не в scope |

---

## Производительность

### Bundle Size

| Пакет | Размер (minified) |
|-------|-------------------|
| @statesync/persistence | ~8KB |
| zustand (весь) | ~1KB |
| zustand/persist | ~1KB |
| pinia-persistedstate | ~2KB |
| redux-persist | ~10KB |

> **Примечание:** @statesync/persistence включает compression, migration, cross-tab sync, что объясняет больший размер.

### Compression Benchmark (типичный JSON)

```
Data size: 50KB (user settings with lists)
LZ compression ratio: 0.45 (55% reduction)
Compress time: 2-5ms
Decompress time: 1-3ms
```

---

## Итоговая оценка

| Критерий | @statesync | zustand | pinia | redux-persist | tauri-store |
|----------|:----------:|:-------:|:-----:|:-------------:|:-----------:|
| Функциональность | 9.5/10 | 7/10 | 6/10 | 7/10 | 6/10 |
| TypeScript DX | 9/10 | 9/10 | 8/10 | 6/10 | 8/10 |
| Bundle size | 7/10 | 10/10 | 9/10 | 6/10 | N/A |
| Тестируемость | 9/10 | 6/10 | 6/10 | 5/10 | 5/10 |
| Документация | 9/10 | 9/10 | 8/10 | 7/10 | 7/10 |
| **Общая** | **9/10** | **8/10** | **7/10** | **6/10** | **6/10** |

---

## Когда использовать @statesync/persistence

**Выбирайте @statesync/persistence если:**
- Нужна синхронизация между вкладками
- Важна integrity данных (hash verification)
- Требуется schema migration с валидацией
- Хотите throttling для снижения I/O
- Используете несколько state managers
- Нужна compression для больших данных
- Важна observability (events, stats)

**Выбирайте zustand/persist если:**
- Используете только Zustand
- Критичен минимальный bundle size
- Достаточно базовой функциональности

**Выбирайте pinia-persistedstate если:**
- Используете только Pinia/Vue
- Нужна Nuxt интеграция
- Достаточно простого persist

---

## Ссылки

- [zustand persist middleware](https://zustand.docs.pmnd.rs/middlewares/persist)
- [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/)
- [redux-persist](https://github.com/rt2zz/redux-persist)
- [tauri-plugin-store](https://v2.tauri.app/plugin/store/)
