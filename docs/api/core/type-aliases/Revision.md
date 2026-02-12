[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / Revision

# Type Alias: Revision

```ts
type Revision = string & object;
```

Defined in: [types.ts:41](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/types.ts#L41)

Canonical decimal u64 string.

v0 canonicalization rules:
- must match `^[0-9]+$`
- "0" is allowed
- otherwise: no leading zeros

NOTE: This type is intentionally a branded string to prevent accidental mixing
with other strings in user code. The engine is responsible for validation.

## Type Declaration

### \_\_brand

```ts
readonly __brand: "Revision";
```
