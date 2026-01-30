# Troubleshooting

## Non-canonical revision

**Ошибка**: `Non-canonical snapshot revision: "01"`

Revision должна быть canonical decimal u64 string:
- `"0"` — OK
- `"123"` — OK
- `"01"` — не ОК (leading zero)
- `"abc"` — не ОК (не число)
- `""` — не ОК (пустая строка)

**Решение**: убедиться что backend отдаёт revision без leading zeros. Revision — строковое представление беззнакового 64-bit числа.

## Topic mismatch

**Симптом**: invalidation events приходят, но snapshot не обновляется.

**Причина**: topic в invalidation event не совпадает с topic в `createRevisionSync()`.

**Решение**: проверить что backend и frontend используют одинаковый topic string. Topic сравнивается строго (`===`).

## Multiple windows / race conditions

**Симптом**: несколько окон конкурируют за обновления, данные "прыгают".

Engine обеспечивает:
- Coalescing: множественные invalidation-ы сжимаются в один refresh
- Revision monotonicity: snapshot применяется только если его revision строго выше текущей

Если проблема сохраняется — проверить что snapshot provider возвращает актуальные данные, а не кешированные.

## start() after stop()

**Ошибка**: `[state-sync] start() called after stop()`

Handle одноразовый: после `stop()` нельзя вызвать `start()`. Это защита от утечек подписок.

**Решение**: создать новый handle через `createRevisionSync()`.

## Interpreting error phases

Поле `phase` в `SyncErrorContext` помогает быстро определить источник проблемы:

### `getSnapshot`
**Причина**: Provider не смог вернуть snapshot (сеть, таймаут, backend упал).
**Действие**: Проверить доступность backend. Если используется Tauri `invoke` — проверить что Rust command зарегистрирован и возвращает данные.

### `apply`
**Причина**: Applier бросил ошибку при обработке snapshot (ошибка десериализации, невалидные данные, Pinia store reject).
**Действие**: Проверить формат данных в snapshot. Убедиться что applier корректно обрабатывает все возможные формы `data`.

### `protocol`
**Причина**: Нарушение контракта — revision не каноническая, topic пустой, или payload не соответствует ожидаемой форме.
**Действие**: Проверить что backend генерирует canonical revision (decimal u64 без leading zeros). Проверить payload invalidation events.

### `subscribe`
**Причина**: Не удалось подписаться на events (transport не доступен, Tauri listener ошибка).
**Действие**: Проверить что transport корректно настроен и event name совпадает.

### `refresh`
**Причина**: Fallback — ошибка внутри refresh, не классифицированная как getSnapshot/apply/protocol.
**Действие**: Проверить логи для полной stack trace.

## Useful context fields

Кроме `phase`, engine может (best-effort) заполнять поля:
- `localRevision` — локальная revision на момент ошибки
- `eventRevision` — revision из invalidation event (если применимо)
- `snapshotRevision` — revision snapshot (если применимо)
- `sourceId` — инициатор изменения (если транспорт это передаёт)

Это удобно для метрик/алертов (например: “apply errors by topic”).

## onError throws

Если `onError` callback бросает исключение, engine ловит его и логирует. Engine продолжает работать — пользовательский callback не может уронить sync loop.
