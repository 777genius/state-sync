---
title: Persistence with migrations
---

# Persistence with migrations

Handle data format changes gracefully when your app evolves.

::: tip
Schema migrations let you update persisted data format without losing user data.
:::

## The problem

Your app stores user preferences in localStorage:

```typescript
// Version 1: Simple settings
interface SettingsV1 {
  darkMode: boolean;
}

// Version 2: Added language
interface SettingsV2 {
  darkMode: boolean;
  language: string;
}

// Version 3: Renamed darkMode to theme
interface SettingsV3 {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number;
}
```

Users with V1 data shouldn't lose their preferences when you deploy V3.

## Solution: Migration chain

```typescript
import {
  createMigrationBuilder,
  createLocalStorageBackend,
  createPersistenceApplier,
  loadPersistedSnapshot,
} from '@statesync/persistence';
import { createRevisionSync } from '@statesync/core';

// ============================================================================
// Type definitions for each version
// ============================================================================

interface SettingsV1 {
  darkMode: boolean;
}

interface SettingsV2 {
  darkMode: boolean;
  language: string;
}

interface SettingsV3 {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number;
}

// Current version is always the latest
type Settings = SettingsV3;

// ============================================================================
// Migration definitions
// ============================================================================

const migration = createMigrationBuilder<Settings>()
  // V1 → V2: Add language field
  .addMigration<SettingsV1, SettingsV2>(1, (v1) => ({
    darkMode: v1.darkMode,
    language: 'en', // Default for existing users
  }))
  // V2 → V3: Rename darkMode to theme, add fontSize
  .addMigration<SettingsV2, SettingsV3>(2, (v2) => ({
    theme: v2.darkMode ? 'dark' : 'light',
    language: v2.language,
    fontSize: 14, // Default font size
  }))
  .build(3); // Current schema version

// ============================================================================
// Storage setup
// ============================================================================

const storage = createLocalStorageBackend<Settings>({
  key: 'app-settings',
});

// ============================================================================
// Load with migration
// ============================================================================

async function loadSettings(applier: { apply: (snapshot: any) => void }) {
  const result = await loadPersistedSnapshot(storage, applier, {
    migration,
    validate: true,
    validator: isValidSettings,
  });

  if (result) {
    console.log(`Loaded settings from version ${result.revision}`);

    // Check if migration happened
    if (migration.currentVersion > parseInt(result.revision)) {
      console.log('Settings were migrated to latest version');
    }
  } else {
    console.log('No saved settings found, using defaults');
  }

  return result;
}

// ============================================================================
// Validation
// ============================================================================

function isValidSettings(data: unknown): data is Settings {
  if (!data || typeof data !== 'object') return false;

  const s = data as Record<string, unknown>;

  return (
    typeof s.theme === 'string' &&
    ['light', 'dark', 'system'].includes(s.theme) &&
    typeof s.language === 'string' &&
    typeof s.fontSize === 'number' &&
    s.fontSize >= 10 &&
    s.fontSize <= 32
  );
}

// ============================================================================
// Full example
// ============================================================================

async function main() {
  // Your applier (e.g., Zustand, Pinia, or custom)
  let currentSettings: Settings = {
    theme: 'system',
    language: 'en',
    fontSize: 14,
  };

  const innerApplier = {
    apply(snapshot: { revision: string; data: Settings }) {
      currentSettings = snapshot.data;
      console.log('Applied settings:', currentSettings);
    },
  };

  // Create persistence applier
  const applier = createPersistenceApplier({
    storage,
    applier: innerApplier,
    schemaVersion: migration.currentVersion,
    throttling: { debounceMs: 500 },
    onPersistenceError(ctx) {
      console.error(`Persistence error [${ctx.operation}]:`, ctx.error);
    },
  });

  // Load cached data with migration
  await loadSettings(innerApplier);

  // Set up sync (if needed)
  const sync = createRevisionSync({
    topic: 'settings',
    subscriber: mySubscriber,
    provider: myProvider,
    applier,
  });

  await sync.start();

  // Listen for migration events
  applier.on('migrated', (result) => {
    console.log(`Migrated from v${result.fromVersion} to v${result.toVersion}`);
    if (!result.success) {
      console.error('Migration failed:', result.error);
    }
  });
}
```

