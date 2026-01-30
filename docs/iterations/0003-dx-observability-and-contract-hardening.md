## Iteration 0003 — `state-sync`: DX + Observability + Contract Hardening (Google‑style design doc)

**Статус**: Draft  
**Дата**: 2026‑01‑30  
**Цель итерации**: поднять библиотеку на уровень “приятно и безопасно использовать внешним командам”, без привязки к конкретному продукту: улучшить наблюдаемость (phases/контекст), усилить контрактные тесты (engine+transport together), зафиксировать DX‑политику (peer/optional, примеры), и устранить технические риски в core loop (non‑recursive refresh queue).

---

### TL;DR

Итерации `0001–0002` дали нам: протокол, publish‑готовые пакеты, CI, базовые тесты и документацию.  
`0003` — это “качество для внешних специалистов”: **более точные фазы ошибок**, **контрактные интеграционные тесты**, **устойчивость core loop**, и **DX‑поверхность** (policy/примеры/гайды) так, чтобы библиотека была предсказуемой при встраивании в разные приложения/архитектуры.

Ключевая идея: **не добавлять новую функциональность протокола**, а сделать текущий протокол *легко дебажимым*, *трудно поломать*, и *комфортным* для интеграции.

---

### Owners / Reviewers (процесс)

- **Owner**: maintainer `state-sync` (вы)
- **Reviewers** (рекомендуем минимум): 1 человек, который *не писал* core engine, и 1 человек, который будет интегрировать библиотеку в продукт позже
- **Decision rule**: все “contract changes” (поведение/фазы/semver) фиксируем как locked decisions внутри этого doc, чтобы не расползлось в имплементации.

---

### Контекст / Current state (что уже есть)

Пакеты:
- `state-sync` (core): engine + revision utils + types + `withRetry(provider)` wrapper.
- `state-sync-pinia`: framework adapter (applier) для Pinia‑совместимых store.
- `state-sync-tauri`: transport adapter (subscriber + provider) поверх Tauri events + invoke.

Качество:
- есть unit/contract tests для core, adapter tests, transport tests.
- есть сборка `tsup` (ESM + CJS + d.ts), `exports`, `CI`, `changesets` infra, docs (`lifecycle`, `compatibility`, `troubleshooting`).

Не‑часть библиотеки:
- конкретная интеграция “source of truth” (команды/сервисы в приложении‑потребителе) — вне scope.

---

### Problem statement

Даже если библиотека publish‑готова, внешние команды будут сталкиваться с типовыми проблемами:

1) **Слабая наблюдаемость**: “где упало — в provider или в applier?”  
Сейчас ошибок достаточно, чтобы понять “что-то сломалось”, но не всегда достаточно, чтобы быстро локализовать источник.

2) **Слабые end‑to‑end контракты**: unit‑тесты проверяют части по отдельности, но не всегда ловят ошибки композиции “transport → engine”.

3) **Риск в core refresh loop**: рекурсивная схема “queued refresh → await refresh()” может быть корректной, но менее прозрачной, и теоретически рискованной под постоянным burst‑load.

4) **DX неоднозначности**: optional peer зависимости, политика версий/совместимости, примеры “source of truth” (без привязки к продукту) — должны быть максимально ясными и не допускать “двух правильных путей”.

---

### Goals

#### Product goals (для внешних пользователей)
- Ошибки и логи позволяют быстро понять **где** и **почему** произошёл сбой.
- Есть понятный “happy path” пример использования без привязки к конкретному приложению.
- Встроить библиотеку можно без сюрпризов в типичные окружения (Node/Vite/Tauri).

#### Engineering goals
- Явный контракт фаз (`SyncPhase`) соответствует реальному месту падения.
- Есть интеграционные контрактные тесты engine+transport.
- Core loop проще анализировать и безопасен при burst invalidations.
- DX‑policy зафиксирована в docs и согласована с package metadata.

---

### Success metrics (как поймём, что стало лучше)

