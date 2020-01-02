import { Options, State, CallbackArgs, Status } from './types'

function isEmpty<T>(value: T | null) {
    if (Array.isArray(value)) {
        return value.length < 1
    }
    if (typeof value === 'object' && value !== null) {
        return Object.keys(<Object>value).length < 1
    }

    return value === undefined || value === null
}

function promistate<T>(action: (...args: CallbackArgs) => Promise<T>, options: Partial<Options<T>> = {}) : State<T> {
    const { catchErrors = true, defaultValue = null, ignoreLoadWhenPending = false } = options
    return {
        value: defaultValue,
        isPending: false,
        isEmpty: isEmpty<T>(defaultValue),
        error: null,

        reset() {
            this.value = defaultValue
            this.isPending = false
            this.isEmpty = isEmpty<T>(defaultValue)
            this.error = null
        },

        async load(...args: CallbackArgs) {
            if (ignoreLoadWhenPending && this.isPending) {
                return Status.IGNORED
            }

            this.isPending = true
            this.isEmpty = false
            this.error = null

            return action(...args)
                .then((result: T) => {
                    this.isEmpty = isEmpty<T>(result)
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

export {
    promistate,
    Status,
}
