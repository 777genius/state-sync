## Iteration 0002 — `state-sync`: Production Readiness (packaging, CI, release)

**Статус**: Draft  
**Дата**: 2026‑01‑29  
**Цель итерации**: довести `state-sync` до состояния “можно безопасно отдавать в использование”, с предсказуемым релиз‑процессом и контролем качества.

---

### TL;DR

В `0001` мы зафиксировали протокол и сделали рабочие пакеты (`state-sync` core, `state-sync-pinia`, `state-sync-tauri`).  
В `0002` мы:

- добавляем **сборку** (dist + types + exports) для каждого пакета;
- добавляем **релиз‑процесс** (semver policy, changelog, versioning в монорепо);
- добавляем **CI gates** и минимальные security/quality правила;
- закрываем **критические баги/несостыковки**, чтобы не “выпустить бомбу” в продукт.

---

### Problem statement (что мешает “дать людям пользоваться”)

Сейчас библиотека “работает у нас локально”, но **не соответствует ожиданиям внешнего потребителя**:
- нет publish‑grade артефактов (`dist/`, `exports`, стабильные entrypoints, декларации типов);
- нет формализованных совместимостей (Node/Tauri/tooling), нет CI “from clean checkout”;
- нет стандартизированного релиз‑процесса (semver, changelog, changesets, release checklist);
- есть рискованные edge‑cases lifecycle/IPC payload, которые могут превратиться в утечки/краши.

Цель итерации — закрыть эти разрывы так, чтобы библиотеку можно было:
- безопасно подключать в разные проекты,
- проверять качественно в CI,
- релизить предсказуемо и воспроизводимо.

---

### Goals

#### Product goals
- Пакеты можно устанавливать/импортировать без “магии” (правильные `exports`, `types`, `dist/`).
- Пакеты совместимы с типичными окружениями сборки (Vite, Node ESM/CJS потребители).
- Релизы воспроизводимы: любой commit можно собрать/протестировать в CI одинаково.

#### Engineering goals
- Полный набор quality gates (lint/typecheck/test/build) в CI.
- Ясный semver policy для pre‑1.0 и после.
- Contract tests для core + transport‑контрактов (минимум для `state-sync-tauri`).

---

### Non-goals

- Интеграция в конкретные приложения (это делается в repo приложения‑потребителя отдельным планом).
- CRDT/OT/conflict‑resolution beyond LWW.
- Переезд на чужой state management framework.

---

### Current state (факты на сегодня)

Есть workspace с пакетами:
- `packages/core` → `state-sync` (engine + revision utils + tests)
- `packages/pinia` → `state-sync-pinia` (framework adapter + tests)
- `packages/tauri` → `state-sync-tauri` (transport adapter + tests)

Тесты проходят локально (`pnpm -r test`).

#### Status update (уже сделано в репо)

- **P0.1**: `start()` после `stop()` теперь запрещён (reject) + тест.
- **P0.2**: engine нормализует значения после runtime validation и не падает на “грязном” payload + тест.
- **P0.6 (частично)**: убраны `as any` в TS адаптерах (перешли на `unknown`/структурные типы).

---

### Priorities

- **P0 (must-fix)**: блокирует безопасное использование/публикацию.
- **P1 (should-fix)**: резко повышает качество/DX; желательно сделать до широкой раздачи.
- **P2 (nice-to-have)**: улучшения после того, как P0/P1 закрыты.

---

### P0 — Critical issues to fix before adoption (must-fix)

Ниже — потенциально опасные места, которые надо закрыть до передачи в использование.

#### P0.1) Lifecycle safety: `stop()` called before `start()` can cause a subscription leak

Сейчас `createRevisionSync()` позволяет:

- вызвать `stop()` (ставит `stopped=true`)
- потом вызвать `start()`:
  - `start()` не проверяет `stopped`
  - происходит `subscriber.subscribe(...)`
  - `stop()` повторно уже no-op → **unsubscribe не вызовется**

**Acceptance criteria**:
- `start()` MUST reject if called after `stop()`.
- Дополнительно: добавить тест “stop-before-start then start → rejects and does not subscribe”.

#### P0.2) Runtime type safety: валидируем, но используем “сырые” поля → возможен runtime-crash на грязном payload

IPC payload’ы **не типобезопасны**. Даже если TypeScript типы говорят `Revision`, на runtime может прилететь `number/null/object`.

Опасный паттерн:
- валидируем `revision/topic` через `unknown`,
- но дальше используем `event.revision`/`envelope.revision` из типизированного объекта,
- и получаем `TypeError` (например, `compareRevisions` читает `.length`, а прилетел `number`).

**Acceptance criteria**:
- engine MUST работать только с **нормализованными** значениями:
  - `const normalizedRevision = rawRevision as Revision`
  - `const normalizedTopic = rawTopic as Topic`
- engine MUST не падать при “грязном” event payload:
  - вместо crash → `onError(phase='protocol')` и игнор.
