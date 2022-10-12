import { FullGestureState } from '@use-gesture/react'
import { useEffect, useRef } from 'react'
import { SlideActionType, SlideMode } from '../types/common'

const eventLabel = 'RSC::Event'

type OnSlideStartChange = {
  eventName: 'onSlideStartChange'
  slideActionType: SlideActionType
  slideMode: SlideMode
  nextItem: {
    index: number
    id: string
    startReached: boolean
    endReached: boolean
  }
}
type OnSlideChange = {
  eventName: 'onSlideChange'
  slideActionType: SlideActionType
  slideMode: SlideMode
  currentItem: {
    index: number
    id: string
    startReached: boolean
    endReached: boolean
  }
}
type OnFullscreenChange = {
  eventName: 'onFullscreenChange'
  isFullscreen: boolean
}
type OnDrag = Omit<FullGestureState<'drag'>, 'event'> & {
  eventName: 'onDrag'
  slideActionType: SlideActionType
}

type Events = OnSlideStartChange | OnSlideChange | OnDrag | OnFullscreenChange

type EventHandler = (props: Events) => void

export type EmitEvent = (event: Events) => void
export type UseListenToCustomEvent = {
  useListenToCustomEvent: (eventHandler: EventHandler) => void
  emitEvent: (event: Events) => void
}

export function useEventsModule() {
  const targetEvent = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    targetEvent.current = document.createElement('div')
  }, [])

  function useListenToCustomEvent(eventHandler: EventHandler) {
    useEffect(() => {
      function handleEvent(event: CustomEvent<Events>) {
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
    }, [])
  }
  function emitEvent(event: Events) {
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
