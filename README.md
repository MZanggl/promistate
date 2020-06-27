# promistate

![](logo.png "")

Easily manage promises in reactive JavaScript libraries and frameworks such as React.js, Vue.js, Angular, Svelte, Alpine.js, etc.

## Installation

> `npm i promistate`

## Examples

- [Vue.js](https://codesandbox.io/s/vue-promistate-0nrjz?file=/src/App.vue)
- [React.js](https://codesandbox.io/s/react-promistate-pjnzh?file=/src/App.js)
- [Alpine.js](https://codesandbox.io/s/recursing-ritchie-kbutq?file=/src/index.js)
- [Svelte](https://codesandbox.io/s/promistate-svelte-h86ll?file=/App.svelte)
- [Angular](https://codesandbox.io/s/angular-promistate-xf2j5?file=/src/app/app.component.html)
- [Vanilla JS](https://codesandbox.io/s/vanilla-promistate-vdyd3?file=/src/index.js)

## Comparison (example with Vue.js)

### Without promistate

- Need to manage promise result, error and pending status all as separate state
- Need to manage a computed field to determine whether the result is empty or not
- Need to write custom logic to ignore stale promises / cancel promises
- results in bloated code as all of this is repeated in many components

```vue
<template>
    <div v-if="error">Whoops!</div>
    <div v-else-if="isPending">loading...</div>
    <div v-else-if="users.length === 0">no results...</div>
    <UserList v-else :users="users" />
</template>

<script>
export default {
    data() {
        return { users: [], isPending: true, error: null }
    },
    async created() {
        const groupId = this.$route.params.groupId
        this.isPending = true
        try {
            this.users = await fetch(`/api/${groupId}/users`).then(res => res.json())
        } catch(error) {
            this.error = error
        }
        this.isPending = false
    }
}
</script>
```

### With promistate

All state changes handled internally and exposed through a single object 👍.

```vue
<template>
    <div v-if="userPromise.error">Whoops!</div>
    <div v-else-if="userPromise.isPending">loading...</div>
    <div v-else-if="userPromise.isEmpty">no results...</div>
    <UserList v-else :users="userPromise.value" />
</template>

<script>
import promistate from 'promistate'

export default {
    data: ({
        userPromise: promistate(groupId => fetch(`/api/${groupId}/users`).then(res => res.json()))
    }),
    created() {
        this.userPromise.load(this.$route.params.groupId)
    }
}
</script>
```

## API

```javascript
import promistate from 'promistate'

const userPromise = promistate(async function callback(id) {
    return fetch('/api/user/' + id).then(res => res.json()) // any promise
})

// later...
console.log(userPromise.value) // null
await userPromise.load(1)
console.log(userPromise.value) // { id: 1, name: '...' }
```

The callback passed into `promistate` gets executed once you call the "load" method.

Calling "promistate()" immediately returns an object that has the following properties.

(See below for react hook example)

| field | description |
| ------------- |-- |
| load  | A method to call the previously passed in callback. Arguments get propogated to callback |
| value  | Holds the resolved promise result |
| isPending  | Defines if promise is currently pending |
| timesSettled  | counts how many times a promise was settled. Sometimes you want to wait until a promise was settled |
| isEmpty  | Defines if there is a result. Conveniently switches to false when promise is pending. isEmpty is true when the result is an empty array, empty object, null or undefined |
| error | Error object in case promise was rejected |
| reset | A method to reset all state (value, isEmpty, error, isPending) |

#### load

You can pass in arguments as needed

```javascript
const calculator = promistate(async function callback(num1, num2) {
    return num1 + num2
})

await calculator.load(1, 2)
```

"load" returns a status message about the promise. This can be either
- RESOLVED
- ERROR
- IGNORED (see configurations below)

> This can be useful if you have to do more work after loading a promise. Note how there is no need to reach for this in the example at the top.

To avoid hardcoding these, you can import "PromistateStatus" from the library

```javascript
import promistate, { PromistateStatus } from 'promistate'

const userPromise = promistate(() => fetch('...'))

if (await userPromise.load() === PromistateStatus.RESOLVED) {
    console.log("It's resolved!", userPromise.value)
}
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
| defaultValue | any   | null  | You already have a value at hand, or want to default it to an empty array, object, etc. |
| ignoreStaleLoad | boolean   | false  | If you "load" while there is already a promise pending, this will ignore any stale promise results. By calling "reset" you can also cancel promises this way. |
| ignoreLoadWhenPending | boolean   | false  | Prevent an event being fired twice e.g. when clicking a button. With this boolean set, while the first promise is still pending, subsequent loads would be ignored (not deferred!). When a subsequent load gets ignored, the "load" method returns the status "IGNORED" |
| isEmpty | Function  | undefined | Say, the result is `{ page: 1, items: [] }`, the default "isEmpty" would always evaluate to false since a filled object is considered not empty. You can tweak the check like this: `{ isEmpty: value => value.items.length < 1 }` |
| listen | Function | undefined | Listen to any state changes. Useful for integrations in libraries like Svelte or React.js | 

### usage with React.js

Usage with react differs in two ways

1. Import `usePromistate` from `promistate/lib/react`
2. `usePromistate` returns a tuple with the first value holding the state, and the second value holding all methods to update the state

```javascript
import React from "react";
import { usePromistate } from "promistate/lib/react";

export default function App() {
  const [todosPromise, todoActions] = usePromistate(somePromise);
  // todosPromise.value, todosPromise.isPending, ...
  // todoActions.load(), todoActions.reset(), todoActions.setValue('new Value')
}
```

### Typescript

To type the result of the promise you can make use of generics.

```typescript
import promistate from 'promistate'

promistate<string>(async function callback() {
    return 'updated'
}, { defaultValue: 'initial' })
```

## FAQ

### Can I use this for POST/PUT/DELETE requests as well?

Absolutely.

### an API call returns a page token which I need the next time I make a request to fetch the next page, I also need to append the data to the previous result

As long as you don't use arrow functions you can access the state using `this`.

```javascript
import promistate from 'promistate'

promistate(async function callback() {
    const result = await fetchItems(this.value.pageToken)
    return { pageToken: result.pageToken, items: this.items.concat(result.items) }
}, {
    defaultValue: { items: [], pageToken: null },
    isEmpty: value => value.items.length < 1,
})
```

### I need to manually change the value of a promise

Often times you want to reset the promise to its initial state. For this you can use the "reset" method.

But of course you can still mutate the value directly.

```javascript
import promistate from 'promistate'

const promise = promistate(() => fetch('...'))

promise.value // null
promise.isEmpty // true

promise.value = 2
promise.isEmpty // false
```

If you use the react hook, do it like this instead:

```javascript
import { usePromistate } from 'promistate/lib/react'

const [promise, actions] = usePromistate(() => fetch('...'))

actions.setValue(2)
```

### I need to make a lot of ajax requests, is there something better than regular `fetch`?

Sure, I personally use [fetch-me-json](https://github.com/MZanggl/fetch-me-json).

```javascript
import promistate from 'promistate'
import JSONFetch from 'fetch-me-json'

const promise = promistate(() => JSONFetch.get('/api/...'))
```

## Meta

### Compile project

`npm run build`

### Run tests

`npm test`
