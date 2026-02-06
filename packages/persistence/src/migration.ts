import type { MigrationFn, MigrationHandler, MigrationResult } from './types';

/**
 * Migrate data from one schema version to another.
 *
 * Applies migrations sequentially from fromVersion to currentVersion.
 *
 * @example
 * ```typescript
 * const migration: MigrationHandler<AppState> = {
 *   currentVersion: 3,
 *   migrations: {
 *     1: (v1) => ({ ...v1, newField: 'default' }), // v1 -> v2
 *     2: (v2) => ({ ...v2, renamedField: v2.oldField }), // v2 -> v3
 *   },
 * };
 *
 * const result = migrateData(oldData, 1, migration);
 * if (result.success) {
 *   console.log('Migrated to:', result.data);
 * }
 * ```
 */
export function migrateData<T>(
  data: unknown,
  fromVersion: number,
  handler: MigrationHandler<T>,
): MigrationResult<T> {
  const { currentVersion, migrations, validate } = handler;

  // No migration needed
  if (fromVersion === currentVersion) {
    const isValid = !validate || validate(data);
    return {
      success: isValid,
      data: isValid ? (data as T) : undefined,
      fromVersion,
      toVersion: currentVersion,
      error: isValid ? undefined : new Error('Validation failed for current version data'),
    };
  }

  // Cannot migrate from future version
  if (fromVersion > currentVersion) {
    return {
      success: false,
      fromVersion,
      toVersion: currentVersion,
      error: new Error(
        `Cannot migrate from future version ${fromVersion} to ${currentVersion}. ` +
          `Data may be from a newer app version.`,
      ),
    };
  }

  // Apply migrations sequentially
  let current = data;
  try {
    for (let v = fromVersion; v < currentVersion; v++) {
      const migrateFn = migrations[v];
      if (!migrateFn) {
        return {
          success: false,
          fromVersion,
          toVersion: currentVersion,
          error: new Error(
            `Missing migration from version ${v} to ${v + 1}. ` +
              `Available migrations: ${Object.keys(migrations).join(', ')}`,
          ),
        };
      }
      current = migrateFn(current);
    }

    // Validate final result
    if (validate && !validate(current)) {
      return {
        success: false,
        fromVersion,
        toVersion: currentVersion,
        error: new Error('Migrated data failed validation'),
      };
    }

    return {
      success: true,
      data: current as T,
      fromVersion,
      toVersion: currentVersion,
    };
  } catch (error) {
    return {
      success: false,
      fromVersion,
      toVersion: currentVersion,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Builder for creating migration handlers with type safety.
 *
 * @example
 * ```typescript
 * interface AppStateV1 { count: number }
 * interface AppStateV2 { count: number; name: string }
 * interface AppStateV3 { count: number; name: string; enabled: boolean }
 *
 * const migration = createMigrationBuilder<AppStateV3>()
 *   .addMigration<AppStateV1, AppStateV2>(1, (v1) => ({ ...v1, name: 'default' }))
 *   .addMigration<AppStateV2, AppStateV3>(2, (v2) => ({ ...v2, enabled: true }))
 *   .build(3);
 * ```
 */
export function createMigrationBuilder<TFinal>(): MigrationBuilder<TFinal> {
  const migrations: Record<number, MigrationFn<unknown, unknown>> = {};
  let validator: ((data: unknown) => data is TFinal) | undefined;

  return {
    addMigration<TFrom, TTo>(
      fromVersion: number,
      fn: MigrationFn<TFrom, TTo>,
    ): MigrationBuilder<TFinal> {
      migrations[fromVersion] = fn as MigrationFn<unknown, unknown>;
      return this;
    },

    withValidator(fn: (data: unknown) => data is TFinal): MigrationBuilder<TFinal> {
      validator = fn;
      return this;
    },

    build(currentVersion: number): MigrationHandler<TFinal> {
      return {
        currentVersion,
        migrations,
        validate: validator,
      };
    },
  };
}

/**
 * Migration builder interface.
 */
export interface MigrationBuilder<TFinal> {
  /**
   * Add a migration from one version to the next.
   */
  addMigration<TFrom, TTo>(
    fromVersion: number,
    fn: MigrationFn<TFrom, TTo>,
  ): MigrationBuilder<TFinal>;

  /**
   * Add a validator for the final data type.
   */
  withValidator(fn: (data: unknown) => data is TFinal): MigrationBuilder<TFinal>;

  /**
   * Build the migration handler.
   */
  build(currentVersion: number): MigrationHandler<TFinal>;
}

/**
 * Create a simple migration handler without the builder pattern.
 *
 * @example
 * ```typescript
 * const migration = createSimpleMigration<AppState>({
 *   currentVersion: 2,
 *   migrations: {
 *     1: (old) => ({ ...old, newField: 'default' }),
 *   },
 * });
 * ```
 */
export function createSimpleMigration<T>(
  config: Omit<MigrationHandler<T>, 'validate'> & {
    validate?: (data: unknown) => data is T;
  },
): MigrationHandler<T> {
  return config;
}

/**
 * Check if data needs migration.
 */
export function needsMigration(fromVersion: number, currentVersion: number): boolean {
  return fromVersion < currentVersion;
}

/**
 * Get the migration path (list of version numbers to migrate through).
 */
export function getMigrationPath(fromVersion: number, toVersion: number): number[] {
  if (fromVersion >= toVersion) return [];
  const path: number[] = [];
  for (let v = fromVersion; v < toVersion; v++) {
    path.push(v);
  }
  return path;
}
