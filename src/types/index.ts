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
  onRest?(): void
}

export type SlideActionType = 'prev' | 'next'

type OnSlideStartChange = {
  eventName: 'onSlideStartChange'
  slideActionType: SlideActionType
  nextItem: {
    index: number
    id: string
  }
}
type OnSlideChange = {
  eventName: 'onSlideChange'
  slideActionType: SlideActionType
  currentItem: {
    index: number
    id: string
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
  | OnSlideStartChange
  | OnSlideChange
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
