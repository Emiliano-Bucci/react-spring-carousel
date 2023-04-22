import { useEffect, useRef } from 'react'

import { EventHandler, Events } from '../types/useEventsModule.types'

const eventLabel = 'RSC::Event'

export function useEventsModule<T extends 'use-spring' | 'use-transition'>() {
  const targetEvent = useRef<HTMLDivElement | null>(null)

  function useListenToCustomEvent(eventHandler: EventHandler<T>) {
    useEffect(() => {
      if (!targetEvent.current) {
        targetEvent.current = document.createElement('div')
      }

      function handleEvent(event: CustomEvent<Events<T>>) {
        eventHandler(event.detail)
      }

      if (targetEvent.current) {
        // @ts-ignore
        targetEvent.current.addEventListener(eventLabel, handleEvent, false)
        return () => {
          // @ts-ignore
          targetEvent.current?.removeEventListener(eventLabel, handleEvent, false)
        }
      }
    }, [eventHandler])
  }
  function emitEvent(event: Events<T>) {
    if (targetEvent.current) {
      const newEvent = new CustomEvent(eventLabel, {
        detail: event,
      })
      targetEvent.current.dispatchEvent(newEvent)
    }
  }

  return {
    useListenToCustomEvent,
    emitEvent,
  }
}
