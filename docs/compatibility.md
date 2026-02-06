# Compatibility

| Requirement | Minimum  |
|-------------|----------|
| Node.js     | >= 18    |
| TypeScript  | >= 5.3   |
| Tauri API   | v2.x     |

## Module formats

All packages are built in two formats:

- **ESM** (`import`) — `dist/index.js`
- **CJS** (`require`) — `dist/index.cjs`

Sourcemaps are enabled for both formats.

## TypeScript

Type declarations (`dist/index.d.ts`, `dist/index.d.cts`) are generated automatically.

`exports` in `package.json` are configured with the `types` → `import` → `require` conditions, which ensures types are resolved correctly in any bundler/runtime.

## See also

- [Quickstart](/guide/quickstart) — get started
- [Troubleshooting](/troubleshooting) — common issues
