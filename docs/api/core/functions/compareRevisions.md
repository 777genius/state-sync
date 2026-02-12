[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / compareRevisions

# Function: compareRevisions()

```ts
function compareRevisions(a, b): -1 | 0 | 1;
```

Defined in: [revision.ts:90](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/revision.ts#L90)

Compares two revision strings numerically.

Uses string-length comparison followed by lexicographic comparison,
which is equivalent to numeric ordering for canonical decimal strings
(no leading zeros). This avoids BigInt overhead while remaining correct
for the full u64 range.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `a` | [`Revision`](../type-aliases/Revision.md) | The first revision to compare. |
| `b` | [`Revision`](../type-aliases/Revision.md) | The second revision to compare. |

## Returns

`-1` \| `0` \| `1`

`-1` if `a < b`, `0` if `a === b`, `1` if `a > b`.

## Example

```ts
import { compareRevisions } from '@statesync/core';
import type { Revision } from '@statesync/core';

const r1 = '10' as Revision;
const r2 = '9' as Revision;

compareRevisions(r1, r2); // 1  (10 > 9)
compareRevisions(r2, r1); // -1 (9 < 10)
compareRevisions(r1, r1); // 0
```
