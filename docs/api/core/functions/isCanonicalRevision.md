[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / isCanonicalRevision

# Function: isCanonicalRevision()

```ts
function isCanonicalRevision(value): value is Revision;
```

Defined in: [revision.ts:57](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/revision.ts#L57)

Checks whether a value is a valid canonical revision string.

A canonical revision must:
- Be a string
- Match the pattern `^(0|[1-9][0-9]*)$` (no leading zeros except bare "0")
- Represent a value within the unsigned 64-bit integer range (0 to 2^64 - 1)

This is a TypeScript type guard that narrows the input to [Revision](../type-aliases/Revision.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | The value to validate. Can be of any type. |

## Returns

`value is Revision`

`true` if the value is a valid canonical revision string, `false` otherwise.

## Example

```ts
import { isCanonicalRevision } from '@statesync/core';

isCanonicalRevision('42');    // true
isCanonicalRevision('0');     // true
isCanonicalRevision('007');   // false (leading zeros)
isCanonicalRevision(-1);      // false (not a string)
isCanonicalRevision('abc');   // false (non-numeric)
```
