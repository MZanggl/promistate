import { Options, State, CallbackArgs, Status } from './types'

function isEmptyDefaultCheck<T>(value: T | null) {
    if (Array.isArray(value)) {
        return value.length < 1
    }
    if (typeof value === 'object' && value !== null) {
        return Object.keys(<Object>value).length < 1
    }

    return value === undefined || value === null
}

function promistate<T>(action: (...args: CallbackArgs) => Promise<T>, options: Partial<Options<T>> = {}) : State<T> {
    const {
        catchErrors = true,
        defaultValue = null,
        ignoreLoadWhenPending = false,
        isEmpty = isEmptyDefaultCheck,
    } = options

    return {
        value: defaultValue,
        isPending: false,
        error: null,

        get isEmpty() {
            return this.isPending ? false : isEmpty(this.value)
        },

        reset() {
            this.value = defaultValue
            this.isPending = false
            this.error = null
        },

        async load(...args: CallbackArgs) {
            if (ignoreLoadWhenPending && this.isPending) {
                return Status.IGNORED
            }

            this.isPending = true
            this.error = null

            return action.apply(this, args)
                .then((result: T) => {
                    this.value = result
                    this.isPending = false
                    return Status.RESOLVED
                })
                .catch((error: Error) => {
                    this.isPending = false
                    this.value = defaultValue
                    this.error = error
                    if (!catchErrors) throw error
                    return Status.ERROR
                })
        },
    }
}

export default promistate

export {
    Status as PromistateStatus,
}
