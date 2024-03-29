import { useRef, useState, useEffect } from 'react'
import promistate, { PromistateResult, PromistateOptions } from '../..'
import { Callback } from '../../types'

type PromistateResultKeys = 'isEmpty' | 'value' | 'timesSettled' | 'isPending' | 'error' | 'isDelayOver'
export type PromistateReactState<T> = Pick<PromistateResult<T>, PromistateResultKeys>

function extractStyles<T>(state: PromistateResult<T>): PromistateReactState<T> {
  return {
    isEmpty: state.isEmpty,
    value: state.value,
    timesSettled: state.timesSettled,
    isPending: state.isPending,
    isDelayOver: state.isDelayOver,
    error: state.error
  }
}

type UsePromistateReturnType<T> = [
  PromistateReactState<T>,
  {
    setValue: (value: T) => void;
    setError: (value: Error | null) => void;
    reset: PromistateResult<T>['reset'];
    load: PromistateResult<T>['load'];
  }
]

export function usePromistate<T>(callback: Callback<T>, options: PromistateOptions<T> = {}, deps = []): UsePromistateReturnType<T> {
  let setState: React.Dispatch<React.SetStateAction<PromistateReactState<T>>> | undefined;

  const promiseRef = useRef(promistate<T>(callback, {
    ...options,
    listen() {
      setState && setState(extractStyles<T>(promiseRef.current))
      options.listen && options.listen()
    }
  }))

  useEffect(() => {
    promiseRef.current._callback = callback
  }, deps)

  const [state, setStateCopy] = useState(extractStyles(promiseRef.current))
  setState = setStateCopy

  const load = (...args: any[]) => promiseRef.current.load(...args)
  const reset = () => promiseRef.current.reset()
  const setValue = (value: T) => promiseRef.current.value = value
  const setError = (error: Error | null) => promiseRef.current.error = error

  return [state, { load, reset, setValue, setError }]
}
