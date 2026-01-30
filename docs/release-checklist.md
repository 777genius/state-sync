# Release Checklist

## Pre-release gates

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm -r typecheck
pnpm -r test
pnpm -r build
```

Все шаги должны пройти без ошибок.

## Версионирование

```bash
pnpm changeset version
```

- Проверить сгенерированные CHANGELOG.md в каждом пакете
- Убедиться что версии корректны
- Закоммитить изменения

## Публикация

Порядок публикации (зависимости идут первыми):

1. `state-sync` (core)
2. `state-sync-pinia`
3. `state-sync-tauri`

```bash
pnpm release
```

## CI/CD секреты

Для автоматического релиза через GitHub Actions необходимо настроить секреты в репозитории:

- **`NPM_TOKEN`** — токен npm для публикации пакетов.
  Получить: `npm token create` или через npm web UI (Access Tokens).
  Scope: automation token с правами на publish.
- **`GITHUB_TOKEN`** — предоставляется автоматически GitHub Actions.
  Используется changesets/action для создания Release PR.

Настройка: Settings → Secrets and variables → Actions → New repository secret.

## Smoke-import проверка (ESM + CJS)

Перед публикацией убедиться что оба формата работают:

```bash
# ESM
node -e "import('state-sync').then(m => console.log('ESM OK:', Object.keys(m)))"

# CJS
node -e "const m = require('state-sync'); console.log('CJS OK:', Object.keys(m))"
```

Повторить для каждого пакета (`state-sync-pinia`, `state-sync-tauri`).

## Post-release

- Smoke test: установить опубликованные пакеты в тестовый проект
- Проверить ESM и CJS импорты (см. секцию выше)
- Проверить что TypeScript типы подхватываются
- Создать git tag если нужно
