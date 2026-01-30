## Iteration 0001 — `state-sync`: Bootstrap + Core Protocol (Google‑style design doc)

**Статус**: Draft  
**Цель итерации**: согласовать протокол/границы/контракты и разложить работу так, чтобы реализация шла быстро и без архитектурных откатов.  
**Дата**: 2026‑01‑29

### TL;DR

`state-sync` — маленький, но надёжный примитив синхронизации состояния между окнами/процессами: **event = invalidation**, **snapshot = source of truth**, **revision = монотонная версия**.  
Итерация 0001 фиксирует дизайн (инварианты, API, слои, тестовые контракты, качество) и задаёт “rails” для дальнейшей реализации.

---

### Решения (Locked decisions) для v0

Ниже — **финальные решения**, которые принимаем для v0, чтобы дальше реализовывать без вилок и переоткатов.

#### 1) Revision = **каноничная decimal‑строка (u64)**

- **Почему**: максимум совместимости (Rust/TS/IPC/JSON), нет проблем \(2^{53}-1\) и “тихой” потери точности.
- **Формат**: `Revision` MUST быть ASCII‑строкой base‑10 без знака, представляющей `u64`:
  - regex‑форма: `^[0-9]+$`
  - **канонизация**: `"0"` допускается, для остальных — **без ведущих нулей** (например, `"001"` запрещено)
  - для совместимости с Rust backend: значение должно помещаться в `u64` (макс. 20 цифр; при длине 20 — не больше `18446744073709551615`)
- **Сравнение** (без `BigInt` в пользовательском коде):
  - если обе строки каноничны, сравнение делается по `(length, lexicographic)`:

```ts
// compare(a,b): -1 | 0 | 1
if (a.length !== b.length) return a.length < b.length ? -1 : 1;
return a === b ? 0 : a < b ? -1 : 1;
```

> Примечание: библиотека должна **валидировать/канонизировать** ревизии на входе и считать неканоничные значения ошибкой протокола (см. error handling).

#### 2) Event envelope: обязательные `topic + revision`, остальное optional

- **Обязательные поля**:
  - `topic`: стабильный идентификатор домена/ресурса (пример: `"app-config"`, `"auth-state"`)
  - `revision`: каноничная decimal‑строка (см. выше)
- **Опциональные поля** (для observability/диагностики, но не для корректности):
  - `sourceId?: string` — кто инициировал изменение (окно/процесс/инстанс)
  - `timestampMs?: number` — epoch ms, **не используется для порядка**, порядок задаёт revision
- **Валидация** (нормативно для v0 engine):
  - `topic` MUST быть непустой строкой после `trim()`
  - `revision` MUST быть каноничной (секция Revision)
  - при нарушении — `onError({ phase: 'protocol', ... })` и **event игнорируется**
- **Неизвестные поля**: игнорируем (forward‑compat).
- **Рекомендация по топикам**:
  - kebab‑case
  - не завязаны на UI/route
  - меняются крайне редко (это контракт IPC/протокола)

Пример payload:

```json
{
  "topic": "app-config",
  "revision": "42",
  "sourceId": "window:settings:550e8400-e29b-41d4-a716-446655440000",
  "timestampMs": 1738123456789
}
```

#### 3) Ошибки: `logger` + `onError(context)` (рекомендуемая observability точка)

- **`logger`**:
  - дефолт — noop (чтобы библиотека не “шумела” без желания потребителя)
  - используется для debug‑трассировки движка (subscribe/refresh/apply/ignore)
- **`onError`**:
  - опциональный callback для Sentry/метрик/алертов
  - получает **контекст**, а не только error
  - ошибки **не должны ломать** подписку (fail‑safe), кроме критических ошибок subscribe/start

Контекст ошибки (эскиз):

```ts
type SyncPhase =
  | 'start'
  | 'subscribe'
  | 'invalidation'
  | 'refresh'
  | 'getSnapshot'
  | 'apply'
  | 'protocol';

type SyncErrorContext = {
  phase: SyncPhase;
  topic?: string;
  error: unknown;
  sourceEvent?: unknown; // raw event payload when applicable
  attempt?: number; // если retry включён
  willRetry?: boolean;
  nextDelayMs?: number;
};
```

Нормативное поведение:
- Ошибки в обработчике invalidation/refresh должны:
  - вызывать `onError` (если задан)
  - логироваться (если logger не noop)
  - **не выключать** sync engine
- Ошибка subscribe (невозможно подписаться) — **критическая**: `start()` должен reject.

#### 4) Retry/backoff: не в core‑engine, а как policy/обёртка `SnapshotProvider`

