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

type OnLeftSwipe = {
  eventName: 'onLeftSwipe'
}

type OnRightSwipe = {
  eventName: 'onRightSwipe'
}

type SpringCarouselEvents =
  | OnSlideStartChange
  | OnSlideChange
  | OnDrag
  | OnFullscreenChange

type TransitionCarouselEvents =
  | OnSlideStartChange
  | OnSlideChange
  | OnFullscreenChange
  | OnLeftSwipe
  | OnRightSwipe

type Events<T> = T extends 'use-spring' ? SpringCarouselEvents : TransitionCarouselEvents

type EventHandler<T> = (props: Events<T>) => void

export type UseListenToCustomEvent<T> = {
  useListenToCustomEvent: (eventHandler: EventHandler<T>) => void
  emitEvent: (event: Events<T>) => void
}

export function useEventsModule<T extends 'use-spring' | 'use-transition'>() {
  const targetEvent = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    targetEvent.current = document.createElement('div')
  }, [])

  function useListenToCustomEvent(eventHandler: EventHandler<T>) {
    useEffect(() => {
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
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