#### Debuggability / Observability
- В 90% типовых падений интегратор может по одному `SyncErrorContext.phase` понять “где чинить”: `subscribe` vs `getSnapshot` vs `apply` vs `protocol`.
- В `onError` всегда доступен минимальный контекст: `phase`, `topic`, `error`, а для `protocol` — `sourceEvent`.

#### Reliability / Contracts
- Есть минимум 2 интеграционных теста “transport → engine”, которые ловят дрейф payload shape (garbage payload / non‑canonical revision).
- Переписывание refresh queue не меняет контрактов coalescing/stop‑quiescence (регрессы ловятся тестами).

#### DX
- Документация содержит один “happy path” end‑to‑end example (без product ties) и одну секцию “pitfalls”.
- Политика peer dependencies понятна (особенно `@tauri-apps/api`).

---

### Non‑goals

- Не добавляем CRDT/конфликт‑резолвинг beyond “revision gate”.
- Не добавляем новый transport/adapter ради самой функции (это отдельная итерация, если нужно).
- Не делаем интеграцию в VoicetextAI (будет отдельный план/итерация).
- Не меняем базовые locked decisions `0001` (revision/topic/invalidation‑only) кроме уточнения observability контракта.

---

### Priorities

- **P0 (must)**: повышает надёжность/контракты так, что без этого нельзя “массово” отдавать библиотеку.
- **P1 (should)**: заметно улучшает DX/наблюдаемость, но не блокирует интеграции.
- **P2 (nice)**: улучшения после стабилизации.

---

### Locked decisions (фиксируем сейчас, чтобы не было вилок)

1) **Error phases становятся точными**:
   - provider errors → `getSnapshot`
   - applier errors → `apply`
   - `refresh` остаётся только как “fallback umbrella”, если реально не удалось точнее классифицировать
2) **Refresh queue переписываем без рекурсии** (loop), сохраняя текущие поведенческие инварианты (coalescing/stop‑quiescence).
3) **Transport остаётся тонким**: не “лечит” payload, а core валидирует и репортит `protocol` (интеграционные тесты должны это гарантировать).
4) **`@tauri-apps/api`**: политика peer deps должна быть явно описана; текущая рекомендация — optional peer с чётким пояснением в README.

---

### Principles / invariants (не ломаем)

Из `0001`:
- **Event = invalidation**, **snapshot = source of truth**, **revision = canonical u64 decimal string**.
- Engine применяет snapshot только если он “новее” текущей локальной revision (и обязан корректно применить initial snapshot, даже если revision `"0"`).
- Transport adapters остаются тонкими и не внедряют бизнес‑семантику.

---

### Design: Observability & error phases

#### Проблема
Сейчас `SyncPhase` включает `getSnapshot` и `apply`, но engine может репортить ошибки агрегировано как `refresh`, из‑за чего интегратор теряет точную локализацию.

#### Решение (design)
Разделить ошибки по фазам в core:

- `phase = 'getSnapshot'`: падение внутри `provider.getSnapshot()`
- `phase = 'apply'`: падение внутри `applier.apply(envelope)`
- `phase = 'protocol'`: невалидный topic/revision/format
- `phase = 'subscribe'`: падение внутри `subscriber.subscribe`
- `phase = 'refresh'`: reserved umbrella для “unexpected” ошибок refresh loop (в идеале становится редким)

Дополнительно:
- `SyncErrorContext` должен (по возможности) содержать:
  - `sourceEvent` для protocol‑ошибок (уже есть)
  - `attempt/willRetry/nextDelayMs` для retry‑политики (через wrapper) — уже предусмотрено типами; в 0003 можно добавить рекомендации/пример как прокидывать это из wrapper’а в onError.

#### Structured logs (рекомендованный контракт)

Чтобы интеграторы могли строить метрики/алерты, вводим рекомендацию: `logger` получает предсказуемые ключи в `extra`.

Рекомендованные поля:
- `topic`
- `phase`
- `localRevision?`
- `eventRevision?`
- `snapshotRevision?`
- `sourceId?` (если есть в event)
- `error` (только в error‑логах)