- **Почему**: retry — это политика, зависящая от домена и источника, и её нельзя навязывать всем.
- **v0 решение**:
  - core‑engine делает **одну попытку** `provider.getSnapshot()` и не содержит встроенного retry.
  - retry добавляется через **обёртку** вокруг provider: `withRetry(provider, policy)`.
  - по умолчанию — **no retry**.

Рекомендованный policy (эскиз):
- exponential backoff + jitter
- `maxAttempts` по умолчанию: 3
- `baseDelayMs`: 100
- `maxDelayMs`: 2000
- `shouldRetry(error)` — user‑defined (например, сеть/таймаут/temporary)

> Нюанс: даже с retry движок должен оставаться coalescing‑friendly: если во время retry пришли новые invalidation, после успешного refresh делаем ещё один refresh, если локальная ревизия всё ещё отстаёт.

---

### Контекст / Problem statement

В multi‑window приложениях (Tauri/Electron/браузерные вкладки) одно и то же состояние читается/пишется из разных UI‑контекстов. На практике события **могут теряться**, слушатели могут подписываться “позже”, порядок может быть непредсказуем, а “шарить store” напрямую невозможно.

Типичные симптомы без стандарта:
- окно “застревает” на устаревших данных (пропущенное событие);
- гонка при старте/открытии окна (подписались позже, чем случилось обновление);
- логика синхронизации размазана по feature/store слоям (DRY нарушен);
- тестировать надёжность трудно (нет повторяемых сценариев/контрактов).

---

### Цели (Goals)

#### Функциональные
- **Надёжность late‑join**: новое окно всегда может “догнать” актуальное состояние, даже если пропустило события.
- **Инверсия ответственности**: окна не “распространяют state”, они получают invalidation → подтягивают snapshot.
- **Универсальность**:
  - framework‑agnostic (Pinia/React/vanilla state/кэш);
  - transport‑agnostic (Tauri events+invoke, позже BroadcastChannel и т.п.).
- **Минимальный понятный API**: чтобы любой специалист мог подключить синхронизацию без знания внутренних деталей.

#### Нефункциональные (качество)
- **Clean Architecture**: core не зависит от транспорта и UI.
- **SOLID / DIP**: core зависит только от абстракций, инфраструктура — плагины.
- **Контрактные тесты**: одинаковые сценарии должны запускаться на любом транспорте.
- **Линтер/формат/типизация** как gate с первого дня.

---

### Не‑цели (Non‑Goals)

Чтобы не превратиться в “второй zubridge” и не зацементировать архитектуру приложения:
- не делаем “полноценный state‑management framework” (reducers/actions/stores);
- не решаем сложные конфликты multi‑writer (CRDT/OT). На v0 — **last‑write‑wins на источнике истины**;
- не тащим персистентность/шифрование/хранилища как обязательную часть (это ответственность источника истины);
- не делаем сетевую синхронизацию (только локальные окна/процессы/контексты);
- не связываем API с Pinia/Zustand напрямую (адаптеры — отдельный слой/пакет).
- **не описываем внедрение в конкретные продукты/репозитории**: это всегда отдельный план в репозитории приложения‑потребителя (вне `state-sync`).

---

### Инварианты протокола (Requirements / invariants)

1) **Revision монотонна**  
   Источник истины увеличивает `revision` при каждом логическом изменении. `revision` представлен как **каноничная decimal‑строка u64** (см. Locked decisions).

2) **Событие = invalidation**  
   Событие не является источником данных. Оно лишь сигнал: “возможны новые данные”.

3) **Snapshot = единственный источник данных**  
   Применяем состояние только из снапшота (pull), а не из event payload.

4) **Apply только если snapshot новее**  
   Окно хранит `localRevision`. Применяем `snapshot` только если `snapshot.revision > localRevision`.

5) **Start order: subscribe → refresh**  
   На старте синхронизации сначала подписываемся, потом делаем refresh, чтобы исключить гонку “refresh → missed event”.

6) **Fail‑safe refresh**  
   Ошибка получения снапшота не должна ломать подписку; библиотека остаётся “живой”, ошибки поверхностно логируются/пробрасываются через hook.

---

### Архитектура (Clean Architecture)

#### Domain
Чистые типы и инварианты:
- `Revision` (каноничная decimal‑строка `u64`),
- `Topic` (стабильный идентификатор домена/ресурса),
- `InvalidationEvent` (`topic`, `revision`, optional `sourceId`/`timestampMs`),
- `SnapshotEnvelope<T>` (`revision` + `data`).

#### Application
Движок синхронизации:
- управление lifecycle (`start/stop`),
- “subscribe → refresh”,
- дедупликация refresh (in‑flight + coalescing),
- обработка ошибок (fail‑safe) и хуки observability (`logger`, `onError`).

