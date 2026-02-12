[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / VueRefLike

# Interface: VueRefLike\<State\>

Defined in: [vue.ts:20](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/vue/src/vue.ts#L20)

Minimal structural interface for a Vue ref-like container.

Compatible with `Ref<T>`, `ShallowRef<T>`, or any object with a `.value`
property of type `State`. We intentionally avoid importing Vue types so
this adapter stays dependency-free and can be used in any environment.

## Example

```ts
import { ref } from 'vue';

interface AppState { count: number; name: string }
const myRef: VueRefLike<AppState> = ref({ count: 0, name: '' });
```

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` | The shape of the ref's inner value. |

## Properties

### value

```ts
value: State;
```

Defined in: [vue.ts:28](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/vue/src/vue.ts#L28)

The unwrapped value held by the ref.

Assigning to this property triggers Vue's reactivity tracking so that
any watchers, computed properties, or template bindings that depend on
this ref are re-evaluated.
