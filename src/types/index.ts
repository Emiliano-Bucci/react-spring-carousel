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

export type SlideActionType = 'initial' | 'prev' | 'next'

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

export type EmitObservableFn = (
  data:
    | OnSlideStartChange
    | OnSlideChange
    | OnDrag
    | OnFullscreenChange
    | OnLeftSwipe
    | OnRightSwipe,
) => void

export type EventsObservableProps =
  | OnSlideStartChange
  | OnSlideChange
  | OnDrag
  | OnFullscreenChange
  | OnLeftSwipe
  | OnRightSwipe

export type ObservableCallbackFn = (data: EventsObservableProps) => void

export type UseListenToCustomEvent = (fn: ObservableCallbackFn) => void

export * from './useSpringCarousel'
export * from './useTransitionCarousel'