> Backoff/retry — это политика и находится **вне engine** (v0), через `SnapshotProvider` wrapper (см. Locked decisions).

#### Infrastructure
Транспорты и “источник истины” через интерфейсы:
- `InvalidationSubscriber` (subscribe/unsubscribe),
- `SnapshotProvider` (getSnapshot),
- (позже) реализации под Tauri/BroadcastChannel/etc.

#### Adapters
Тонкие обёртки под конкретные state‑контейнеры:
- “apply snapshot в Pinia”, “apply snapshot в React state”, “apply в кэш”.
Это не часть core и не должно влиять на протокол.

---

### Публичный API (v0) — проектирование

#### Типы (эскиз)

```ts
type Topic = string; // non-empty (validated at runtime)
type Revision = string & { readonly __brand: 'Revision' }; // canonical decimal u64 string

type InvalidationEvent = {
  topic: Topic;
  revision: Revision;
  sourceId?: string;
  timestampMs?: number;
};

type SnapshotEnvelope<T> = {
  revision: Revision;
  data: T;
};
```

#### Интерфейсы (эскиз)

```ts
type Unsubscribe = () => void;

interface InvalidationSubscriber {
  // async because some transports (e.g., Tauri listen) are async
  subscribe(handler: (e: InvalidationEvent) => void): Promise<Unsubscribe>;
}

interface SnapshotProvider<T> {
  getSnapshot(): Promise<SnapshotEnvelope<T>>;
}

interface SnapshotApplier<T> {
  apply(snapshot: SnapshotEnvelope<T>): void | Promise<void>;
}

interface Logger {
  debug(msg: string, extra?: unknown): void;
  warn(msg: string, extra?: unknown): void;
  error(msg: string, extra?: unknown): void;
}
```

#### Главный конструктор (эскиз)

```ts
createRevisionSync<T>({
  topic,
  subscriber,
  provider,
  applier,
  shouldRefresh, // опционально: фильтр по topic/sourceId и др.
  logger,
  onError,
}): {
  start(): Promise<void>;
  stop(): void; // v0: best-effort, does not cancel in-flight refresh
  refresh(): Promise<void>;
  getLocalRevision(): Revision;
};
```

#### Контракт поведения (must‑have)
- `start()` гарантирует: **subscribe → refresh**.
  - `start()` MUST reject если:
    - подписка не установилась (`subscriber.subscribe` throw/reject),
    - или initial refresh завершился ошибкой (ошибка `getSnapshot`/валидации снапшота/`apply`).
  - при reject из‑за initial refresh MUST выполнить cleanup: вызвать `unsubscribe` (если уже подписались).
  - `start()` SHOULD быть идемпотентным (вызовы после успешного старта — no‑op).
- `stop()`:
  - MUST быть идемпотентным,
  - MUST вызывать `unsubscribe` (если подписка активна),
  - MUST гарантировать “quiescence”: после `stop()` engine **не вызывает** `applier.apply`, даже если:
    - пришли новые invalidation,
    - или завершился in‑flight refresh (результат MUST быть отброшен).
- `refresh()`:
  - coalesce (если refresh уже идёт, второй refresh не запускается параллельно);
  - после получения снапшота применяет только если ревизия новее;
  - не выбрасывает систему из состояния “подписан/жив”.
- обработка out‑of‑order invalidation: если пришла меньшая `revision`, игнорируем.

---

### Транспорты (дизайн пакетов)

Чтобы сохранить независимость и понятность:
- `core` (TS): только протокол + sync engine + in‑memory транспорт для тестов.
- `tauri` (TS, позже): адаптеры `listen/emit/invoke`.
- `broadcast` (TS, позже): `BroadcastChannel`.

Итерация 0001: фиксируем интерфейсы и пишем **in‑memory transport** только для тестов и симуляции multi‑window.

#### Важное уточнение: “transport adapters” vs “framework adapters”

В `state-sync` есть **две независимые оси расширения**, и это принципиально отличает проект от решений, которые “вшивают” конкретный state‑container:

- **Transport adapters (обязательная ось)**: как доставлять invalidation и как получать snapshot в конкретной среде.
  - реализуют `InvalidationSubscriber` и/или `SnapshotProvider`
  - примеры: Tauri (events+invoke), BroadcastChannel, in‑memory (для тестов)

- **Framework adapters (опциональная ось)**: как применять `SnapshotEnvelope<T>` в конкретный state‑container.
  - реализуют/генерируют `SnapshotApplier<T>`
  - примеры: Pinia/Vue/Zustand/valtio/etc.
  - цель — **DX и снижение boilerplate**, а не “архитектурная зависимость”: core остаётся framework‑agnostic

