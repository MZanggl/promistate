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
<div v-if="error">
    Whoops!
</div>
<UserList 
    v-else-if="!isUsersPending && users.length > 0"
    :users="users"
    :pending="isUsersPending"
/>
</template>

<script>
export default {
    data() {
        return {
            users: [],
            isUsersPending: true,
            error: null,
        }
    },

    async mounted() {
        const groupId = this.$route.params.groupId
        this.isUsersPending = true
        try {
            this.users = await fetch(`/api/${groupId}/users`).then(res => res.json())
        } catch(error) {
            this.error = 'whoops'
        }
        this.isUsersPending = false
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
<div v-if="promisedUsers.error">
    Whoops!
</div>
<UserList v-else-if="!promisedUsers.isEmpty" :users="promisedUsers.value" :pending="promisedUsers.isPending" />
<div v-else-if="promisedUsers.error">{{ promisedUsers.error }}</div>
</template>

<script>
import { promistate } from 'promistate'

export default {
    data() {
        const promisedUsers = promistate(groupId => {
            return fetch(`/api/${groupId}/users`).then(res => res.json())
        })

        return { promisedUsers }
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
- isEmpty -> defines if there is a result. Conveniently switches to false when promise is pending
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