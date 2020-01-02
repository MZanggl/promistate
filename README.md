# promistate

> Manage your promised state swiftly

Eliminating the need to reach for a state management library like vuex when it can be that much simpler.

## Installation

> `npm i promistate`

## Example

Example with Vue.js (although it is agnostic to JS frameworks).

### Without promistate

```vue
<template>
<div v-if="error">Whoops!</div>
<UserList 
    v-else-if="!isPending && users.length > 0"
    :users="users"
    :pending="isPending"
/>
</template>

<script>
export default {
    data() {
        return {
            users: [],
            isPending: true,
            error: null,
        }
    },

    async mounted() {
        const groupId = this.$route.params.groupId
        this.isPending = true
        try {
            this.users = await fetch(`/api/${groupId}/users`).then(res => res.json())
        } catch(error) {
            this.error = 'whoops'
        }
        this.isPending = false
    }
}
</script>
```

- Need to manage result, error and pending status all separately
- Need to manage a computed field to determine whether it's empty or not
- results in bloated code as logic is repeated in many components

### With promistate

```vue
<template>
<div v-if="userPromise.error">Whoops!</div>
<UserList v-else-if="!userPromise.isEmpty" :users="userPromise.value" :pending="userPromise.isPending" />
</template>

<script>
import { promistate } from 'promistate'

export default {
    data() {
        const userPromise = promistate(groupId => {
            return fetch(`/api/${groupId}/users`).then(res => res.json())
        })

        return { userPromise }
    },

    async mounted() {
        this.promisedUsers.load(this.$route.params.groupId)
    }
}
</script>
```

## API

```javascript
import { promistate } from 'promistate'

promistate(async function callback() {
    return somethingAsync()
})
```

The method `promistate` accepts two arguments: 

1. A callback
2. configurations

It immediately returns an object that has the following properties
- load -> a method to call the previously passed in callback. Arguments get propogated to callback
- isEmpty -> defines if there is a result. Conveniently switches to false when promise is pending. isEmpty is true when the result is an empty array, empty object, null or undefined
- isPending -> defines if promise is currently pending
- value -> holds the resolved promise result
- error -> error object in case promise was rejected

Note that promistate does not execute the callback in any way, use the `load` method.

### Configurations

Pass configurations as the second argument

```javascript
import { promistate } from 'promistate'

promistate(async function callback() {
    return somethingAsync()
}, { catchErrors: false, defaultValue: 42 })
```

| key | type | default | use case  |
| ------------- |-- |:-------------:| -----:|
| catchErrors  | boolean  | true | you already use something like an ErrorBoundary component for catching errors |
| defaultValue | any   | null  | You already have the value at hand |

### reset state to its default values

Sometimes you might need to reset the values in the state(value, error, isEmpty, etc.)

```javascript
const userPromise = promistate(async () => 1)
console.log(userPromise.value) // null

await userPromise.load()
console.log(userPromise.value) // 1

userPromise.reset()
console.log(userPromise.value) // null
```

### Typescript

To type the result of the promise you can make use of generics.

```typescript
import { promistate } from 'promistate'

promistate<string>(async function callback() {
    return 'updated'
}, { defaultValue: 'initial' })
```

## Meta

### Compile project

`npm run compile`

### Run tests

`npm test`