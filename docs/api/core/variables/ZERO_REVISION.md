[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / ZERO\_REVISION

# Variable: ZERO\_REVISION

```ts
const ZERO_REVISION: Revision;
```

Defined in: [revision.ts:31](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/revision.ts#L31)

The zero revision constant, representing the initial (empty) revision state.

Use this as the starting revision before any snapshots have been applied.

## Example

```ts
import { ZERO_REVISION } from '@statesync/core';

let localRevision = ZERO_REVISION; // "0"
```
