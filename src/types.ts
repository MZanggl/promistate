export interface Options<T> {
    catchErrors?: boolean;
    defaultValue?: T;
}

export type CallbackArgs = any[]

export interface State<T> {
    value: T | null;
    isPending: boolean;
    isEmpty: boolean;
    error: Error | null;
    load: (...args: CallbackArgs) => Promise<void>;
}