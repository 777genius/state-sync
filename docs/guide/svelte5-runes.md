---
title: Svelte 5 Runes
---

# Svelte 5 Runes

How to use state-sync with Svelte 5's `$state` rune.

## Built-in adapter (recommended) {#built-in}

`@statesync/svelte` natively supports `$state` via `target: 'state'`. This gives you the full adapter feature set — `pickKeys`, `omitKeys`, `toState`, `strict` — with in-place mutation semantics:

```typescript
// sync.svelte.ts
import { createRevisionSync } from '@statesync/core';
import { createSvelteSnapshotApplier } from '@statesync/svelte';

let settings = $state({
  theme: 'light',
  language: 'en',
  fontSize: 14,
  isLoading: false,
});

const applier = createSvelteSnapshotApplier(settings, {
  target: 'state', // [!code highlight]
  mode: 'patch',
  omitKeys: ['isLoading'],
});

const sync = createRevisionSync({
  topic: 'settings',
  subscriber: mySubscriber,
  provider: myProvider,
  applier,
});

export { settings, sync };
```

The adapter mutates `$state` properties in-place — Svelte 5 detects the changes and updates the UI. Object identity is preserved (no new reference created).

### toState mapping

```typescript
const applier = createSvelteSnapshotApplier(settings, {
  target: 'state',
  toState: (data: BackendSettings, ctx) => ({
    fontSize: data.font_size,
    theme: data.dark_mode ? 'dark' : 'light',
  }),
});
```

The `ctx` object contains `{ state }` — a reference to the `$state` object.

### Replace mode

```typescript
const applier = createSvelteSnapshotApplier(settings, {
  target: 'state',
  mode: 'replace',
  omitKeys: ['isLoading'],
});
```

Replace mode deletes stale keys and assigns new ones, while preserving omitted keys. Object identity is preserved.

## Custom applier {#custom-applier}

For minimal setups where you don't need `pickKeys`/`omitKeys`/`toState`, a 3-line custom applier works:

```typescript
import type { SnapshotEnvelope } from '@statesync/core';

let settings = $state<Settings>({ theme: 'light', language: 'en', fontSize: 14 });

const applier = {
  apply(snapshot: SnapshotEnvelope<Settings>) {
    Object.assign(settings, snapshot.data);
  },
};
```

## Complete component example

```svelte
<!-- SettingsPanel.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createRevisionSync, createConsoleLogger } from '@statesync/core';
  import { createTauriRevisionSync } from '@statesync/tauri';
  import { createSvelteSnapshotApplier } from '@statesync/svelte';
  import { listen } from '@tauri-apps/api/event';
  import { invoke } from '@tauri-apps/api/core';

  interface Settings {
    theme: 'light' | 'dark';
    language: string;
    fontSize: number;
  }

  let settings = $state<Settings>({
    theme: 'light',
    language: 'en',
    fontSize: 14,
  });

  const applier = createSvelteSnapshotApplier(settings, { target: 'state' });

  let syncHandle: ReturnType<typeof createTauriRevisionSync> | null = null;

  onMount(async () => {
    syncHandle = createTauriRevisionSync({
      topic: 'settings',
      listen,
      invoke,
      eventName: 'settings:invalidated',
      commandName: 'get_settings',
      applier,
      logger: createConsoleLogger({ debug: true }),
    });

    await syncHandle.start();
  });

  onDestroy(() => {
    syncHandle?.stop();
  });

  async function updateSetting(key: keyof Settings, value: any) {
    await invoke('update_settings', {
      settings: { ...settings, [key]: value },
    });
  }
</script>

<div class="settings">
  <label>
    Theme
    <select
      value={settings.theme}
      onchange={(e) => updateSetting('theme', e.currentTarget.value)}
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>

  <label>
    Font size: {settings.fontSize}px
    <input
      type="range"
      min="10"
      max="24"
      value={settings.fontSize}
      oninput={(e) => updateSetting('fontSize', +e.currentTarget.value)}
    />
  </label>

  <label>
    Language
    <select
      value={settings.language}
      onchange={(e) => updateSetting('language', e.currentTarget.value)}
    >
      <option value="en">English</option>
      <option value="es">Spanish</option>
      <option value="fr">French</option>
    </select>
  </label>
</div>
```

## Which approach to choose

| Feature | Built-in `target: 'state'` | Custom applier |
|---------|:--------------------------:|:--------------:|
| Lines of code | 1 option | ~3 |
| `omitKeys` / `pickKeys` | Built-in | Manual |
| `toState` mapping | Built-in | Manual |
| `strict` validation | Built-in | No |
| In-place mutation | Yes | Yes |

For most cases, use the **built-in adapter** with `target: 'state'` — it's a single option that unlocks the full feature set. Use a **custom applier** only if you want zero adapter dependency.

## See also

- [@statesync/svelte](/packages/svelte) — full API reference
- [Custom transports](/guide/custom-transports) — build your own subscriber/provider
- [Writing state](/guide/writing-state) — UI to backend write patterns
