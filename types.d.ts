import { SpringConfig, TransitionFrom, TransitionTo } from 'react-spring'
import { FullGestureState } from '@use-gesture/react'
import { HTMLAttributes } from 'react'
export declare type ReactSpringThumbItem = {
  id: string
  renderThumb: React.ReactNode
}
export declare type ReactSpringCarouselItem = {
  id: string
  renderItem: React.ReactNode
  renderThumb: React.ReactNode
}
declare type ItemWithThumb = {
  withThumbs: true
  items: ReactSpringCarouselItem[]
  enableThumbsWrapperScroll?: boolean
  prepareThumbsData?: PrepareThumbsData
}
declare type ItemWithNoThumb = {
  withThumbs?: false
  enableThumbsWrapperScroll?: never
  prepareThumbsData?: never
  items: {
    id: string
    renderItem: React.ReactNode
    renderThumb?: never
  }[]
}
export declare type UseSpringCarouselItems = ItemWithThumb | ItemWithNoThumb
export declare type BaseCarouselSharedProps = {
  withLoop?: boolean
  disableGestures?: boolean
  draggingSlideTreshold?: number
  springConfig?: SpringConfig
  thumbsSlideAxis?: 'x' | 'y'
  CustomThumbsWrapperComponent?: React.FC<HTMLAttributes<HTMLElement>>
}
declare type UseSpringCarouselLoopProps = {
  withLoop: true
  startEndGutter?: number
  freeScroll?: never
}
declare type UseSpringCarouselNoLoopProps = {
  withLoop?: false
  startEndGutter?: never
  freeScroll?: boolean
}
export declare type UseSpringCarouselFluidType = {
  itemsPerSlide: 'fluid'
  slideAmount?: number
  initialStartingPosition?: never
  initialActiveItem?: never
  freeScroll?: boolean
}
declare type UseSpringCarouselFixedSlideType = {
  itemsPerSlide?: number
  slideAmount?: never
  initialStartingPosition?: 'start' | 'center' | 'end'
  initialActiveItem?: number
  freeScroll?: never
}
export declare type UseSpringCarouselProps = Omit<BaseCarouselSharedProps, 'withLoop'> & {
  shouldResizeOnWindowResize?: boolean
  carouselSlideAxis?: 'x' | 'y'
  gutter?: number
  touchAction?: 'none' | 'pan-x' | 'pan-y'
} & (UseSpringCarouselLoopProps | UseSpringCarouselNoLoopProps) &
  (UseSpringCarouselFluidType | UseSpringCarouselFixedSlideType) &
  UseSpringCarouselItems
export declare type PrepareThumbsData = (
  items: ReactSpringThumbItem[],
) => ReactSpringThumbItem[]
export declare type SlideToItemFnProps = {
  from?: number
  to?: number
  newIndex?: number
  immediate?: boolean
  customTo?: number
  onRest?(): void
}
export declare type SpringAnimationProps = {
  initial: TransitionFrom<ReactSpringCarouselItem>
  from: TransitionFrom<ReactSpringCarouselItem>
  enter: TransitionTo<ReactSpringCarouselItem>
  leave: TransitionTo<ReactSpringCarouselItem>
}
export declare type UseTransitionCarouselProps = BaseCarouselSharedProps &
  UseSpringCarouselItems & {
    toPrevItemSpringProps?: SpringAnimationProps
    toNextItemSpringProps?: SpringAnimationProps
    springAnimationProps?: SpringAnimationProps
  }
export declare type UseSpringFluidTypeReturnProps = {
  useListenToCustomEvent: UseListenToCustomEvent
  getIsFullscreen(): boolean
  getIsPrevItem(id: string): boolean
  getIsNextItem(id: string): boolean
  enterFullscreen(elementRef?: HTMLElement): void
  exitFullscreen(): void
  slideToNextItem(): void
  slideToPrevItem(): void
  getIsAnimating(): boolean
  getIsDragging(): boolean
}
export declare type UseSpringFixedSlideTypeReturnProps = {
  useListenToCustomEvent: UseListenToCustomEvent
  getIsFullscreen(): boolean
  getIsPrevItem(id: string): boolean
  getIsNextItem(id: string): boolean
  enterFullscreen(elementRef?: HTMLElement): void
  exitFullscreen(): void
  slideToNextItem(): void
  slideToPrevItem(): void
  getIsAnimating(): boolean
  slideToItem(item: string | number): void
  getIsActiveItem(id: string): boolean
  getIsDragging(): boolean
  getCurrentActiveItem(): {
    id: string
    index: number
  }
}
export declare type UseTransitionCarouselContextProps = {
  useListenToCustomEvent: UseListenToCustomEvent
  getIsFullscreen(): boolean
  getIsPrevItem(id: string): boolean
  getIsNextItem(id: string): boolean
  enterFullscreen(elementRef?: HTMLElement): void
  exitFullscreen(): void
  slideToNextItem(): void
  slideToPrevItem(): void
  getIsAnimating(): boolean
  slideToItem(item: string | number): void
  getIsActiveItem(id: string): boolean
  getCurrentActiveItem(): {
    id: string
    index: number
  }
  activeItem: number
}
export declare type SlideActionType = 'initial' | 'prev' | 'next'
declare type OnSlideStartChange = {
  eventName: 'onSlideStartChange'
  slideActionType: SlideActionType
  nextItem: {
    index: number
    id: string
  }
}
declare type OnSlideChange = {
  eventName: 'onSlideChange'
  slideActionType: SlideActionType
  currentItem: {
    index: number
    id: string
  }
}
declare type OnDrag = Omit<FullGestureState<'drag'>, 'event'> & {
  eventName: 'onDrag'
  slideActionType: SlideActionType
}
declare type OnFullscreenChange = {
  eventName: 'onFullscreenChange'
  isFullscreen: boolean
}
declare type OnLeftSwipe = {
  eventName: 'onLeftSwipe'
}
declare type OnRightSwipe = {
  eventName: 'onRightSwipe'
}
export declare type EmitObservableFn = (
  data:
    | OnSlideStartChange
    | OnSlideChange
    | OnDrag
    | OnFullscreenChange
    | OnLeftSwipe
    | OnRightSwipe,
) => void
export declare type EventsObservableProps =
  | OnSlideStartChange
  | OnSlideChange
  | OnDrag
  | OnFullscreenChange
  | OnLeftSwipe
  | OnRightSwipe
export declare type ObservableCallbackFn = (data: EventsObservableProps) => void
export declare type UseListenToCustomEvent = (fn: ObservableCallbackFn) => void
export {}
