---
title: Multi-window patterns
---

## Source of truth

Для multi-window приложений важно иметь **один** source of truth на topic:
- snapshot provider всегда возвращает актуальное состояние
- invalidation event лишь “триггерит” refresh

## sourceId и self-echo

Если окно, применившее изменение, тут же получает invalidation обратно — это нормально.
Но если это вызывает лишние refresh, можно использовать:
- `sourceId` в event (ID окна/процесса)
- `shouldRefresh(event)` чтобы игнорировать события от самого себя

## Выбор топиков

Делайте topic стабильным и “доменным”:
- хорошо: `auth-state`, `app-config`
- плохо: `settings-window` (UI-ориентировано)