- добавить тесты:
  - invalidation event с `revision: 5 as any` не должен crash
  - invalidation event с `topic: 123 as any` не должен crash

#### P0.3) Packaging gap: нет `dist/`, нет `exports`, нет “consumer-grade” entrypoints

Сейчас пакеты “работают в workspace”, но не готовы как publishable artifacts.

**Acceptance criteria**:
- каждый пакет имеет:
  - `dist/` (ESM + CJS при необходимости)
  - `*.d.ts` (declaration output)
  - `package.json` fields: `exports`, `types`, `main/module` (если используем)

#### P0.4) CI-from-clean-checkout + lockfile discipline

Если проект нельзя собрать “с чистого” окружения, релизы станут непредсказуемыми.

**Acceptance criteria**:
- CI использует `pnpm install --frozen-lockfile`.
- CI гарантирует: `pnpm lint && pnpm -r typecheck && pnpm -r test && pnpm -r build` проходят “с нуля”.
- Никаких nested lockfiles/скрытых зависимостей по путям.

#### P0.5) Public API lifecycle contract: refresh() / start() / stop() / onError

Потребителю не очевидно, что можно/нельзя делать:
- что делает `refresh()` если `start()` ещё не вызывался?
- что делает `refresh()` после `stop()`?
- что будет, если `onError` бросает исключение?

**Acceptance criteria**:
- В docs явно зафиксировано поведение `RevisionSyncHandle`:
  - `start()` idempotent, `stop()` idempotent.
  - `refresh()` до `start()` — выбран и описан контракт (либо throw, либо разрешено).
  - `refresh()` после `stop()` не должен применять результат.
  - исключения из `onError` не должны ломать engine (ловим и логируем через `logger?.error`).
- Добавить тесты для выбранного поведения.

#### P0.6) Transport “safety baseline”: никаких “тихих” any-кастов без причины

Транспорт должен быть тонким, но не должен добавлять “ложной уверенности” типов.

**Acceptance criteria**:
- В `state-sync-tauri` заменить `as any` на `unknown` там, где возможно.
- Добавить тесты на “garbage payload” (минимум: subscriber не падает, engine не падает и репортит protocol error).

---

### Packaging & Build (design)

#### Decision: Build tool

Рекомендуемая схема (простая и стандартная для TS libs):
- `tsup` для сборки (ESM/CJS + sourcemaps + d.ts)
- `exports` map как single source of truth

Альтернатива: “pure tsc emit” (но тогда сложнее с dual ESM/CJS и exports map).

#### Required outputs per package

Для каждого publishable пакета:
- `dist/index.js` (ESM)
- `dist/index.cjs` (CJS) — опционально, но лучше для совместимости
- `dist/index.d.ts`
- sourcemaps

#### `package.json` contract (пример)

- `"type": "module"`
- `"exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" } }`

---

### Versioning & Release process (design)

#### Decision: Monorepo versioning

Рекомендуем:
- `changesets` (monorepo, удобно, стандартно)
- политика:
  - пока `<1.0.0`: разрешаем minor как breaking (но документируем)
  - после `1.0.0`: строго semver

#### Changelog

- auto‑generated per package (changesets)
- + ADR (минимум) для изменений протокола/публичного API

---

### CI (design)

Минимальный pipeline для root `state-sync/`:
- `pnpm install --frozen-lockfile` (lockfile обязателен)
- `pnpm lint`
- `pnpm -r typecheck`
- `pnpm -r test`
- `pnpm -r build` (после добавления build)
- Rust: `cargo fmt --check`, `cargo clippy -D warnings` (для crate)

CI должен запускаться на PR и на main.

---

### Testing expansion (contract-level)

#### Core contracts
- уже есть unit/contract tests (in-memory)
- ✅ добавлены тесты на lifecycle “stop-before-start”, “start-after-stop”
- (P0.5) добавить тест “onError throws — engine stays alive”
- (P0.5) добавить тесты на выбранный контракт `refresh()` до `start()`

#### Transport contracts
- `state-sync-tauri`:
  - тест, что subscriber корректно возвращает `unlisten` и что payload прокидывается
  - тест, что provider вызывает invoke и возвращает envelope
  - (optional) property-based tests на “payload may be garbage” (engine должен защищаться)

---

### P1 — Quality / DX improvements (should-fix)

#### P1.1) Publish metadata completeness

Публикация без метаданных ухудшает доверие/поиск/переиспользование.

**Acceptance criteria** (для каждого publishable пакета):
- добавить поля: `license`, `repository`, `homepage` (если есть), `bugs`, `author` (или `contributors`), `keywords`.
- добавить `files` whitelist или `.npmignore`, чтобы в npm попадало только нужное (`dist/`, `README`, `LICENSE` и т.д.).
- добавить `sideEffects: false` (если соответствует), чтобы улучшить tree-shaking.

#### P1.2) Compatibility matrix & support policy

**Acceptance criteria**:
- явно зафиксировать поддерживаемые версии:
  - Node (LTS диапазон, например `>=18` или `>=20`)
  - TypeScript (например `>=5.3`)
  - Tauri API surface для `state-sync-tauri` (major range)
