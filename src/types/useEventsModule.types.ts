import { FullGestureState } from '@use-gesture/react'

import { SlideActionType, SlideMode, TransitionSlideMode } from './common'
export type OnSlideStartChange<T> = {
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
export type OnSlideChange<T> = {
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
export type OnFullscreenChange = {
  eventName: 'onFullscreenChange'
  isFullscreen: boolean
}
export type OnDrag = Omit<FullGestureState<'drag'>, 'event'> & {
  eventName: 'onDrag'
  slideActionType: SlideActionType
}
export type OnLeftSwipe = {
  eventName: 'onLeftSwipe'
}
export type OnRightSwipe = {
  eventName: 'onRightSwipe'
}
export type SpringCarouselEvents<T> =
  | OnSlideStartChange<T>
  | OnSlideChange<T>
  | OnDrag
  | OnFullscreenChange
export type TransitionCarouselEvents<T> =
  | OnSlideStartChange<T>
  | OnSlideChange<T>
  | OnFullscreenChange
  | OnLeftSwipe
  | OnRightSwipe
export type Events<T> = T extends 'use-spring'
  ? SpringCarouselEvents<'use-spring'>
  : TransitionCarouselEvents<'use-transition'>
export type EventHandler<T> = (props: Events<T>) => void
export type UseListenToCustomEvent<T> = {
  useListenToCustomEvent: (eventHandler: EventHandler<T>) => void
  emitEvent: (event: Events<T>) => void
}
