# Compatibility

| Requirement | Minimum  |
|-------------|----------|
| Node.js     | >= 18    |
| TypeScript  | >= 5.3   |
| Tauri API   | v2.x     |

## Module formats

Все пакеты собираются в два формата:

- **ESM** (`import`) — `dist/index.js`
- **CJS** (`require`) — `dist/index.cjs`

Sourcemaps включены для обоих форматов.

## TypeScript

Декларации типов (`dist/index.d.ts`, `dist/index.d.cts`) генерируются автоматически.

`exports` в package.json настроены с condition `types` → `import` → `require`, что обеспечивает корректное подхватывание типов в любом bundler/runtime.
