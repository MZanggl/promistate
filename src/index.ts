interface Options<T> {
    catchErrors?: boolean;
    defaultValue?: T;
}

type CallbackArgs = any[]

interface State<T> {
    value: T | null;
    isPending: boolean;
    isEmpty: boolean;
    error: Error | null;
    load: (...args: CallbackArgs) => Promise<void>;
}

function isEmpty<T>(value: T | null) {
    if (Array.isArray(value)) {
        return value.length < 1
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

module.exports = {
    promistate
}