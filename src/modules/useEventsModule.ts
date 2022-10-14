import { FullGestureState } from '@use-gesture/react'
import { useEffect, useRef } from 'react'
import { SlideActionType, SlideMode, TransitionSlideMode } from '../types/common'

const eventLabel = 'RSC::Event'

type OnSlideStartChange<T> = {
  eventName: 'onSlideStartChange'
  slideActionType: SlideActionType
  slideMode: T extends 'use-spring' ? SlideMode : TransitionSlideMode
  nextItem: {
    index: number
    id: string
    startReached: boolean
    endReached: boolean
  }
}
type OnSlideChange<T> = {
  eventName: 'onSlideChange'
  slideActionType: SlideActionType
  slideMode: T extends 'use-spring' ? SlideMode : TransitionSlideMode
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

type SpringCarouselEvents<T> =
  | OnSlideStartChange<T>
  | OnSlideChange<T>
  | OnDrag
  | OnFullscreenChange

type TransitionCarouselEvents<T> =
  | OnSlideStartChange<T>
  | OnSlideChange<T>
  | OnFullscreenChange
  | OnLeftSwipe
  | OnRightSwipe

type Events<T> = T extends 'use-spring'
  ? SpringCarouselEvents<'use-spring'>
  : TransitionCarouselEvents<'use-transition'>

type EventHandler<T> = (props: Events<T>) => void

export type UseListenToCustomEvent<T> = {
  useListenToCustomEvent: (eventHandler: EventHandler<T>) => void
  emitEvent: (event: Events<T>) => void
}

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
