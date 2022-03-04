import { useEffect, useRef } from 'react'
import { Subject } from 'rxjs'
import {
  UseSpringCarouselEventsObservableProps,
  UseTransitionCarouselEventsObservableProps,
  ObservableCallbackFn,
  EmitObservableFn,
} from '../types'

export function useCustomEventsModule<T>() {
  const eventsObserverRef = useRef(
    new Subject<
      T extends 'use-spring'
        ? UseSpringCarouselEventsObservableProps
        : UseTransitionCarouselEventsObservableProps
    >(),
  )

  function useListenToCustomEvent(fn: ObservableCallbackFn<T>) {
    useEffect(() => {
      const subscribe = eventsObserverRef.current.subscribe(fn)
      return () => subscribe.unsubscribe()
    }, [fn])
  }

  const emitObservable: EmitObservableFn<T> = data => {
    eventsObserverRef.current.next(data)
  }

  return {
    useListenToCustomEvent,
    emitObservable,
  }
}
