# Lifecycle Contract

## RevisionSyncHandle

### `start()`

- Подписывается на invalidation events и загружает начальный snapshot.
- **Идемпотентен**: повторный вызов — no-op (не дублирует подписку).
- **Throws** если вызван после `stop()` — защита от утечек подписок.
- При ошибке подписки или первого refresh — откатывает состояние (unsubscribe, started = false).

### `stop()`

- Отписывается от invalidation events и блокирует дальнейший apply.
- **Идемпотентен**: повторный вызов — no-op.
- После `stop()` handle считается "мёртвым" — `start()` бросит ошибку.

### `refresh()`

- One-shot: запросить snapshot у provider и применить через applier.
- **Разрешён до `start()`** — полезно для eager prefetch без подписки.
- **No-op после `stop()`** — не бросает, просто пропускает.
- Поддерживает coalescing: если refresh уже в процессе, следующий вызов ставится в очередь (максимум 1 в очереди).

### `getLocalRevision()`

- Возвращает текущую локальную revision (последнюю успешно применённую).
- `"0"` до первого применения.

## Error Phases

Каждая ошибка, переданная в `onError`, содержит поле `phase`, определяющее где именно произошёл сбой:

| Phase | Что произошло | Applier вызван? |
|-------|---------------|-----------------|
| `subscribe` | Ошибка подписки на invalidation events | Нет |
| `getSnapshot` | Provider не смог вернуть snapshot | Нет |
| `protocol` | Revision не прошла валидацию (non-canonical, пустой topic) | Нет |
| `apply` | Applier бросил ошибку при применении snapshot | Да (apply завершился ошибкой) |
| `refresh` | Неклассифицированная ошибка внутри refresh цикла | Зависит |

## Observability fields (best-effort)

В `SyncErrorContext` дополнительно могут присутствовать (опционально) поля для triage/метрик:
- `localRevision?` — локальная revision на момент ошибки
- `eventRevision?` — revision из invalidation event (если применимо)
- `snapshotRevision?` — revision из snapshot (если применимо)
- `sourceId?` — инициатор изменения (если транспорт/источник присылает `sourceId`)

Эти поля **best-effort**: engine заполнит их, когда информация доступна в текущей фазе.

**Поведение при ошибке `apply`:**
- Во время `start()` — промис `start()` reject'ится, подписка откатывается (unsubscribe, started = false).
- Во время invalidation-refresh — `onError` эмитится, подписка продолжает работать (следующая invalidation снова запустит refresh).
- Во время ручного `refresh()` — ошибка propagates к caller'у.

**Порядок проверки при ошибке в `refresh()`:**
1. `getSnapshot` — provider не смог вернуть данные
2. `protocol` — revision не прошла валидацию
3. `apply` — applier не смог применить snapshot
4. `refresh` — fallback для непредвиденных ошибок

Каждая фаза эмитится ровно один раз за ошибку (deduplicated через `alreadyEmitted` флаг).

## onError callback

- Вызывается при ошибках во всех фазах: `subscribe`, `refresh`, `protocol`, и т.д.
- **Если `onError` бросает исключение** — engine ловит его и логирует, продолжает работу.
- Engine никогда не падает из-за пользовательского onError callback.

## Порядок вызовов

```
createRevisionSync(options)  →  handle (inactive)
    ↓
handle.refresh()             →  optional: one-shot fetch+apply
    ↓
handle.start()               →  subscribe + initial refresh
    ↓
[invalidation events]        →  automatic refresh cycle
    ↓
handle.stop()                →  unsubscribe, block further apply
```
