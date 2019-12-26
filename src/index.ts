import { Options, State, CallbackArgs } from './types'

function isEmpty<T>(value: T | null) {
    if (Array.isArray(value)) {
        return value.length < 1
    }
    if (typeof value === 'object' && value !== null) {
        return Object.keys(<Object>value).length < 1
    }

    return value === undefined || value === null
}

function promistate<T>(action: (...args: CallbackArgs) => Promise<T>, options: Options<T> = {}) : State<T> {
    const { catchErrors = true, defaultValue = null } = options
    return {
        value: defaultValue,
        isPending: false,
        isEmpty: isEmpty<T>(defaultValue),
        error: null,
        async load(...args: CallbackArgs) {
            this.isPending = true
            this.isEmpty = false
            this.error = null

            return action(...args)
                .then((result: T) => {
                    this.isEmpty = isEmpty<T>(result)
                    this.value = result
                    this.isPending = false
                })
                .catch((error: Error) => {
                    this.isPending = false
                    this.value = defaultValue
                    if (!catchErrors) throw error
                    this.error = error
                })
        },
    }
}

export {
    promistate
}