## Migration scenarios

### Scenario 1: Fresh install

```
User installs app for the first time
→ No data in localStorage
→ App uses default settings (V3)
→ Settings saved with schemaVersion: 3
```

### Scenario 2: Upgrade from V1

```
User has V1 data: { darkMode: true }
→ Load detects schemaVersion: 1
→ Run migration 1→2: { darkMode: true, language: 'en' }
→ Run migration 2→3: { theme: 'dark', language: 'en', fontSize: 14 }
→ Save with schemaVersion: 3
→ User's dark mode preference preserved!
```

### Scenario 3: Already on latest

```
User has V3 data: { theme: 'dark', language: 'es', fontSize: 16 }
→ Load detects schemaVersion: 3
→ No migration needed
→ Data used as-is
```

## Advanced: Custom migration logic

```typescript
const migration = createMigrationBuilder<Settings>()
  .addMigration<SettingsV2, SettingsV3>(2, (v2, context) => {
    // Access metadata during migration
    const savedAt = context?.metadata?.savedAt;

    // Complex migration logic
    let theme: Settings['theme'] = v2.darkMode ? 'dark' : 'light';

    // If data is old, default to system theme
    if (savedAt && Date.now() - savedAt > 30 * 24 * 60 * 60 * 1000) {
      theme = 'system';
    }

    return {
      theme,
      language: v2.language || 'en',
      fontSize: 14,
    };
  })
  .build(3);
```

## Handling migration failures

```typescript
const result = await loadPersistedSnapshot(storage, applier, {
  migration,
});

if (!result) {
  // No data or migration failed
  // Use defaults
  applier.apply({
    revision: '0',
    data: defaultSettings,
  });
}

// Or listen for migration events
applier.on('migrated', (result) => {
  if (!result.success) {
    // Log error, show notification, or use defaults
    console.error('Migration failed:', result.error);

    // Option 1: Clear corrupted data and start fresh
    await storage.clear?.();

    // Option 2: Try to recover what we can
    const partial = tryRecoverSettings(result.error);
    if (partial) {
      applier.apply({ revision: '0', data: { ...defaultSettings, ...partial } });
    }
  }
});
```

## Testing migrations

```typescript
import { describe, it, expect } from 'vitest';
import { createMigrationBuilder } from '@statesync/persistence';

describe('settings migrations', () => {
  const migration = createMigrationBuilder<SettingsV3>()
    .addMigration<SettingsV1, SettingsV2>(1, (v1) => ({
      darkMode: v1.darkMode,
      language: 'en',
    }))
    .addMigration<SettingsV2, SettingsV3>(2, (v2) => ({
      theme: v2.darkMode ? 'dark' : 'light',
      language: v2.language,
      fontSize: 14,
    }))
    .build(3);

  it('migrates V1 to V3', () => {
    const v1: SettingsV1 = { darkMode: true };
    const result = migrateData(v1, 1, migration);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      theme: 'dark',
      language: 'en',
      fontSize: 14,
    });
  });

  it('migrates V2 to V3', () => {
    const v2: SettingsV2 = { darkMode: false, language: 'es' };
    const result = migrateData(v2, 2, migration);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      theme: 'light',
      language: 'es',
      fontSize: 14,
    });
  });

  it('returns V3 unchanged', () => {
    const v3: SettingsV3 = { theme: 'system', language: 'fr', fontSize: 18 };
    const result = migrateData(v3, 3, migration);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(v3);
  });
});
```

## Best practices

1. **Never delete migrations**: Even if nobody should have V1 data anymore, keep the migration. Edge cases exist.

2. **Test all paths**: Test V1→V3, V2→V3, and V3→V3 (no-op).

3. **Add defaults conservatively**: When adding new fields, use sensible defaults that won't surprise users.

4. **Validate after migration**: Use `validator` option to catch corrupted data.

5. **Log migration events**: Track which versions users are migrating from to inform deprecation decisions.

6. **Consider TTL**: Old data might not be worth migrating. Set `ttlMs` to expire very old data.

```typescript
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  schemaVersion: 3,
  ttlMs: 365 * 24 * 60 * 60 * 1000, // 1 year
});
```
