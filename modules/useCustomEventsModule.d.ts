import { ObservableCallbackFn, EmitObservableFn } from '../types'
export declare function useCustomEventsModule(): {
  useListenToCustomEvent: (fn: ObservableCallbackFn) => void
  emitObservable: EmitObservableFn
}
