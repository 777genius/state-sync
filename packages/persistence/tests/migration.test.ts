import { describe, expect, it } from 'vitest';
import {
  createMigrationBuilder,
  createSimpleMigration,
  getMigrationPath,
  migrateData,
  needsMigration,
} from '../src/migration';

interface V1Data {
  count: number;
}

interface V2Data {
  count: number;
  name: string;
}

interface V3Data {
  count: number;
  name: string;
  enabled: boolean;
}

describe('migrateData', () => {
  const handler = {
    currentVersion: 3,
    migrations: {
      1: (v1: V1Data): V2Data => ({ ...v1, name: 'default' }),
      2: (v2: V2Data): V3Data => ({ ...v2, enabled: true }),
    },
  };

  it('migrates from v1 to v3', () => {
    const v1Data: V1Data = { count: 42 };
    const result = migrateData(v1Data, 1, handler);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ count: 42, name: 'default', enabled: true });
    expect(result.fromVersion).toBe(1);
    expect(result.toVersion).toBe(3);
  });

  it('migrates from v2 to v3', () => {
    const v2Data: V2Data = { count: 10, name: 'test' };
    const result = migrateData(v2Data, 2, handler);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ count: 10, name: 'test', enabled: true });
  });

  it('returns same data when no migration needed', () => {
    const v3Data: V3Data = { count: 5, name: 'final', enabled: false };
    const result = migrateData(v3Data, 3, handler);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(v3Data);
  });

  it('fails when migrating from future version', () => {
    const result = migrateData({}, 5, handler);

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('future version');
  });

  it('fails when migration is missing', () => {
    const incompleteHandler = {
      currentVersion: 3,
      migrations: {
        1: (v1: V1Data): V2Data => ({ ...v1, name: 'default' }),
        // Missing migration from v2 to v3
      },
    };

    const result = migrateData({ count: 1 }, 1, incompleteHandler);

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Missing migration');
  });

  it('validates migrated data if validator provided', () => {
    const handlerWithValidator = {
      currentVersion: 2,
      migrations: {
        1: (v1: V1Data): V2Data => ({ ...v1, name: 'default' }),
      },
      validate: (data: unknown): data is V2Data => {
        return (
          typeof data === 'object' &&
          data !== null &&
          'count' in data &&
          'name' in data &&
          typeof (data as V2Data).count === 'number'
        );
      },
    };

    const result = migrateData({ count: 1 }, 1, handlerWithValidator);
    expect(result.success).toBe(true);
  });

  it('fails validation if validator returns false', () => {
    const handlerWithValidator = {
      currentVersion: 2,
      migrations: {
        1: (): { invalid: true } => ({ invalid: true }),
      },
      validate: (data: unknown): data is V2Data => {
        return typeof data === 'object' && data !== null && 'count' in data;
      },
    };

    const result = migrateData({ count: 1 }, 1, handlerWithValidator);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('validation');
  });

  it('handles migration function errors', () => {
    const throwingHandler = {
      currentVersion: 2,
      migrations: {
        1: (): never => {
          throw new Error('Migration failed');
        },
      },
    };

    const result = migrateData({ count: 1 }, 1, throwingHandler);
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Migration failed');
  });
});

describe('createMigrationBuilder', () => {
  it('builds migration handler', () => {
    const handler = createMigrationBuilder<V3Data>()
      .addMigration<V1Data, V2Data>(1, (v1) => ({ ...v1, name: 'default' }))
      .addMigration<V2Data, V3Data>(2, (v2) => ({ ...v2, enabled: true }))
      .build(3);

    expect(handler.currentVersion).toBe(3);
    expect(handler.migrations[1]).toBeDefined();
    expect(handler.migrations[2]).toBeDefined();
  });

  it('supports validator', () => {
    const handler = createMigrationBuilder<V2Data>()
      .addMigration<V1Data, V2Data>(1, (v1) => ({ ...v1, name: 'default' }))
      .withValidator((data): data is V2Data => typeof data === 'object' && data !== null)
      .build(2);

    expect(handler.validate).toBeDefined();
  });
});

describe('createSimpleMigration', () => {
  it('creates migration handler from config', () => {
    const handler = createSimpleMigration<V2Data>({
      currentVersion: 2,
      migrations: {
        1: (v1: V1Data) => ({ ...v1, name: 'default' }),
      },
    });

    expect(handler.currentVersion).toBe(2);
    expect(handler.migrations[1]).toBeDefined();
  });
});

describe('needsMigration', () => {
  it('returns true when versions differ', () => {
    expect(needsMigration(1, 2)).toBe(true);
    expect(needsMigration(1, 5)).toBe(true);
  });

  it('returns false when versions are equal', () => {
    expect(needsMigration(2, 2)).toBe(false);
  });

  it('returns false when from version is higher', () => {
    expect(needsMigration(3, 2)).toBe(false);
  });
});

describe('getMigrationPath', () => {
  it('returns path of versions to migrate through', () => {
    expect(getMigrationPath(1, 4)).toEqual([1, 2, 3]);
  });

  it('returns empty array when no migration needed', () => {
    expect(getMigrationPath(3, 3)).toEqual([]);
    expect(getMigrationPath(5, 3)).toEqual([]);
  });
});
