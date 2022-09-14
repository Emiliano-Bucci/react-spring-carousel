import { FullGestureState } from '@use-gesture/react'
import { ReactSpringCarouselItemWithThumbs } from './useSpringCarousel'

export type PrepareThumbsData = (
  items: Omit<ReactSpringCarouselItemWithThumbs, 'renderItem'>[],
) => Omit<ReactSpringCarouselItemWithThumbs, 'renderItem'>[]

export type SlideToItemFnProps = {
  from?: number
  to?: number
  newIndex?: number
  immediate?: boolean
  customTo?: number
  velocity?: number[]
  startReached: boolean
  endReached: boolean
  mode: SlideMode
  onRest?(): void
}

export type SlideActionType = 'prev' | 'next'
export type SlideMode = 'drag' | 'click'

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

type OnDrag = Omit<FullGestureState<'drag'>, 'event'> & {
  eventName: 'onDrag'
  slideActionType: SlideActionType
}

type OnFullscreenChange = {
  eventName: 'onFullscreenChange'
  isFullscreen: boolean
}

type OnLeftSwipe = {
  eventName: 'onLeftSwipe'
}

type OnRightSwipe = {
  eventName: 'onRightSwipe'
}

export type UseSpringCarouselEventsObservableProps =
  | OnSlideStartChange
  | OnSlideChange
  | OnDrag
  | OnFullscreenChange
export type UseTransitionCarouselEventsObservableProps =
  | Omit<OnSlideStartChange, 'slideMode'>
  | Omit<OnSlideChange, 'slideMode'>
  | OnFullscreenChange
  | OnLeftSwipe
  | OnRightSwipe

type CombinedProps<T> = T extends 'use-spring'
  ? UseSpringCarouselEventsObservableProps
  : UseTransitionCarouselEventsObservableProps
export type EmitObservableFn<T> = (data: CombinedProps<T>) => void
export type ObservableCallbackFn<T> = (data: CombinedProps<T>) => void

export type UseListenToCustomEvent<T> = (fn: ObservableCallbackFn<T>) => void

export * from './useSpringCarousel'
export * from './useTransitionCarousel'
