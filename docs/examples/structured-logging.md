---
title: Structured logging
---

Рекомендуемый способ получить “хорошие логи” без лишней инженерии:

- `createConsoleLogger()` — быстрый старт
- `tagLogger()` — добавляет теги (например, `windowId/sourceId`) в каждый лог

См. также: `docs/examples/structured-logging.ts`.

