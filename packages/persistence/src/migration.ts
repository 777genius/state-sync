import type { MigrationFn, MigrationHandler, MigrationResult } from './types';

/**
 * Migrate data from one schema version to another by applying migration
 * functions sequentially.
 *
 * Migrations are applied in order from `fromVersion` up to (but not including)
 * `handler.currentVersion`. For example, migrating from v1 to v3 applies
 * `migrations[1]` then `migrations[2]`.
 *
 * If `fromVersion` equals `currentVersion`, no migrations are applied and
 * the data is optionally validated. If `fromVersion` is greater than
 * `currentVersion`, the migration fails (data from a future version).
 *
 * @typeParam T - The shape of the application state in the target (current) schema version.
 * @param data - The raw persisted data to migrate. Type is `unknown` because the
 *   source schema may differ from the current one.
 * @param fromVersion - The schema version of the stored data.
 * @param handler - The migration handler containing the target version, migration
 *   functions, and optional validator.
 * @returns A {@link MigrationResult} indicating success or failure, with the
 *   migrated data on success or an error on failure.
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
 * Creates a fluent builder for constructing {@link MigrationHandler} instances
 * with full type safety across migration steps.
 *
 * The builder pattern ensures each migration step is explicitly typed,
 * making it harder to introduce schema mismatches.
 *
 * @typeParam TFinal - The shape of the application state in the final (current) schema version.
 * @returns A new {@link MigrationBuilder} instance with no migrations registered.
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
 * Fluent builder interface for constructing a {@link MigrationHandler}.
 *
 * Created via {@link createMigrationBuilder}. Allows chaining migration
 * steps and an optional validator before producing the final handler.
 *
 * @typeParam TFinal - The shape of the application state in the final (current) schema version.
 */
export interface MigrationBuilder<TFinal> {
  /**
   * Register a migration function for a specific version step.
   *
   * @typeParam TFrom - The data shape of the source version.
   * @typeParam TTo - The data shape of the target version (source version + 1).
   * @param fromVersion - The version number to migrate **from** (e.g., `1` for the v1 -> v2 step).
   * @param fn - The function that transforms data from `TFrom` to `TTo`.
   * @returns This builder instance for method chaining.
   */
  addMigration<TFrom, TTo>(
    fromVersion: number,
    fn: MigrationFn<TFrom, TTo>,
  ): MigrationBuilder<TFinal>;

  /**
   * Attach a type-guard validator that checks the final migrated data.
   *
   * @param fn - A function that returns `true` if `data` is a valid `TFinal`.
   * @returns This builder instance for method chaining.
   */
  withValidator(fn: (data: unknown) => data is TFinal): MigrationBuilder<TFinal>;

  /**
   * Produce the finalized {@link MigrationHandler} with all registered migrations.
   *
   * @param currentVersion - The current schema version number that the application expects.
   * @returns A migration handler ready to be used with {@link loadPersistedSnapshot} or {@link migrateData}.
   */
  build(currentVersion: number): MigrationHandler<TFinal>;
}

/**
 * Creates a {@link MigrationHandler} directly from a plain configuration object,
 * without using the builder pattern.
 *
 * This is a convenience function for simple cases where the builder's fluent
 * API is unnecessary.
 *
 * @typeParam T - The shape of the application state in the current schema version.
 * @param config - The migration configuration including `currentVersion`,
 *   `migrations` record, and an optional `validate` type-guard.
 * @returns A migration handler ready to be used with {@link loadPersistedSnapshot}
 *   or {@link migrateData}.
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
 * Checks whether persisted data requires migration.
 *
 * Returns `true` if the stored schema version is older than the current version.
 *
 * @param fromVersion - The schema version of the stored data.
 * @param currentVersion - The schema version the application currently expects.
 * @returns `true` if `fromVersion < currentVersion`, indicating migration is needed.
 *
 * @example
 * ```typescript
 * if (needsMigration(storedVersion, 3)) {
 *   const result = migrateData(data, storedVersion, migrationHandler);
 * }
 * ```
 */
export function needsMigration(fromVersion: number, currentVersion: number): boolean {
  return fromVersion < currentVersion;
}

/**
 * Computes the ordered list of version numbers that must be migrated through
 * to get from one schema version to another.
 *
 * Each number in the returned array represents a migration step: version `N`
 * means "apply `migrations[N]`" to go from version N to N+1.
 *
 * Returns an empty array if `fromVersion >= toVersion` (no migration needed).
 *
 * @param fromVersion - The starting schema version.
 * @param toVersion - The target schema version.
 * @returns An array of version numbers, e.g., `[1, 2]` to go from v1 to v3.
 *
 * @example
 * ```typescript
 * getMigrationPath(1, 4); // [1, 2, 3]
 * getMigrationPath(3, 3); // []
 * getMigrationPath(5, 3); // []
 * ```
 */
export function getMigrationPath(fromVersion: number, toVersion: number): number[] {
  if (fromVersion >= toVersion) return [];
  const path: number[] = [];
  for (let v = fromVersion; v < toVersion; v++) {
    path.push(v);
  }
  return path;
}