**Важно**: это рекомендация, а не жёсткий API. Но внутри core лучше придерживаться единых ключей.

#### Acceptance criteria
- Engine **всегда** отправляет `phase='getSnapshot'` при ошибке provider и `phase='apply'` при ошибке applier.
- Никакие исключения из `onError` не должны ломать engine.
- Добавить тесты:
  - provider throws → `onError.phase === 'getSnapshot'`
  - applier throws → `onError.phase === 'apply'`

---

### Design: Core loop hardening (non‑recursive refresh queue)

#### Проблема
Рекурсия “если queued → await refresh()” может усложнять reasoning и теоретически увеличивает риск длинных цепочек при burst invalidations.

#### Решение
Переписать очередь refresh на явный цикл:
- гарантировать максимум 1 queued refresh;
- выполнять refresh последовательно внутри `while (queued)` без рекурсии;
- сохранять текущие свойства:
  - coalescing
  - stop‑quiescence (не применять после stop)
  - start cleanup on failure

#### Reference pseudocode

```text
refresh():
  if stopped -> return
  if inFlight -> queued=true; return
  inFlight=true
  try:
    loop:
      queued=false
      envelope = provider.getSnapshot()   // phase=getSnapshot on error
      validate envelope.revision          // phase=protocol on error
      if stopped -> break
      if shouldApply(envelope):
        applier.apply(envelope)           // phase=apply on error
        update localRevision
      if stopped -> break
      if !queued -> break
  finally:
    inFlight=false
```

#### Acceptance criteria
- Поведение coalescing не ухудшается (тот же контракт: burst invalidations → не больше “разумного” числа getSnapshot).
- Добавить/обновить тест на burst‑load:
  - “N rapid invalidations result in at most 2 refresh calls” остаётся зелёным.
- Никаких new race regressions (stop during in‑flight refresh → no apply).

---

### Design: Transport+Engine integrated contracts

#### Проблема
Транспортные тесты проверяют “проброс payload”. Engine‑тесты проверяют “валидация/refresh”. Но комбинация может ломаться незаметно (пример: payload shape drift).

#### Решение
Добавить integration contract tests:
- “tauri subscriber forwards garbage payload → engine reports protocol error, no crash, no apply”.
- “tauri provider returns non-canonical revision → engine reports protocol error”.

Тут важно:
- тесты не должны требовать real Tauri runtime (используем structural listen/invoke mocks).

#### Acceptance criteria
- 2–3 теста, которые собирают цепочку `transport -> engine` в одном тесте.
- Тесты стабильны, быстрые, deterministic.

---

### DX / Documentation improvements

#### 1) Peer dependency policy for `state-sync-tauri`

Выбор должен быть зафиксирован и отражён в docs:
- либо `@tauri-apps/api` required peer dependency (строгий DX),
- либо optional peer dependency (гибкость для тестов/не‑tauri окружений).

Рекомендация для v0:
- оставить optional peer dependency, но:
  - README должен явно говорить: “для реального Tauri runtime установите `@tauri-apps/api`”.

#### 2) “Source of truth” example (без привязки к конкретному продукту)

Нужен пример, который показывает правильный паттерн:
- invalidation event carries `(topic, revision)`
- consumers pull snapshot via provider
- revision gating in engine

Пример должен быть:
- минимальный
- platform‑agnostic (например, “HTTP endpoint” или “in-memory server”)
- без VoicetextAI‑специфики

#### 3) Decision doc updates

Обновить docs так, чтобы они отражали:
- phases (`getSnapshot/apply`) и что именно значит каждый phase
- refresh() до start(): подтверждённый контракт (уже есть в lifecycle.md — проверить соответствие реализации)

#### Acceptance criteria
- `docs/lifecycle.md` и `packages/*/README.md` согласованы с реализацией.
- Есть отдельный “Examples” раздел (или файл), который показывает end‑to‑end pattern.

---

### API / SemVer impact

