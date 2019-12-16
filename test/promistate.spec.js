const test = require('japa')
const { promistate } = require('../dist/index')

test('can access default properties', (assert) => {
    const state = promistate(async () => 1)
    assert.isFalse(state.isPending)
    assert.isTrue(state.isEmpty)
    assert.isNull(state.value)
    assert.isNull(state.error)
})

test('can set value through loading', async (assert) => {
    const state = promistate(async () => 1)
    await state.load()

    assert.equal(state.value, 1)
    assert.isFalse(state.isPending)
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

test('catches errors', async (assert) => {
    const state = promistate(async () => {
        throw new Error('blub')
    })

    await state.load()

    assert.equal(state.error.message, 'blub')
    assert.isFalse(state.isPending)
    assert.isFalse(state.isEmpty)
    assert.isNull(state.value)
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

test('does not catch error when option is set to let it bubble up', async (assert) => {
    assert.plan(5)

    const state = promistate(async () => {
        throw new Error('blub')
    }, { catchErrors: false })

    try {
        await state.load()
    } catch (error) {
        assert.equal(error.message, 'blub')
    }

    assert.isNull(state.error)
    assert.isFalse(state.isPending)
    assert.isFalse(state.isEmpty)
    assert.isNull(state.value)
})

test('can set default value', async (assert) => {
    const state = promistate(async () => 1, { defaultValue: 42 })

    assert.equal(state.value, 42)
    assert.isFalse(state.isEmpty)
})
