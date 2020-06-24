const test = require('japa')
const { default: promistate, PromistateStatus } = require('../dist/index')

test('can access default properties', (assert) => {
    const state = promistate(async () => 1)
    assert.isFalse(state.isPending)
    assert.isFalse(state.isDelayOver)
    assert.isTrue(state.isEmpty)
    assert.isNull(state.value)
    assert.isNull(state.error)
})

test('can set value through loading', async (assert) => {
    const state = promistate(async () => 1)
    const status = await state.load()

    assert.equal(status, PromistateStatus.RESOLVED)
    assert.equal(state.value, 1)
    assert.isFalse(state.isPending)
    assert.isFalse(state.isDelayOver)
    assert.isFalse(state.isEmpty)
    assert.isNull(state.error)
})

test('can pass values in load function', async (assert) => {
    const state = promistate(async (num1, num2) => num1 + num2)
    await state.load(5, 2)

    assert.equal(state.value, 7)
    assert.isFalse(state.isPending)
    assert.isFalse(state.isEmpty)
    assert.isNull(state.error)
})

test('sets empty when response is undefined, null, empty array or empty object', async (assert) => {
    const state = promistate(async (value) => value)

    await state.load(null)
    assert.isNull(state.value)
    assert.isTrue(state.isEmpty)

    await state.load(undefined)
    assert.isUndefined(state.value)
    assert.isTrue(state.isEmpty)

    await state.load([])
    assert.deepEqual(state.value, [])
    assert.isTrue(state.isEmpty)

    await state.load({})
    assert.deepEqual(state.value, {})
    assert.isTrue(state.isEmpty)
})

test('sets isPending during loading', async (assert) => {
    const state = promistate(() => {
        return new Promise((resolve) => setTimeout(resolve, 100))
    })

    state.load()
    assert.isTrue(state.isPending)
    assert.isFalse(state.isEmpty)
})

test('does not execute load function when state is still pending', async (assert) => {
    const state = promistate(value => {
        return new Promise((resolve) => setTimeout(() => resolve(value), 100))
    }, { ignoreLoadWhenPending: true })

    const promises = await Promise.all([
        state.load('load this'),
        state.load('dont load this'),
    ])

    assert.equal(state.value, 'load this')
    assert.deepEqual(promises, [PromistateStatus.RESOLVED, PromistateStatus.IGNORED])
})

test('catches errors', async (assert) => {
    const state = promistate(async () => {
        throw new Error('blub')
    })

    const status = await state.load()

    assert.equal(state.error.message, 'blub')
    assert.isFalse(state.isPending)
    assert.isFalse(state.isDelayOver)
    assert.isTrue(state.isEmpty)
    assert.isNull(state.value)
    assert.equal(status, PromistateStatus.ERROR)
})

test('resets value when crashing', async (assert) => {
    const state = promistate(async (value, forceCrash) => {
        if (forceCrash) throw new Error('blub')
        return value
    })

    await state.load(42, false)
    assert.equal(state.value, 42)

    await state.load(44, true)
    assert.equal(state.error.message, 'blub')
    assert.isNull(state.value)
})

test('does throw error when option is set to let it bubble up', async (assert) => {
    assert.plan(6)

    const state = promistate(async () => {
        throw new Error('blub')
    }, { catchErrors: false })

    try {
        await state.load()
    } catch (error) {
        assert.equal(error.message, 'blub')
    }

    assert.equal(state.error.message, 'blub')
    assert.isFalse(state.isPending)
    assert.isFalse(state.isDelayOver)
    assert.isTrue(state.isEmpty)
    assert.isNull(state.value)
})

test('can set default value', async (assert) => {
    const state = promistate(async () => 1, { defaultValue: 42 })

    assert.equal(state.value, 42)
    assert.isFalse(state.isEmpty)
})

test('can reset all values', async (assert) => {
    let state = promistate(async () => 1, { defaultValue: 42 })
    await state.load()
    state.reset()
    
    assert.equal(state.value, 42)
    assert.isFalse(state.isEmpty)

    state = promistate(async () => {
        throw new Error('test')
    })
    await state.load()
    state.reset()

    assert.isNull(state.error)
})

test('can pass custom isEmpty check', async (assert) => {
    const state = promistate(async () => ({ items: [1, 2], page: 1 }), {
        defaultValue: { items: [], page: 1 },
        isEmpty: value => value.items.length < 1,
    })

    assert.isTrue(state.isEmpty)
})

test('can access state in load function', async (assert) => {
    const state = promistate(async function() {
        return this.value + 1
    }, { defaultValue: 1 })

    await state.load()

    assert.equal(state.value, 2)
})

test('isEmpty reacts to value changes', async (assert) => {
    const state = promistate(async () => [], { defaultValue: [1] })
    assert.isFalse(state.isEmpty)

    state.value = []
    assert.isTrue(state.isEmpty)
})

test('can load using non promises', async (assert) => {
    const state = promistate(() => 1)
    await state.load()
    assert.equal(state.value, 1)
})

test('updates counter after loading resource', async (assert) => {
    const state = promistate(async () => 1)
    assert.equal(state.timesSettled, 0)
    
    await state.load()
    assert.equal(state.timesSettled, 1)

    await state.load()
    assert.equal(state.timesSettled, 2)
    
    state.reset()
    assert.equal(state.timesSettled, 0)
})

test('sets isDelayOver when value is pending more than set delay time', async (assert) => {
    assert.plan(2)
    const state = promistate(() => {
        return new Promise((resolve) => setTimeout(resolve, 100))
    }, { delay: 50})

    const promise = state.load()
    assert.isFalse(state.isDelayOver)
    setTimeout(() => {
        assert.isTrue(state.isDelayOver)
    }, 51)

    return promise
})

test('immediately sets isDelayOver to true when set delay is 0', async (assert) => {
    const state = promistate(() => {
        return new Promise((resolve) => setTimeout(resolve, 30))
    }, { delay: 0})

    state.load()
    assert.isTrue(state.isDelayOver)
})