#### Что меняется в публичном поведении
- `SyncPhase` значения становятся более точными: ошибки `provider` и `applier` получают `getSnapshot`/`apply` вместо более общего `refresh` (если ранее так было).
- Сигнатуры public API не меняются (no new required params).

#### SemVer recommendation
- До `1.0.0`: выпускать как **minor** (на всякий случай), потому что часть потребителей может матчить `phase` строкой.
- После `1.0.0`: такое изменение считать breaking only если обещали конкретный набор фаз как стабильный контракт.

#### Migration notes (для потребителей)

Если потребитель делает что-то вроде:
- `if (ctx.phase === 'refresh') { ... }`

то после 0003 правильнее:
- `if (ctx.phase === 'getSnapshot') { ... }`
- `if (ctx.phase === 'apply') { ... }`
- `refresh` считать “unknown bucket” (fallback) и просто логировать/алертить.

---

### Compatibility / Support policy (уточнение)

Цель — чтобы внешние команды не гадали:
- Node.js minimum (например `>=18`)
- TypeScript minimum (например `>=5.3`)
- Tauri API range для `state-sync-tauri`

Acceptance criteria:
- `docs/compatibility.md` совпадает с `package.json` engines/peer deps.
- CI matrix покрывает поддерживаемые Node versions.

---

### Alternatives considered (почему не так)

#### A) Оставить `phase='refresh'` как единственный сигнал
- **Pros**: меньше изменений.
- **Cons**: интеграторы тратят время на локализацию проблем; хуже метрики и triage.

#### B) Делать “богатый” error envelope в transport
- **Pros**: можно “лечить” часть payload ошибок раньше.
- **Cons**: transport начинает навязывать семантику; портит architecture (transport‑agnostic core).

#### C) Не трогать refresh queue
- **Pros**: ноль риска регресса.
- **Cons**: менее прозрачный reasoning; потенциально хуже under burst load.

---

### Work breakdown (deliverables)

#### Deliverable A (P0) — Observability phases
- [ ] Изменить core engine: обернуть `provider.getSnapshot()` так, чтобы ошибки репортились как `phase='getSnapshot'`
- [ ] Изменить core engine: обернуть `applier.apply(...)` так, чтобы ошибки репортились как `phase='apply'`
- [ ] Обновить/добавить тесты на phase correctness:
  - provider throws → `getSnapshot`
  - applier throws → `apply`
- [ ] Обновить документацию:
  - `docs/lifecycle.md` (описание phases)
  - `docs/troubleshooting.md` (как трактовать phases)

#### Deliverable B (P0) — Non‑recursive refresh queue
- [ ] Переписать refresh queue на loop (без рекурсии), сохранив “max 1 queued”
- [ ] Прогнать и сохранить существующие тесты coalescing/stop‑quiescence
- [ ] Добавить targeted regression tests:
  - burst invalidations остаётся “<= 2 getSnapshot”
  - stop во время in-flight refresh → no apply
  - refresh called concurrently (manual + invalidation) → корректное coalescing

#### Deliverable C (P0) — Transport+engine integration contracts
- [ ] Добавить интеграционный тест “tauri subscriber → engine”:
  - garbage payload (нет topic/revision) → `protocol` error, без crash, без apply
- [ ] Добавить интеграционный тест “tauri provider → engine”:
  - snapshot revision non-canonical → `protocol` error (и корректный cleanup start)
- [ ] Проверить, что тесты не требуют real tauri runtime (только mocks structural listen/invoke)

#### Deliverable D (P1) — DX policy & examples
- [ ] Зафиксировать peer policy (`@tauri-apps/api`) в README и docs (required vs optional + rationale)
- [ ] Добавить platform‑agnostic “source of truth” example (без product ties):
  - минимальный invalidation publisher (mock)
  - snapshot provider (mock)
  - демонстрация revision gate
- [ ] Сверить документацию с реализацией:
  - `refresh()` до start
  - `onError` throws
  - `start()` after `stop()`

