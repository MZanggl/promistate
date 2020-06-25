import { CallbackArgs, Callback, Options, Status, Result } from './types'

function isEmptyDefaultCheck<T>(value: T | null) {
    if (Array.isArray(value)) {
        return value.length < 1
    }
    if (typeof value === 'object' && value !== null) {
        return Object.keys(<Object>value).length < 1
    }

    return value === undefined || value === null
}

function promistate<T>(callback: Callback<T>, options: Options<T> = {}) : Result<T> {
    const {
        catchErrors = true,
        defaultValue = null,
        ignoreLoadWhenPending = false,
        isEmpty = isEmptyDefaultCheck,
        ignoreStaleLoad = false,
    } = options

    return {
        timesInitiated: 0,
        timesSettled: 0,
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
            this.timesSettled = 0
            this.timesInitiated++
        },

        async load(...args: CallbackArgs) {
            if (ignoreLoadWhenPending && this.isPending) {
                return Status.IGNORED
            }

            const timesInitiated = this.timesInitiated + 1
            this.timesInitiated = timesInitiated
            this.isPending = true
            this.error = null

            return Promise.resolve(callback.apply(this, args))
                .then((result: T) => {
                    if (ignoreStaleLoad && this.timesInitiated !== timesInitiated) {
                        return Status.IGNORED
                    }
                    this.timesSettled = this.timesSettled + 1
                    this.value = result
                    this.isPending = false
                    return Status.RESOLVED
                })
                .catch((error: Error) => {
                    if (ignoreStaleLoad && this.timesInitiated !== timesInitiated) {
                        return Status.IGNORED
                    }
                    this.timesSettled++
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
    Result as PromistateResult,
    Options as PromistateOptions,
}
