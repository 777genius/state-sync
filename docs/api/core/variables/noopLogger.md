[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / noopLogger

# Variable: noopLogger

```ts
const noopLogger: Logger;
```

Defined in: [logger.ts:106](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/logger.ts#L106)

A no-op [Logger](../interfaces/Logger.md) instance where all methods (`debug`, `warn`, `error`)
are silent stubs.

Use this when you want to explicitly disable logging rather than passing
`undefined`. This avoids null-checks inside the engine and makes the intent clear.

## Example

```ts
import { noopLogger, createRevisionSync } from '@statesync/core';

const handle = createRevisionSync({
  // ...
  logger: noopLogger, // Explicitly silence all logs
});
```
