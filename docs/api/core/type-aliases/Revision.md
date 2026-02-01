[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / Revision

# Type Alias: Revision

```ts
type Revision = string & object;
```

Defined in: [types.ts:31](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L31)

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