Нормативно для v0:
- core не имеет зависимостей на Pinia/Vue/React/etc.
- framework adapters — отдельные пакеты, подключаются только теми, кому нужны.

---

### Rust helper (опционально; дизайн, не “фреймворк”)

Цель Rust‑крейта — быть “скромным”, без навязывания архитектуры:
- `Revision(u64)` newtype + сериализация,
- `RevisionCounter` (atomics) или `RwLock<u64>` для bump,
- утилита: “bump + emit invalidation” (в будущем — через feature‑flag, чтобы не тянуть Tauri как жёсткую зависимость).

Важно: **никаких reducers/actions/store‑архитектур** — это вне рамок `state-sync` (v0).

---

### Стратегия тестирования (Testing plan)

#### Contract tests (обязательные)
Одинаковые сценарии должны проходить на любом транспорте:
- **Late‑join safe**: окно B стартует после изменений и догоняет по `refresh`.
- **Missed event tolerant**: событие “теряется”, но на следующем invalidation окно всё равно догоняет снапшотом.
- **Out‑of‑order events**: меньшая revision не ломает состояние.
- **Coalescing**: два быстрых invalidation → один фактический snapshot fetch (если refresh уже в полёте).
- **Topic isolation**: invalidation для другого `topic` не триггерит refresh.
- **Protocol validation (events)**: пустой/отсутствующий `topic`, неканоничная `revision` (например, `"01"`) → `onError(phase='protocol')` + игнор.
- **Protocol validation (snapshot)**: snapshot с неканоничной `revision` → `onError(phase='protocol')` + refresh reject.
- **Stop quiescence**: после `stop()` никакие события/завершения in‑flight refresh не приводят к `apply`.
- **Start failure cleanup**: если initial refresh упал — listener не “утёк” (unsubscribe был вызван).

#### Unit tests
- `shouldRefresh` фильтрация (topic/sourceId),
- обработка ошибок snapshot (корректный `onError` контекст),
- retry/backoff policy (как `SnapshotProvider` wrapper) — контракт поведения wrapper’а.

Итерация 0001: тесты запускаются через in‑memory transport, моделируя 2 “виртуальных окна”.

---

### Качество / Tooling gates

TypeScript:
- Biome: lint+format+organize imports
- `tsc --noEmit`: строгая типизация
- Vitest: тесты и контракты

Rust:
- `cargo fmt`
- `cargo clippy --all-targets -- -D warnings`

Важно: gates должны быть быстрыми, чтобы не мешать итерации.

---

### План работ итерации 0001 (Work breakdown)

#### A) Design lock (дизайн “замораживаем”)
- [ ] зафиксировать инварианты протокола (секция выше) как “source of truth”
- [ ] зафиксировать API v0 (типы/интерфейсы/поведение) без двусмысленностей
- [ ] зафиксировать границы слоёв и будущие пакеты (core/tauri/broadcast)

#### B) Core contracts (под реализацию)
- [ ] описать contract tests как “spec” (Given/When/Then)
- [ ] определить обязательные failure‑modes (missed event, out‑of‑order, refresh error, protocol invalid revision)

#### C) Acceptance criteria (Definition of Done)
Готово, когда:
- [ ] дизайн‑док полностью определяет поведение (нет критичных “TODO: decide later”)
- [ ] есть список контрактных сценариев, который можно автоматизировать без трактовок
- [ ] зафиксированы quality gates для TS/Rust

---

### Риски и митигейшены

- **Риск: taxonomy `topic` расползётся и станет “магией”**  
  **Митигейшен**: `topic` обязателен, поэтому держим его набор маленьким и стабильным: оформляем как константы/enum в consumer‑коде, документируем, и меняем только через review/ADR.

- **Риск: engine начнёт тащить политику приложения (backoff, retry, throttle)**  
  **Митигейшен**: политики через опции/интерфейсы, по умолчанию минимально.

- **Риск: “универсальность” превратит API в слишком абстрактный**  
  **Митигейшен**: держим v0 маленьким, делаем примеры/адаптеры в отдельных пакетах.

---

### Открытые вопросы (для будущих итераций, не блокируют v0)

- Нужен ли явный `protocolVersion` в event payload (например, `v: 1`) или достаточно контрактов/semver пакета?
- Хотим ли в v1 сделать `stop()` async и/или поддержку отмены in‑flight refresh (AbortSignal)?

---

### Следующие итерации (наметка)

- `0002`: реализация TS core + in‑memory transport + contract tests
- `0003`: tauri‑transport adapters (listen/emit/invoke), contract tests на transport‑контракт
- `0004`: broadcast‑transport adapter (BroadcastChannel) + contract tests
- `0005`: adapters для популярных state‑контейнеров (пример: Pinia/React) как optional слой (без влияния на core)

