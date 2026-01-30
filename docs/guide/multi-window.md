---
title: Multi-window patterns
---

## Source of truth

In multi-window applications, it’s important to have **one** source of truth per topic:
- the snapshot provider always returns the latest state
- invalidation events only “trigger” refresh

## sourceId and self-echo

If the window that applied a change receives its own invalidation right away, that’s normal.
But if it causes unnecessary refreshes, you can use:
- `sourceId` in the event (window/process ID)
- `shouldRefresh(event)` to ignore self-originated events

## Choosing topics

Keep topics stable and domain-oriented:
- good: `auth-state`, `app-config`
- bad: `settings-window` (UI-oriented)

