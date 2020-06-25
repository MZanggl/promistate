export interface Options<T> {
    catchErrors?: boolean;
    defaultValue?: T;
    ignoreLoadWhenPending?: boolean;
    isEmpty?<T>(value: T | null): boolean;
    ignoreStaleLoad?: boolean;
}

export enum Status {
    IGNORED = 'IGNORED',
    RESOLVED = 'RESOLVED',
    ERROR = 'ERROR',
}

export type Callback<T> = (...args: CallbackArgs) => Promise<T>
export type CallbackArgs = any[]

export interface Result<T> {
    timesInitiated: number;
    timesSettled: number;
    value: T | null;
    isPending: boolean;
    isEmpty: boolean;
    error: Error | null;
    reset: () => void;
    load: (...args: CallbackArgs) => Promise<Status>;
}