#### Deliverable E (P2) — “Operational DX” polish
- [ ] Добавить “logging recipe” в docs: пример structured logs + пример метрик (count by phase/topic)
- [ ] Добавить smoke-import scripts (Node ESM + CJS) как часть CI или release checklist (если ещё нет)

---

### Testing strategy (подробно)

#### Unit/contract (core)
- Phase correctness: provider throws → `getSnapshot`, applier throws → `apply`.
- Invariants:
  - start is idempotent
  - stop is idempotent
  - refresh before start allowed (если контракт такой)
  - refresh after stop is no‑op
  - initial snapshot applied even if revision `"0"`

#### Integration contracts (transport+engine)
- garbage invalidation payload forwarded by transport:
  - engine emits protocol error
  - no crash
  - no apply
- snapshot provider returns non-canonical revision:
  - engine emits protocol error
  - start fails cleanly (unsubscribe)

#### Tooling gates
- `pnpm lint`
- `pnpm -r typecheck`
- `pnpm -r test`
- `pnpm -r build`
- Rust crate gates unchanged (fmt/clippy/test), если crate входит в support matrix

---

### Requirements → Tests matrix (чтобы не потерять покрытие)

| Requirement | Test type | Suggested test name (пример) | Where |
|------------|-----------|-------------------------------|-------|
| provider errors are `getSnapshot` | unit/contract | `provider throws -> phase getSnapshot` | `packages/core/tests/engine.test.ts` |
| applier errors are `apply` | unit/contract | `applier throws -> phase apply` | `packages/core/tests/engine.test.ts` |
| transport garbage payload doesn’t crash engine | integration | `tauri->engine garbage payload -> protocol error` | `packages/tauri/tests/*` |
| non-canonical snapshot revision reports protocol | integration | `tauri provider non-canonical -> protocol` | `packages/tauri/tests/*` |
| burst invalidations coalesce | unit/contract | `N invalidations -> <=2 refresh` | `packages/core/tests/engine.test.ts` |
| stop quiescence | unit/contract | `stop during in-flight -> no apply` | `packages/core/tests/engine.test.ts` |

---

### Rollout / release plan

1) Реализовать Deliverables A–C (P0) и прогнать gates (lint/typecheck/test/build).
2) Обновить docs (Deliverable D) и убедиться, что README/lifecycle/troubleshooting согласованы с реальным поведением.
3) Добавить changeset с описанием изменений (особенно: `SyncPhase` изменения).
4) Выпустить релиз как minor (до 1.0) и сделать smoke‑тест импорта (Node ESM + CJS) + пример из docs.

---

### Risks & mitigations

- **Breaking change in error phases**: пользователи могут парсить `phase` строкой.
  - Mitigation: документировать в changelog как behavior change; для v0 допускается как minor/patch только если не заявляем стабильность; лучше оформить как minor.
- **Regression в coalescing** после переписывания refresh queue:
  - Mitigation: сохранить существующие тесты и добавить targeted stress test.
- **Docs drift**:
  - Mitigation: DoD включает “docs agree with behavior” + tests cover lifecycle claims.

---

### Open questions

1) Должна ли `phase='refresh'` остаться в public API или заменить на более точные phases?  
Рекомендация: оставить как fallback, но в нормальном потоке почти не использовать.

2) Хотим ли мы стандартизировать “structured logs” (ключи extra) как контракт?  
Рекомендация: да, минимально: `{ topic, revision?, error, eventRevision?, localRevision? }`.

---

### Definition of Done

Итерация считается завершённой, когда:
- Engine репортит точные phases `getSnapshot/apply` и это покрыто тестами.
- Refresh queue не использует рекурсию и не регрессирует coalescing/stop‑quiescence.
- Есть transport+engine integration tests (минимум 2 сценария).
- DX‑policy зафиксирована (peer deps/optional, пример source‑of‑truth), docs согласованы с поведением.
- Есть changeset + релизные артефакты (changelog/version bump) для внешних потребителей.

