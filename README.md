# promistate

![](logo.png "")

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
<UserList v-else-if="!isPending && users.length > 0" :users="users" :pending="isPending" />
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
import promistate from 'promistate'

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
import promistate from 'promistate'

const userPromise = promistate(async function callback() {
    return fetchUser() // any promise
})

// later...
await userPromise.load()
console.log(userPromise.value)
```

The method `promistate` accepts two arguments: 

1. A callback
2. configurations

It immediately returns an object that has the following properties

| field | description |
| ------------- |-- |
| load  | A method to call the previously passed in callback. Arguments get propogated to callback |
| value  | Holds the resolved promise result |
| isPending  | Defines if promise is currently pending |
| timesSettled  | counts how many times a promise was settled. Sometimes you maybe want to wait until a promise was settled |
| isEmpty  | Defines if there is a result. Conveniently switches to false when promise is pending. isEmpty is true when the result is an empty array, empty object, null or undefined |
| error | Error object in case promise was rejected |
| reset | A method to reset all state (value, isEmpty, error, isPending) |

> Note that calling the method "promistate" does not execute the callback in any way, use the `load` method.

#### load

"load" returns a status message about the promise. This can be either
- RESOLVED
- ERROR
- IGNORED (see configurations below)

To avoid hardcoding these, you can import "PromistateStatus" from the library:

```javascript
import promistate, { PromistateStatus } from 'promistate'

const userPromise = promistate(async function callback() {
    return fetchUser() // any promise
})

if (await userPromise.load() === PromistateStatus.RESOLVED) {
    console.log(userPromise.value)
}
```

Pass in arguments as needed

```javascript
const userPromise = promistate(async function callback(num1, num2) {
    return num1 + num2
})

await userPromise.load(1, 2)
```

### Configurations

Pass configurations as the second argument

```javascript
import promistate from 'promistate'

promistate(async function callback() {
    return somethingAsync()
}, { catchErrors: false, defaultValue: 42 })
```

| key | type | default | use case  |
| ------------- |-- |:-------------:| -----:|
| catchErrors  | boolean  | true | You already use something like an ErrorBoundary component for catching errors |
| defaultValue | any   | null  | You already have a value at hand, or default it to an empty array, object, etc. |
| ignoreLoadWhenPending | boolean   | false  | Prevent an event being fired twice e.g. when clicking a button. With this boolean set, while the first promise is still pending, subsequent loads would be ignored (not deferred!). When a subsequent load gets ignored, the "load" method returns the status "IGNORED" |
| isEmpty | Function  | undefined | Say, the result returns something like `{ page: 1, items: [] }`, isEmpty would always return false. Example: `{ isEmpty: value => value.items.length < 1 }` |

### Typescript

To type the result of the promise you can make use of generics.

```typescript
import promistate from 'promistate'

promistate<string>(async function callback() {
    return 'updated'
}, { defaultValue: 'initial' })
```

## FAQ

### an API call returns a page token which I need the next time I make a request to fetch the next page, I also need to append the data to the previous result

As long as you don't use arrow functions you can access the state using `this`.

```javascript
import promistate from 'promistate'

promistate(async function callback() {
    const result = await fetchItems(this.pageToken)
    return { pageToken: result.pageToken, items: this.items.concat(result.items) }
}, {
    defaultValue: { items: [], pageToken: null },
    isEmpty: value => value.items.length < 1,
})
```

## Meta

### Compile project

`npm run compile`

### Run tests

`npm test`