- добавить notes про ESM/CJS (что именно поддерживаем и почему).

#### P1.3) Documentation surface (consumer-grade)

**Acceptance criteria**:
- `README.md` в корне workspace: что это, какие пакеты входят, когда какой использовать.
- README per package: минимальный пример (core + pinia + tauri), и “pitfalls”.
- “Troubleshooting”: non-canonical revision, topic mismatch, multiple windows, race conditions.

#### P1.4) Rust crate policy (if maintained)

В repo есть `crates/state-sync`. Нужно прояснить его роль в 0002.

**Acceptance criteria**:
- либо: явно сказать “crate экспериментальный / не часть релиза 0002”
- либо: добавить минимальные gates (fmt/clippy/tests) и semantic versioning strategy для crate отдельно.

---

### P2 — Optional / follow-ups (nice-to-have)

#### P2.1) Retry/backoff helpers as opt-in

**Acceptance criteria**:
- `withRetry(provider, policy)` wrapper + tests, без усложнения core.

#### P2.2) Additional transports

**Acceptance criteria**:
- BroadcastChannel transport adapter + contract tests.

---

### Work breakdown (deliverables)

#### Deliverable A (P0) — Safety hardening (core engine)
- [x] (P0.1) запретить `start()` после `stop()` (reject) + тесты
- [x] (P0.2) нормализация значений после runtime validation (не использовать “сырые” поля) + тесты
- [ ] (P0.5) формализовать lifecycle contract (`refresh/start/stop/onError`) в docs + тесты

#### Deliverable B (P0) — Build system (per package)
- [ ] добавить build tool (например, `tsup`) и конфиг
- [ ] добавить `build` script в каждый пакет
- [ ] добавить корректные `exports`/`types`/entrypoints
- [ ] убедиться, что `dist/` генерируется и не попадает в репо (но используется при publish)

#### Deliverable C (P0/P1) — Release plumbing
- [ ] добавить changesets и policy
- [ ] добавить `CHANGELOG.md` стратегию
- [ ] описать release checklist (tagging, publish order, smoke tests)

#### Deliverable D (P0) — CI
- [ ] добавить CI workflow (Node + Rust)
- [ ] gates: lint/typecheck/test/build + fmt/clippy

#### Deliverable E (P1) — DX, compatibility & documentation upgrades
- [ ] compatibility matrix (Node LTS, package manager, bundlers, Tauri API surface)
- [ ] “Quick start” для `state-sync`, `state-sync-pinia`, `state-sync-tauri`
- [ ] “Troubleshooting” (типовые ошибки: non-canonical revision, topic mismatch, multiple windows)

#### Deliverable F (P1) — Contract tests расширение
- [ ] `state-sync-tauri`: unsubscribe behavior, invoke args, garbage payload
- [ ] core: topic isolation across multiple handles, event coalescing under burst load, idempotency around errors

#### Deliverable G (P2) — Optional polish (после publish readiness)
- [ ] optional: `withRetry` wrapper + tests
- [ ] optional: BroadcastChannel transport + tests

---

### Definition of Done

Итерация считается завершённой, когда:
- **P0**: core защищён от lifecycle/IPC edge cases и это покрыто тестами
- **P0**: каждый пакет собирается в `dist/` и импортируется через `exports` (types работают)
- **P0**: CI проходит “from clean checkout” c `--frozen-lockfile`
- **P0/P1**: релиз‑процесс описан и автоматизируем (changesets + changelog)

---

### Alternatives considered (коротко, чтобы не переизобретать)

- **Build tool**:
  - `tsup`: быстрый “happy path” для ESM/CJS + d.ts → рекомендуем.
  - `tsc emit`: проще, но сложнее с dual ESM/CJS и корректным `exports`.
  - `rollup/tsup+rollup`: гибче, но больше конфигурации (пока не нужно).
- **Versioning/release**:
  - `changesets`: стандартный monorepo workflow → рекомендуем.
  - `lerna`/manual: больше ручной работы, выше риск рассинхронизации.

---

### Risks & mitigations

- **Dual ESM/CJS pitfalls**: риск сломать резолв в разных bundlers.
  - Mitigation: строгий `exports` map + smoke tests импорта (Node ESM + CJS) в CI.
- **API drift транспорта** (Tauri event payload shape):
  - Mitigation: transport tests + core runtime validation (already).
- **Unbounded refresh recursion under burst load**:
  - Mitigation: заменить рекурсивный “refresh queued → await refresh()” на loop (P1/F или P0, если видим риск на практике).

---

### Release checklist (P0)

- `pnpm install --frozen-lockfile`
- `pnpm lint && pnpm -r typecheck && pnpm -r test && pnpm -r build`
- smoke-import tests:
  - `node --input-type=module` ESM import
  - `node` CJS require (если публикуем CJS)
- `changeset` → version bump → publish order: `state-sync` → `state-sync-pinia` → `state-sync-tauri`

