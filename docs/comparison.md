# Сравнение state-sync с конкурентами

Объективное сравнение `state-sync` с существующими решениями для синхронизации состояния между окнами, вкладками и процессами.

> **Фокус**: Tauri multi-window приложения

---

## TL;DR — Сводная таблица

| Решение | ⭐ GitHub | Транспорт | Framework | Ordering | Tauri | Паттерн |
|---------|----------|-----------|-----------|----------|-------|---------|
| **state-sync** | — | Any (pluggable) | Pinia, Zustand, Valtio, Svelte, Vue | Revision ✅ | Native | Invalidate→Fetch→Apply |
| [zubridge](https://github.com/goosewobbler/zubridge) | 44 | Tauri IPC | Any | None | Native ✅ | Redux-like actions |
| [TauRPC](https://github.com/MatsDK/TauRPC) | 296 | Tauri IPC | Any | None | Native ✅ | Typesafe RPC |
| [tauri-specta](https://github.com/specta-rs/tauri-specta) | 652 | Tauri IPC | Any | None | Native ✅ | Typesafe commands |
| [rspc](https://github.com/oscartbeaumont/rspc) | 1,361 | Tauri/Axum | React | None | Adapter | tRPC-like |
| [electron-redux](https://github.com/klarna/electron-redux) | 758 | Electron IPC | Redux | None | ❌ | Action sync |
| [redux-state-sync](https://github.com/aohua/redux-state-sync) | 244 | BroadcastChannel | Redux | None | ❌ | Action sync |
| [pinia-shared-state](https://github.com/wobsoriano/pinia-shared-state) | 298 | BroadcastChannel | Pinia | None | ❌ | State broadcast |
| [zustand-sync-tabs](https://github.com/react18-tools/zustand-sync-tabs) | 43 | BroadcastChannel | Zustand | None | ❌ | State broadcast |
| [persist-and-sync](https://github.com/react18-tools/persist-and-sync) | 48 | BroadcastChannel | Zustand | None | ❌ | State + persist |
| [Jotai](https://github.com/pmndrs/jotai) (atomWithBroadcast) | 20,968 | BroadcastChannel | Jotai | None | ❌ | Atom broadcast |
| [Zustand](https://github.com/pmndrs/zustand) | 56,877 | — | React | — | ⚠️ Manual | — |
| [Valtio](https://github.com/pmndrs/valtio) | 10,115 | — | React | — | ⚠️ Manual | Proxy |
| [MobX](https://github.com/mobxjs/mobx) | 28,171 | — | Any | — | ⚠️ Manual | Observable |
| [Effector](https://github.com/effector/effector) | 4,818 | — | Any | — | ⚠️ Manual | Event-driven |
| [effector-storage](https://github.com/yumauri/effector-storage) | 108 | BroadcastChannel | Effector | None | ❌ | Event sync |
| [Rematch](https://github.com/rematch/rematch) | 8,433 | — | Redux | — | ⚠️ Manual | Redux simplified |
| [localsync](https://github.com/noderaider/localsync) | 63 | localStorage | Any | None | ❌ | Storage events |
| [storeon/crosstab](https://github.com/storeon/crosstab) | 54 | BroadcastChannel | Storeon | None | ❌ | Action sync |
| [TinyBase](https://github.com/tinyplex/tinybase) | 4,887 | Any | Any | CRDT | ⚠️ Manual | Reactive tables |
| [Yjs](https://github.com/yjs/yjs) | 21,161 | Any | Any | CRDT | ⚠️ Manual | Shared types |
| [SyncedStore](https://github.com/YousefED/SyncedStore) | 1,857 | Yjs providers | React/Vue | CRDT | ⚠️ Manual | Proxy over Yjs |
| [Replicache](https://github.com/rocicorp/replicache) | 1,173 | HTTP + WS | Any | Server | ❌ | Client-server sync |

---

## Категория 1: Tauri-native решения

### zubridge ⭐ 44

**GitHub**: [goosewobbler/zubridge](https://github.com/goosewobbler/zubridge)

Redux-like state management для Tauri и Electron. Единый store в backend, синхронизация через IPC.

**Архитектура:**
```
Frontend: dispatch({ type: 'INCREMENT' })
    ↓ IPC
Backend: process_action() → update state
    ↓ broadcast
All windows: receive new state
```

**Плюсы:**
- ✅ Redux-like паттерн (actions/reducers) — знакомый многим
- ✅ Single source of truth в Rust backend
- ✅ Multi-window broadcast из коробки
- ✅ Работает с любым frontend framework
- ✅ TypeScript типы

**Минусы:**
- ❌ **Нет ordering** — actions могут прийти out-of-order
- ❌ **Нет coalescing** — каждый action = IPC call
- ❌ **Нет error hooks** — только try/catch
- ❌ Требует писать reducer в Rust
- ❌ Молодой проект (44 звезды)

**Когда выбрать:**
Хотите Redux-like паттерн и готовы писать логику в Rust.

---

### TauRPC ⭐ 296

**GitHub**: [MatsDK/TauRPC](https://github.com/MatsDK/TauRPC)

Typesafe bidirectional IPC для Tauri. Генерирует TypeScript типы из Rust в runtime.

**Особенности:**
- Specta под капотом для type-generation
- События backend→frontend с типами
- Trait-based API (вдохновлён tarpc)

**Плюсы:**
- ✅ Полная типобезопасность
- ✅ Bidirectional: commands + events
- ✅ Генерация типов автоматически

**Минусы:**
- ❌ **Не решает multi-window sync** — только IPC
- ❌ Нужно самому реализовывать broadcast
- ❌ Нет state management — только transport

**Когда выбрать:**
Нужен typesafe IPC, state sync реализуете сами.

---

### tauri-specta ⭐ 652

**GitHub**: [specta-rs/tauri-specta](https://github.com/specta-rs/tauri-specta)

Typesafe Tauri commands с генерацией TypeScript.

**Особенности:**
- Конвертирует Rust команды в TypeScript декларации
- Поддержка events в v2

**Плюсы:**
- ✅ Официально поддерживается specta-rs
- ✅ Простая интеграция
- ✅ Events support

**Минусы:**
- ❌ **Не state management** — только type bindings
- ❌ Multi-window sync — ваша задача

**Когда выбрать:**
Хотите типобезопасные команды, sync реализуете отдельно.

---

### rspc ⭐ 1,361

**GitHub**: [oscartbeaumont/rspc](https://www.rspc.dev/)

"tRPC для Rust" — typesafe API между Rust и TypeScript.

**Особенности:**
- Работает с Tauri, Axum, Warp, Actix
- React Query интеграция на frontend
- TypeScript declaration file генерируется из Rust

**Плюсы:**
- ✅ Зрелый проект (1.3k звёзд)
- ✅ tRPC-like DX
- ✅ React Query = caching, refetching

**Минусы:**
- ❌ **Не для multi-window sync** — для client-server API
- ❌ Фокус на React
- ❌ Больше про API, чем про state sync

**Когда выбрать:**
Строите API-heavy приложение, нужен tRPC-like опыт.

---

### Официальный подход Tauri

**Docs**: [v2.tauri.app/develop/state-management](https://v2.tauri.app/develop/state-management/)

Rust backend как single source of truth + events для broadcast.

**Паттерн:**
```rust
// Backend
app.manage(Mutex::new(AppState::default()));
app.emit("state-changed", &new_state);

// Frontend
await listen("state-changed", (event) => { ... });
await invoke("update_state", { ... });
```

**Плюсы:**
- ✅ Нет зависимостей
- ✅ Полный контроль
- ✅ Официальный подход

**Минусы:**
- ❌ Много boilerplate
- ❌ **Нет ordering** — events могут прийти в любом порядке
- ❌ **Нет coalescing**
- ❌ Error handling — ваша задача

---

## Категория 2: Browser-only (State Manager Plugins)

### redux-state-sync ⭐ 244

**GitHub**: [aohua/redux-state-sync](https://github.com/aohua/redux-state-sync)

Middleware для Redux, синхронизирует actions через BroadcastChannel.

**Как работает:**
```
Tab A: dispatch(action) → BroadcastChannel → Tab B: dispatch(action)
```

**Плюсы:**
- ✅ Whitelist/blacklist actions
- ✅ Fallback на localStorage (pubkey/broadcast-channel)
- ✅ Интеграция с redux-persist

**Минусы:**
- ❌ **Только Redux**
- ❌ **Только браузер** — не для Tauri IPC
- ❌ **Нет ordering** — actions могут прийти out-of-order
- ❌ Actions должны быть сериализуемыми (no functions)

**Детали реализации:**
- Использует [pubkey/broadcast-channel](https://github.com/pubkey/broadcast-channel) с fallback
- broadcastChannelOption позволяет выбрать: `native`, `idb`, `localstorage`, `node`

---

### electron-redux ⭐ 758

**GitHub**: [klarna/electron-redux](https://github.com/klarna/electron-redux)

Store enhancer для синхронизации Redux между main и renderer в Electron.

**Как работает:**
- Main process имеет "главный" store
- Renderer processes синхронизируются через IPC
- Actions с `scope: 'local'` не пробрасываются

**Плюсы:**
- ✅ Зрелое решение от Klarna
- ✅ Action scopes (local/global)
- ✅ Custom serialization

**Минусы:**
- ❌ **Только Electron** — не Tauri
- ❌ **Только Redux**
- ❌ **"Loose sync"** — кратковременные рассинхронизации возможны
- ❌ Serialization обязательна

**Вдохновение:**
zubridge вдохновлён этим проектом.

---

### pinia-shared-state ⭐ 298

**GitHub**: [wobsoriano/pinia-shared-state](https://github.com/wobsoriano/pinia-shared-state)

Plugin для Pinia для sync между вкладками браузера.

**Использование:**
```ts
import { PiniaSharedState } from 'pinia-shared-state'

pinia.use(PiniaSharedState({
  enable: true,
  initialize: true, // recover state from other tabs
  type: 'native', // or 'idb', 'localstorage'
}))
```

**Плюсы:**
- ✅ Очень простой API
- ✅ `initialize: true` — новая вкладка получает текущее состояние
- ✅ `omit` option для исключения полей
- ✅ Vue 2/3

**Минусы:**
- ❌ **Только Pinia**
- ❌ **Только браузер**
- ❌ **Нет ordering**
- ❌ Нет structured error handling

---

### zustand-sync-tabs ⭐ 43 / persist-and-sync ⭐ 48

**GitHub**: [react18-tools/zustand-sync-tabs](https://github.com/react18-tools/zustand-sync-tabs)

Middleware для Zustand для sync между вкладками.

**Использование:**
```ts
import { create } from 'zustand'
import { persistNSync } from 'persist-and-sync'

const useStore = create(
  persistNSync(
    (set) => ({ count: 0, inc: () => set((s) => ({ count: s.count + 1 })) }),
    { name: 'my-store' }
  )
)
```

**Плюсы:**
- ✅ ~1 KB
- ✅ Exclude fields via regex
- ✅ persist-and-sync = sync + localStorage persistence

**Минусы:**
- ❌ **Только Zustand**
- ❌ **Только браузер**
- ❌ **Нет ordering**

---

### Jotai atomWithBroadcast ⭐ 20,968 (Jotai)

**Docs**: [jotai.org/docs/recipes/atom-with-broadcast](https://jotai.org/docs/recipes/atom-with-broadcast)

Recipe для создания атомов с BroadcastChannel sync.

**Использование:**
```ts
import { atomWithBroadcast } from './atomWithBroadcast'

const countAtom = atomWithBroadcast('count', 0)
```

**Плюсы:**
- ✅ Встроено в Jotai ecosystem
- ✅ Атомарный подход — sync только нужных атомов

**Минусы:**
- ❌ **Только Jotai**
- ❌ **Нет initial sync** — новая вкладка не получает текущее состояние
- ❌ Отправляет весь объект при каждом изменении
- ❌ **Только браузер**

**Альтернатива:** `atomWithStorage` — использует localStorage с storage events.

---

### effector-storage ⭐ 108

**GitHub**: [yumauri/effector-storage](https://github.com/yumauri/effector-storage)

Persist и sync для Effector stores.

**Адаптеры:**
- `effector-storage/local` — localStorage + auto-sync между вкладками
- `effector-storage/session` — sessionStorage
- `effector-storage/broadcast` — BroadcastChannel only (без persist)

**Использование:**
```ts
import { persist } from 'effector-storage/local'

persist({ store: $counter, key: 'counter' })
// Автоматически синхронизируется между вкладками
```

**Плюсы:**
- ✅ Несколько адаптеров
- ✅ Sync between instances
- ✅ Custom serialization

**Минусы:**
- ❌ **Только Effector**
- ❌ **Только браузер**
- ❌ **Нет ordering**

---

### mobx-sync ⭐ 147

**GitHub**: [acrazing/mobx-sync](https://github.com/acrazing/mobx-sync)

Persist MobX store в localStorage.

**Плюсы:**
- ✅ SSR support
- ✅ Custom serialization

**Минусы:**
- ❌ **Sync только при переключении вкладки** — не realtime
- ❌ **Только MobX**
- ❌ **Только браузер**

---

### localsync ⭐ 63

**GitHub**: [noderaider/localsync](https://github.com/noderaider/localsync)

Framework-agnostic sync через localStorage events.

**Стратегии:**
- `storagesync` — localStorage storage events
- `cookiesync` — cookie polling (fallback)
- `serversync` — mock для SSR

**Плюсы:**
- ✅ Framework-agnostic
- ✅ Автовыбор лучшей стратегии

**Минусы:**
- ❌ **localStorage events медленнее** чем BroadcastChannel
- ❌ Давно не обновлялся (5+ лет)
- ❌ **Только браузер**

---

## Категория 3: CRDT / Collaborative

### TinyBase ⭐ 4,887

**Website**: [tinybase.org](https://tinybase.org/)

Reactive data store с CRDT support.

**Архитектура:**
- Табличная модель данных (tables, rows, cells)
- CRDT для merge без конфликтов
- Sync через BroadcastChannel, WebSocket, custom

**Использование:**
```ts
import { createStore } from 'tinybase'
import { createLocalSynchronizer } from 'tinybase/synchronizers/synchronizer-local'

const store = createStore()
const synchronizer = createLocalSynchronizer(store)
await synchronizer.startSync()
```

**Плюсы:**
- ✅ CRDT — автоматическое разрешение конфликтов
- ✅ 5-12 KB, zero deps
- ✅ Persistence: IndexedDB, SQLite, PostgreSQL
- ✅ React hooks
- ✅ Schema validation (Zod, Yup, etc.)

**Минусы:**
- ❌ **Своя модель данных** — не обычный state
- ❌ Learning curve
- ❌ Overkill для "sync settings"
- ❌ **Нет Tauri adapter** — нужно писать свой

**Когда выбрать:**
Collaborative apps, offline-first, готовы к новому API.

---

### Yjs ⭐ 21,161

**GitHub**: [yjs/yjs](https://github.com/yjs/yjs)

Высокопроизводительная CRDT библиотека.

**Shared types:**
- `Y.Map` — key-value
- `Y.Array` — list
- `Y.Text` — rich text с cursor positions

**Плюсы:**
- ✅ **Самая быстрая CRDT**
- ✅ Awareness protocol (cursors, presence)
- ✅ Любой транспорт

**Минусы:**
- ❌ **Сложный API** (`doc.getMap("x").get("y")`)
- ❌ **Overkill** для простого state sync
- ❌ Требует sync server или WebRTC
- ❌ **Нет Tauri adapter**

**Когда выбрать:**
Collaborative text editing, multiplayer.

---

### SyncedStore ⭐ 1,857

**GitHub**: [YousefED/SyncedStore](https://github.com/YousefED/SyncedStore)

Proxy-based wrapper над Yjs.

**Использование:**
```ts
const store = syncedStore({ todos: [] })

// Простой API вместо Yjs
store.todos.push({ title: 'Buy milk' })
```

**Плюсы:**
- ✅ Yjs под капотом, но простой API
- ✅ Auto-detect используемых свойств → optimized re-renders

**Минусы:**
- ❌ Всё ещё CRDT complexity
- ❌ **Нет Tauri adapter**

---

## Категория 4: Server-centric

### Replicache ⭐ 1,173 (Maintenance mode)

**Website**: [replicache.dev](https://replicache.dev/)

Client-side sync для local-first apps.

**Модель:**
- Mutations применяются локально мгновенно
- Push mutations на сервер в background
- Pull changes + conflict resolution

**Статус:** В maintenance mode. Используйте **Zero** для новых проектов.

---

### Zero (Rocicorp)

**Website**: [zero.rocicorp.dev](https://zero.rocicorp.dev/)

Следующее поколение от создателей Replicache.

**Особенности:**
- PostgreSQL как source of truth
- Partial sync — не качает всю базу
- 0ms latency UI

**Статус:** Public alpha.

**Не для multi-window** — для client-server sync.

---

## Сравнение архитектурных подходов

### 1. Action Broadcasting (redux-state-sync, electron-redux, zubridge)

```
Window A: dispatch(action)
    ↓ broadcast
Window B: dispatch(action)
```

**Проблема:** Actions могут прийти out-of-order. Результат зависит от timing.

**Пример race condition:**
```
Window A: dispatch({ type: 'SET', value: 1 })
Window B: dispatch({ type: 'SET', value: 2 })
// Результат: кто последний, тот и прав
```

---

### 2. State Broadcasting (pinia-shared-state, zustand-sync-tabs)

```
Window A: setState(newState)
    ↓ broadcast(newState)
Window B: setState(newState)
```

**Проблема:** При rapid updates — race conditions.

---

### 3. CRDT Merging (Yjs, TinyBase)

```
Window A: op1
Window B: op2
    ↓ merge
Result: deterministic merge(op1, op2)
```

**Проблема:** Complexity overkill для простых случаев.

---

### 4. Revision-based Snapshots (state-sync)

```
Source: change → emit invalidation(topic)
    ↓
All subscribers: receive invalidation
    ↓
Each: fetch snapshot → check revision > local → apply
```

**Преимущества:**
- ✅ **Ordering гарантирован** через revision
- ✅ **Coalescing** — rapid invalidations объединяются
- ✅ Single source of truth (backend)
- ✅ Out-of-order events отбрасываются автоматически

---

## Честное сравнение: state-sync vs zubridge

| Аспект | state-sync | zubridge |
|--------|------------|----------|
| **Паттерн** | Invalidate→Fetch→Apply | Actions→Reducer |
| **Ordering** | ✅ Revision-based | ❌ None |
| **Coalescing** | ✅ Built-in | ❌ None |
| **Error handling** | ✅ Phase-based hooks | ❌ try/catch |
| **Boilerplate** | Medium | Low |
| **Learning curve** | New model | Redux-like (familiar) |
| **Звёзды** | — | 44 |
| **Maturity** | New | New |

### Когда выбрать zubridge:
- Команда знает Redux
- Не критичен порядок событий
- Простые actions без rapid updates

### Когда выбрать state-sync:
- Важен ordering (config sync, auth state)
- Rapid updates (typing indicators, live data)
- Нужен structured error handling
- Используете Pinia, Zustand, Valtio, Svelte или Vue (есть адаптеры)

---

## Таблица выбора для Tauri

| Сценарий | Рекомендация |
|----------|--------------|
| **Sync settings между окнами** | **state-sync** (ordering важен) |
| **Redux-like паттерн** | zubridge |
| **Typesafe commands** | tauri-specta |
| **Typesafe bidirectional IPC** | TauRPC |
| **tRPC-like API** | rspc |
| **Collaborative editing** | Yjs + custom transport |
| **Sync Zustand/Valtio/Svelte/Vue store** | **state-sync** (adapters available) |
| **Простой state без sync** | Zustand / Pinia |
| **Maximum control** | Tauri events manually |

---

## Честные минусы state-sync

1. **Не CRDT** — не для collaborative editing с concurrent edits
2. **Snapshot-based** — передаётся весь snapshot, не patches
3. **Новая библиотека** — меньше community, battle-testing
4. **Требует backend** — snapshot provider в Rust
5. **Learning curve** — новая модель (invalidate→fetch→apply)

---

## Ссылки

### Tauri-native
- [zubridge](https://github.com/goosewobbler/zubridge) — Redux-like для Tauri/Electron
- [TauRPC](https://github.com/MatsDK/TauRPC) — Typesafe bidirectional IPC
- [tauri-specta](https://github.com/specta-rs/tauri-specta) — Typesafe commands
- [rspc](https://www.rspc.dev/) — tRPC для Rust
- [Tauri State Management](https://v2.tauri.app/develop/state-management/) — Official docs

### Browser-only State Manager Plugins
- [redux-state-sync](https://github.com/aohua/redux-state-sync)
- [electron-redux](https://github.com/klarna/electron-redux)
- [pinia-shared-state](https://github.com/wobsoriano/pinia-shared-state)
- [zustand-sync-tabs](https://github.com/react18-tools/zustand-sync-tabs)
- [persist-and-sync](https://github.com/react18-tools/persist-and-sync)
- [effector-storage](https://github.com/yumauri/effector-storage)
- [mobx-sync](https://github.com/acrazing/mobx-sync)
- [localsync](https://github.com/noderaider/localsync)

### CRDT / Collaborative
- [TinyBase](https://tinybase.org/)
- [Yjs](https://github.com/yjs/yjs)
- [SyncedStore](https://github.com/YousefED/SyncedStore)

### Server-centric
- [Replicache](https://replicache.dev/) (maintenance mode)
- [Zero](https://zero.rocicorp.dev/) (alpha)

### Статьи
- [Tauri multi-window state sync (Hopp)](https://www.gethopp.app/blog/tauri-window-state-sync)
- [Unifying State in Tauri](https://medium.com/@ssamuel.sushant/unifying-state-across-frontend-and-backend-in-tauri-a-detailed-walkthrough-3b73076e912c)
- [Moving from Electron to Tauri](https://www.umlboard.com/blog/moving-from-electron-to-tauri-1/)
