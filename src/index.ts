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
        listen,
        delay = 200,
    } = options

    return {
        timesInitiated: 0,
        timesSettled: 0,
        _value: defaultValue,
        _callback: callback,
        isPending: false,
        isDelayOver: false,
        _error: null,

        get value() {
            return this._value
        },

        set value(value: T | null) {
            this._value = value
            this.timesInitiated++
            listen && listen()
        },

        get error() {
            return this._error!
        },

        set error(error: Error | null) {
            this._error = error
            this.timesInitiated++
            listen && listen()
        },

        get isEmpty() {
            return this.isPending ? false : isEmpty(this._value)
        },

        reset() {
            this._value = defaultValue
            this.isPending = false
            this.isDelayOver = false
            this._error = null
            this.timesSettled = 0
            this.timesInitiated++
            listen && listen()
        },

        async load(...args: CallbackArgs) {
            if (ignoreLoadWhenPending && this.isPending) {
                return Status.IGNORED
            }

            const timesInitiated = this.timesInitiated + 1
            this.timesInitiated = timesInitiated
            const shouldIgnore = () => ignoreStaleLoad && this.timesInitiated !== timesInitiated
            this.isDelayOver = !delay
            this.isPending = true
            this._error = null
            listen && listen()

            if (delay) {
                setTimeout(() => {
                    if (this.isPending && !shouldIgnore()) {
                        this.isDelayOver = true
                        listen && listen()
                    }
                }, delay)
            }

            return Promise.resolve(this._callback.apply(this, args))
                .then((result: T) => {
                    if (shouldIgnore()) {
                        return Status.IGNORED
                    }
                    this.timesSettled = this.timesSettled + 1
                    this._value = result
                    this.isPending = false
                    this.isDelayOver = false
                    listen && listen()
                    return Status.RESOLVED
                })
                .catch((error: Error) => {
                    if (shouldIgnore()) {
                        return Status.IGNORED
                    }
                    this.timesSettled++
                    this.isPending = false
                    this.isDelayOver = false
                    this._value = defaultValue
                    this._error = error
                    listen && listen()
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
